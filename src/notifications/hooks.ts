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
import type { NotificationRead } from '@/types/notifications';
import type { ConnectionStatus } from '@/realtime/NotificationWSClient';
import { showErrorToast } from '@/lib/toast';

export interface UseNotificationsListParams {
  limit?: number;
  offset?: number;
}

export const useNotificationsList = (params: UseNotificationsListParams = {}) => {
  const dispatch = useAppDispatch();

  const { limit, offset = 0 } = params;
  const queryState = useListNotificationsQuery({ limit, offset });

  const entities = useAppSelector(selectNotificationEntities);
  const fallbackItems = useAppSelector((state) => selectNotificationsPage(state, limit, offset));

  useEffect(() => {
    if (queryState.data?.items?.length) {
      dispatch(upsertMany(queryState.data.items));
    }
  }, [dispatch, queryState.data?.items]);

  const items = useMemo(() => {
    const result =
      queryState.data?.items?.map((item) => entities[item.id]).filter(Boolean) ?? fallbackItems;
    return result;
  }, [entities, fallbackItems, queryState.data?.items]);

  return {
    items,
    total: queryState.data?.total ?? fallbackItems.length,
    limit: queryState.data?.limit ?? limit ?? items.length,
    offset: queryState.data?.offset ?? offset,
    isLoading: queryState.isLoading,
    isFetching: queryState.isFetching,
    isError: queryState.isError,
    error: queryState.error,
    refetch: queryState.refetch,
  };
};

export const useUnreadCounter = () => {
  return useAppSelector(selectUnreadCount);
};

export const useNotificationStream = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.user.token);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!token) {
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
  }, [dispatch, token]);
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
