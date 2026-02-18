import { baseApi } from './baseApi';
import type {
  CustomerEngagementRead,
  EventCreateInput,
  ProductEngagementRead,
} from '@/types/engagement';

export const engagementApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    ingestEvent: build.mutation<ProductEngagementRead, EventCreateInput>({
      query: (body) => ({
        url: '/events',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, _error, body) => [
        { type: 'Engagement', id: result?.product_id ?? body.product_id },
        ...(body.user_id ? [{ type: 'Engagement' as const, id: `CUSTOMER:${String(body.user_id)}` }] : []),
      ],
    }),
    getProductEngagement: build.query<
      ProductEngagementRead[],
      { productId: string; day?: string }
    >({
      query: ({ productId, day }) => ({
        url: `/events/products/${productId}`,
        params: day ? { day } : undefined,
      }),
      providesTags: (result, _error, { productId }) => [
        { type: 'Engagement', id: productId },
        { type: 'Engagement', id: 'PRODUCT_SERIES' },
        ...(result?.map((item) => ({ type: 'Engagement' as const, id: item.product_id })) ?? []),
      ],
    }),
    getCustomerEngagement: build.query<
      CustomerEngagementRead[],
      { userId: string; day?: string }
    >({
      query: ({ userId, day }) => ({
        url: `/events/customers/${userId}`,
        params: day ? { day } : undefined,
      }),
      providesTags: (result, _error, { userId }) => [
        { type: 'Engagement', id: `CUSTOMER:${userId}` },
        { type: 'Engagement', id: 'CUSTOMER_SERIES' },
        ...(result?.map((item) => ({
          type: 'Engagement' as const,
          id: `CUSTOMER:${item.customer_id}`,
        })) ?? []),
      ],
    }),
  }),
});

export const {
  useIngestEventMutation,
  useGetProductEngagementQuery,
  useLazyGetProductEngagementQuery,
  useGetCustomerEngagementQuery,
  useLazyGetCustomerEngagementQuery,
} = engagementApi;
