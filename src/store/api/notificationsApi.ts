import { baseApi } from './baseApi';
import type { NotificationRead, NotificationUpdate } from '@/types/notifications';

export interface ListNotificationsParams {
  limit?: number;
  offset?: number;
}

export interface ListNotificationsResponse {
  items: NotificationRead[];
  total: number;
  limit: number;
  offset: number;
}

const sortByCreatedAtDesc = (a: NotificationRead, b: NotificationRead) => {
  if (a.created_at === b.created_at) return 0;
  return a.created_at < b.created_at ? 1 : -1;
};

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listNotifications: build.query<ListNotificationsResponse, ListNotificationsParams | void>({
      query: ({ limit = 50, offset = 0 } = {}) => ({
        url: '/notifications',
        params: { limit, offset },
      }),
      transformResponse: (response: ListNotificationsResponse) => ({
        ...response,
        items: [...(response.items ?? [])].sort(sortByCreatedAtDesc),
      }),
      providesTags: (result) => [
        ...(result?.items?.map(({ id }) => ({ type: 'Notification' as const, id })) ?? []),
        { type: 'NotificationList' as const },
      ],
    }),
    updateNotification: build.mutation<
      NotificationRead,
      { id: NotificationRead['id'] } & NotificationUpdate
    >({
      query: ({ id, ...body }) => ({
        url: `/notifications/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Notification' as const, id },
        { type: 'NotificationList' as const },
      ],
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useLazyListNotificationsQuery,
  useUpdateNotificationMutation,
} = notificationsApi;
