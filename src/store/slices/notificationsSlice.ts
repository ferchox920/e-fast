import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';
import type { NotificationRead } from '@/types/notifications';
import { normalizeNotification, type NotificationEntity } from '@/notifications/normalize';

interface NotificationsState {
  entities: Record<string, NotificationEntity>;
  ids: string[];
  unreadCount: number;
}

const initialState: NotificationsState = {
  entities: {},
  ids: [],
  unreadCount: 0,
};

const collectNormalized = (notifications: NotificationRead[]): NotificationEntity[] =>
  notifications
    .map(normalizeNotification)
    .filter((item): item is NotificationEntity => item !== null);

const recalculateDerived = (state: NotificationsState) => {
  state.ids = Object.values(state.entities)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((notification) => notification.id);

  state.unreadCount = state.ids.reduce((acc, id) => acc + (state.entities[id]?.is_read ? 0 : 1), 0);
};

const upsertManyReducer = (state: NotificationsState, notifications: NotificationEntity[]) => {
  if (!notifications.length) return;

  let changed = false;

  notifications.forEach((notification) => {
    const existing = state.entities[notification.id];
    if (!existing) {
      state.entities[notification.id] = notification;
      changed = true;
      return;
    }

    const merged: NotificationEntity = {
      ...existing,
      ...notification,
      meta: notification.meta ?? existing.meta,
    };

    const hasDifference =
      existing.is_read !== merged.is_read ||
      existing.read_at !== merged.read_at ||
      existing.created_at !== merged.created_at ||
      existing.title !== merged.title ||
      existing.message !== merged.message ||
      existing.type !== merged.type ||
      existing.payload !== merged.payload ||
      existing.meta !== merged.meta;

    if (hasDifference) {
      state.entities[notification.id] = merged;
      changed = true;
    }
  });

  if (changed) {
    recalculateDerived(state);
  }
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<NotificationRead[]>) {
      const normalized = collectNormalized(action.payload);
      upsertManyReducer(state, normalized);
    },
    upsertOne(state, action: PayloadAction<NotificationRead>) {
      const normalized = normalizeNotification(action.payload);
      if (!normalized) return;
      upsertManyReducer(state, [normalized]);
    },
    markRead(
      state,
      action: PayloadAction<{ id: string; is_read: boolean; read_at?: string | null }>,
    ) {
      const { id, is_read, read_at } = action.payload;
      const existing = state.entities[id];
      if (!existing) return;

      const nextReadAt =
        read_at ?? (is_read ? (existing.read_at ?? new Date().toISOString()) : null);

      const updated: NotificationEntity = {
        ...existing,
        is_read,
        read_at: nextReadAt,
      };

      state.entities[id] = updated;
      recalculateDerived(state);
    },
    replaceNotification(state, action: PayloadAction<NotificationEntity>) {
      const notification = action.payload;
      state.entities[notification.id] = notification;
      recalculateDerived(state);
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const { upsertMany, upsertOne, markRead, replaceNotification, reset } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;

const selectNotificationsState = (state: RootState) => state.notifications;

export const selectNotificationEntities = createSelector(
  selectNotificationsState,
  (state) => state.entities,
);

export const selectNotificationIds = createSelector(selectNotificationsState, (state) => state.ids);

export const selectNotificationsOrdered = createSelector(
  [selectNotificationIds, selectNotificationEntities],
  (ids, entities) => ids.map((id) => entities[id]).filter(Boolean),
);

export const selectUnreadCount = createSelector(
  selectNotificationsState,
  (state) => state.unreadCount,
);

export const selectNotificationsPage = (state: RootState, limit?: number, offset = 0) => {
  const ordered = selectNotificationsOrdered(state);
  if (typeof limit === 'number') {
    return ordered.slice(offset, offset + limit);
  }
  if (offset) {
    return ordered.slice(offset);
  }
  return ordered;
};
