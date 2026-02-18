import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';
import { paymentsApi } from '@/store/api/paymentsApi';
import type { Payment, WebhookAck } from '@/types/payment';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface PaymentsState {
  latest: Payment | null;
  webhookAck: WebhookAck | null;
  paymentStatus: RequestStatus;
  webhookStatus: RequestStatus;
  error: string | null;
}

const initialState: PaymentsState = {
  latest: null,
  webhookAck: null,
  paymentStatus: 'idle',
  webhookStatus: 'idle',
  error: null,
};

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    setLatestPayment(state, action: PayloadAction<Payment | null>) {
      state.latest = action.payload;
      state.paymentStatus = action.payload ? 'succeeded' : 'idle';
      state.error = null;
    },
    clearPaymentsState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(paymentsApi.endpoints.createPaymentForOrder.matchPending, (state) => {
        state.paymentStatus = 'loading';
        state.error = null;
      })
      .addMatcher(paymentsApi.endpoints.createPaymentForOrder.matchFulfilled, (state, action) => {
        state.latest = action.payload;
        state.paymentStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(paymentsApi.endpoints.createPaymentForOrder.matchRejected, (state, action) => {
        state.paymentStatus = 'failed';
        state.error = action.error?.message ?? 'Could not create payment.';
      })
      .addMatcher(paymentsApi.endpoints.mercadoPagoWebhook.matchPending, (state) => {
        state.webhookStatus = 'loading';
        state.error = null;
      })
      .addMatcher(paymentsApi.endpoints.mercadoPagoWebhook.matchFulfilled, (state, action) => {
        state.webhookAck = action.payload;
        state.webhookStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(paymentsApi.endpoints.mercadoPagoWebhook.matchRejected, (state, action) => {
        state.webhookStatus = 'failed';
        state.error = action.error?.message ?? 'Could not process payment webhook.';
      });
  },
});

export const { setLatestPayment, clearPaymentsState } = paymentsSlice.actions;
export default paymentsSlice.reducer;

const selectPaymentsState = (state: RootState) => state.payments;

export const selectLatestPayment = createSelector(selectPaymentsState, (state) => state.latest);
export const selectPaymentsStatuses = createSelector(selectPaymentsState, (state) => ({
  payment: state.paymentStatus,
  webhook: state.webhookStatus,
}));
export const selectPaymentsError = createSelector(selectPaymentsState, (state) => state.error);
export const selectWebhookAck = createSelector(selectPaymentsState, (state) => state.webhookAck);
