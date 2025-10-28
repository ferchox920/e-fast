'use client';
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import {
  useListNotificationsQuery,
  useUpdateNotificationMutation,
} from '@/store/api/notificationsApi';
import { notificationWSClient } from '@/realtime/NotificationWSClient';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectNotificationEntities,
  selectNotificationsPage,
  selectUnreadCount,
  upsertMany,
  upsertOne,
  markRead,
  replaceNotification,
} from '@/store/slices/notificationsSlice';
import type { NotificationEntity } from '@/notifications/normalize';
import type { NotificationRead } from '@/types/notifications';
import type { ConnectionStatus } from '@/realtime/NotificationWSClient';
import { showErrorToast } from '@/lib/toast';

const NOTIFICATIONS_WS_ENABLED = process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_ENABLED !== 'false';

const EMPTY_NOTIFICATIONS: NotificationEntity[] = [];

const arrayShallowEqual = <T>(a?: readonly T[] | null, b?: readonly T[] | null) => {
  if (a === b) return true;
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export interface UseNotificationsListParams {
  limit?: number;
  offset?: number;
}

export const useNotificationsList = (params: UseNotificationsListParams = {}) => {
  const dispatch = useAppDispatch();

  const { limit, offset = 0 } = params;
  const token = useAppSelector((state) => state.user?.session?.accessToken ?? null);
  const status = useAppSelector((state) => state.user?.status ?? 'idle');
  const shouldFetch = Boolean(token && status === 'authenticated');

  const queryState = useListNotificationsQuery({ limit, offset }, { skip: !shouldFetch });

  const entities = useAppSelector(selectNotificationEntities);
  const fallbackItems = useAppSelector(
    (state) => selectNotificationsPage(state, limit, offset),
    arrayShallowEqual,
  );

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }
    if (queryState.data?.items?.length) {
      dispatch(upsertMany(queryState.data.items));
    }
  }, [dispatch, queryState.data?.items, shouldFetch]);

  const items = useMemo(() => {
    if (!shouldFetch) {
      return EMPTY_NOTIFICATIONS;
    }
    const result =
      queryState.data?.items?.map((item) => entities[item.id]).filter(Boolean) ?? fallbackItems;
    return result;
  }, [entities, fallbackItems, queryState.data?.items, shouldFetch]);

  return {
    items,
    total: shouldFetch ? (queryState.data?.total ?? fallbackItems.length) : 0,
    limit: shouldFetch
      ? (queryState.data?.limit ?? limit ?? items.length)
      : (limit ?? items.length),
    offset: shouldFetch ? (queryState.data?.offset ?? offset) : offset,
    isLoading: shouldFetch ? queryState.isLoading : false,
    isFetching: shouldFetch ? queryState.isFetching : false,
    isError: shouldFetch ? queryState.isError : false,
    error: shouldFetch ? queryState.error : undefined,
    refetch: queryState.refetch,
  };
};

export const useUnreadCounter = () => {
  return useAppSelector(selectUnreadCount);
};

export const useNotificationStream = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.user?.session?.accessToken ?? null);
  const status = useAppSelector((state) => state.user?.status ?? 'idle');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!NOTIFICATIONS_WS_ENABLED || !token || status !== 'authenticated') {
      notificationWSClient.disconnect();
      return;
    }

    const unsubscribe = notificationWSClient.onNotification((payload) => {
      dispatch(upsertOne(payload as NotificationRead));
    });

    try {
      notificationWSClient.connect(token);
    } catch (error) {
      console.error('useNotificationStream: failed to connect websocket', error);
      unsubscribe();
      return () => undefined;
    }

    return () => {
      unsubscribe();
      notificationWSClient.disconnect();
    };
  }, [dispatch, status, token]);
};

export const useNotificationConnectionStatus = () => {
  return useSyncExternalStore<ConnectionStatus>(
    (listener) => notificationWSClient.onStatusChange(listener),
    () => notificationWSClient.getStatus(),
    () => 'disconnected',
  );
};

export const useMarkNotificationRead = () => {
  const dispatch = useAppDispatch();
  const [updateNotification] = useUpdateNotificationMutation();
  const entities = useAppSelector(selectNotificationEntities);

  return useCallback(
    async (id: string, isRead: boolean) => {
      const previous = entities[id];
      const optimisticReadAt = isRead ? (previous?.read_at ?? undefined) : undefined;

      dispatch(markRead({ id, is_read: isRead, read_at: optimisticReadAt }));

      try {
        const updated = await updateNotification({ id, is_read: isRead }).unwrap();
        if (updated) {
          dispatch(upsertOne(updated));
        }
      } catch (error) {
        if (previous) {
          dispatch(replaceNotification(previous));
        }
        showErrorToast('No pudimos actualizar la notificacion. Intenta nuevamente.');
        console.error('useMarkNotificationRead: failed to update notification', error);
        throw error;
      }
    },
    [dispatch, entities, updateNotification],
  );
};
