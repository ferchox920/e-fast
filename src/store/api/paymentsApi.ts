import { baseApi } from './baseApi';
import type {
  CreatePaymentForOrderArgs,
  PaymentRefundArgs,
  Payment,
  PaymentAuditRead,
} from '@/types/payment';

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createPaymentForOrder: build.mutation<Payment, CreatePaymentForOrderArgs>({
      query: ({ orderId, idempotencyKey }) => ({
        url: `/payments/orders/${orderId}`,
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: (result, _error, { orderId }) => [
        { type: 'Payment', id: result?.id ?? `ORDER:${orderId}` },
        { type: 'AdminOrder', id: orderId },
        { type: 'AdminOrder', id: 'LIST' },
      ],
    }),
    refundPaymentAdmin: build.mutation<Payment, PaymentRefundArgs>({
      query: ({ paymentId, idempotencyKey, body }) => ({
        url: `/payments/${paymentId}/refund`,
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body,
      }),
      invalidatesTags: [{ type: 'AdminOrder', id: 'LIST' }],
    }),
    getPaymentAuditAdmin: build.query<PaymentAuditRead, string>({
      query: (paymentId) => `/payments/${paymentId}/audit`,
    }),
  }),
});

export const {
  useCreatePaymentForOrderMutation,
  useRefundPaymentAdminMutation,
  useGetPaymentAuditAdminQuery,
} = paymentsApi;
