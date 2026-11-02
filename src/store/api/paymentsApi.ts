import { baseApi } from './baseApi';
import type {
  CheckoutStatus,
  CreatePaymentForOrderArgs,
  MercadoPagoWebhookPayload,
  Payment,
  WebhookAck,
} from '@/types/payment';

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createPaymentForOrder: build.mutation<Payment, CreatePaymentForOrderArgs>({
      query: ({ orderId, idempotencyKey }) => ({
        url: `/payments/orders/${orderId}`,
        method: 'POST',
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      }),
      invalidatesTags: (result, _error, { orderId }) => [
        { type: 'Payment', id: result?.id ?? `ORDER:${orderId}` },
        { type: 'AdminOrder', id: orderId },
        { type: 'AdminOrder', id: 'LIST' },
      ],
    }),
    getCheckoutStatus: build.query<CheckoutStatus, { orderId: string }>({
      query: ({ orderId }) => ({
        url: `/payments/orders/${orderId}/checkout-status`,
      }),
      providesTags: (result, _error, { orderId }) => [
        { type: 'Payment', id: result?.latest_payment?.id ?? `ORDER:${orderId}` },
        { type: 'AdminOrder', id: orderId },
      ],
    }),
    mercadoPagoWebhook: build.mutation<WebhookAck, MercadoPagoWebhookPayload>({
      query: (body) => ({
        url: '/payments/mercado-pago/webhook',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'AdminOrder', id: 'LIST' }],
    }),
  }),
});

export const {
  useCreatePaymentForOrderMutation,
  useGetCheckoutStatusQuery,
  useLazyGetCheckoutStatusQuery,
  useMercadoPagoWebhookMutation,
} = paymentsApi;
