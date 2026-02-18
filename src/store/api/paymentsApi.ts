import { baseApi } from './baseApi';
import type {
  CreatePaymentForOrderArgs,
  MercadoPagoWebhookPayload,
  Payment,
  WebhookAck,
} from '@/types/payment';

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createPaymentForOrder: build.mutation<Payment, CreatePaymentForOrderArgs>({
      query: ({ orderId }) => ({
        url: `/payments/orders/${orderId}`,
        method: 'POST',
      }),
      invalidatesTags: (result, _error, { orderId }) => [
        { type: 'Payment', id: result?.id ?? `ORDER:${orderId}` },
        { type: 'AdminOrder', id: orderId },
        { type: 'AdminOrder', id: 'LIST' },
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

export const { useCreatePaymentForOrderMutation, useMercadoPagoWebhookMutation } = paymentsApi;
