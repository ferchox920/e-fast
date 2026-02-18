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

type RawNotificationsResponse = ListNotificationsResponse | NotificationRead[] | undefined;

const normalizeNotificationsResponse = (
  response: RawNotificationsResponse,
  args?: ListNotificationsParams,
): ListNotificationsResponse => {
  const fallbackLimit = args?.limit ?? 50;
  const fallbackOffset = args?.offset ?? 0;

  if (Array.isArray(response)) {
    const items = [...response].sort(sortByCreatedAtDesc);
    return {
      items,
      total: items.length,
      limit: fallbackLimit,
      offset: fallbackOffset,
    };
  }

  if (!response || typeof response !== 'object') {
    return {
      items: [],
      total: 0,
      limit: fallbackLimit,
      offset: fallbackOffset,
    };
  }

  const items = Array.isArray(response.items) ? [...response.items].sort(sortByCreatedAtDesc) : [];
  const total =
    typeof response.total === 'number' && Number.isFinite(response.total)
      ? response.total
      : items.length;
  const limit =
    typeof response.limit === 'number' && Number.isFinite(response.limit)
      ? response.limit
      : fallbackLimit;
  const offset =
    typeof response.offset === 'number' && Number.isFinite(response.offset)
      ? response.offset
      : fallbackOffset;

  return {
    items,
    total,
    limit,
    offset,
  };
};

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listNotifications: build.query<ListNotificationsResponse, ListNotificationsParams | void>({
      query: ({ limit = 50, offset = 0 } = {}) => ({
        url: '/notifications',
        params: { limit, offset },
      }),
      transformResponse: (response: RawNotificationsResponse, _meta, args) =>
        normalizeNotificationsResponse(response, args ?? undefined),
      providesTags: (result) => [
        ...(result?.items?.map(({ id }) => ({ type: 'Notification' as const, id })) ?? []),
        { type: 'NotificationList' as const, id: 'LIST' },
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
        { type: 'NotificationList' as const, id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useLazyListNotificationsQuery,
  useUpdateNotificationMutation,
} = notificationsApi;
