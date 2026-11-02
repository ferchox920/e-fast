import { baseApi } from './baseApi';
import type {
  CheckoutQuoteInput,
  CheckoutQuoteRead,
  ListOrdersParams,
  OrderCreateInput,
  OrderFromCartInput,
  OrderLineCreateInput,
  OrderRead,
  ShipmentCreateInput,
} from '@/types/order';

const mapListOrdersParams = (params?: ListOrdersParams) => {
  if (!params) return undefined;

  const query: Record<string, string | number> = {};

  if (params.status) query.status = params.status;
  if (params.payment_status) query.payment_status = params.payment_status;
  if (params.shipping_status) query.shipping_status = params.shipping_status;
  if (params.user_id) query.user_id = params.user_id;

  const hasExplicitLimit = typeof params.limit === 'number';
  const hasExplicitOffset = typeof params.offset === 'number';
  if (hasExplicitLimit) query.limit = Math.max(1, params.limit as number);
  if (hasExplicitOffset) query.offset = Math.max(0, params.offset as number);

  if (!hasExplicitLimit || !hasExplicitOffset) {
    const pageSize = params.page_size ?? (hasExplicitLimit ? undefined : 100);
    const page = params.page ?? 1;
    if (typeof pageSize === 'number' && pageSize > 0) {
      query.limit = pageSize;
      if (!hasExplicitOffset) {
        const safePage = page > 0 ? page : 1;
        query.offset = (safePage - 1) * pageSize;
      }
    }
  }

  return Object.keys(query).length ? query : undefined;
};

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listOrders: build.query<OrderRead[], ListOrdersParams | undefined>({
      query: (params) => ({
        url: '/orders',
        params: mapListOrdersParams(params ?? undefined),
      }),
      providesTags: (result) =>
        result && result.length > 0
          ? [
              ...result.map((order) => ({ type: 'AdminOrder' as const, id: order.id })),
              { type: 'AdminOrder', id: 'LIST' },
            ]
          : [{ type: 'AdminOrder', id: 'LIST' }],
    }),
    createOrder: build.mutation<OrderRead, OrderCreateInput>({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'AdminOrder', id: 'LIST' }],
    }),
    getCheckoutQuote: build.query<CheckoutQuoteRead, CheckoutQuoteInput>({
      query: (body) => ({
        url: '/orders/checkout-quote',
        method: 'POST',
        body,
      }),
    }),
    createOrderFromCart: build.mutation<OrderRead, OrderFromCartInput | undefined>({
      query: (payload) => ({
        url: '/orders/from-cart',
        method: 'POST',
        body: {
          guest_token: payload?.guestToken ?? null,
          shipping_method: payload?.shipping_method ?? 'standard',
          applied_promotions: payload?.applied_promotions ?? [],
          shipping_address: payload?.shipping_address ?? null,
          notes: payload?.notes ?? null,
        },
      }),
      invalidatesTags: [
        { type: 'AdminOrder', id: 'LIST' },
        { type: 'Cart', id: 'CURRENT' },
      ],
    }),
    getOrderById: build.query<OrderRead, { orderId: string }>({
      query: ({ orderId }) => ({
        url: `/orders/${orderId}`,
      }),
      providesTags: (result, _error, { orderId }) => [
        { type: 'AdminOrder', id: result?.id ?? orderId },
      ],
    }),
    addOrderLine: build.mutation<OrderRead, { orderId: string; body: OrderLineCreateInput }>({
      query: ({ orderId, body }) => ({
        url: `/orders/${orderId}/lines`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, _error, { orderId }) => [
        { type: 'AdminOrder', id: result?.id ?? orderId },
        { type: 'AdminOrder', id: 'LIST' },
      ],
    }),
    payOrder: build.mutation<OrderRead, { orderId: string }>({
      query: ({ orderId }) => ({
        url: `/orders/${orderId}/pay`,
        method: 'POST',
      }),
      invalidatesTags: (result, _error, { orderId }) => [
        { type: 'AdminOrder', id: result?.id ?? orderId },
        { type: 'AdminOrder', id: 'LIST' },
      ],
    }),
    cancelOrder: build.mutation<OrderRead, { orderId: string }>({
      query: ({ orderId }) => ({
        url: `/orders/${orderId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, _error, { orderId }) => [
        { type: 'AdminOrder', id: result?.id ?? orderId },
        { type: 'AdminOrder', id: 'LIST' },
      ],
    }),
    fulfillOrder: build.mutation<OrderRead, { orderId: string; body?: ShipmentCreateInput | null }>(
      {
        query: ({ orderId, body }) => ({
          url: `/orders/${orderId}/fulfill`,
          method: 'POST',
          body: body ?? undefined,
        }),
        invalidatesTags: (result, _error, { orderId }) => [
          { type: 'AdminOrder', id: result?.id ?? orderId },
          { type: 'AdminOrder', id: 'LIST' },
        ],
      },
    ),
  }),
});

export const {
  useListOrdersQuery,
  useLazyListOrdersQuery,
  useCreateOrderMutation,
  useGetCheckoutQuoteQuery,
  useCreateOrderFromCartMutation,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useAddOrderLineMutation,
  usePayOrderMutation,
  useCancelOrderMutation,
  useFulfillOrderMutation,
} = ordersApi;
