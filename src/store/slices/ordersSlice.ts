import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';
import { ordersApi } from '@/store/api/ordersApi';
import type { OrderRead } from '@/types/order';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface OrdersState {
  items: OrderRead[];
  current: OrderRead | null;
  listStatus: RequestStatus;
  currentStatus: RequestStatus;
  mutationStatus: RequestStatus;
  error: string | null;
}

const initialState: OrdersState = {
  items: [],
  current: null,
  listStatus: 'idle',
  currentStatus: 'idle',
  mutationStatus: 'idle',
  error: null,
};

const sortByCreatedAtDesc = (orders: OrderRead[]) =>
  [...orders].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

const upsertOrder = (state: OrdersState, order: OrderRead) => {
  const orderId = String(order.id);
  const index = state.items.findIndex((item) => String(item.id) === orderId);
  if (index >= 0) {
    state.items[index] = order;
  } else {
    state.items.push(order);
  }
  state.items = sortByCreatedAtDesc(state.items);
};

const setMutationSuccess = (state: OrdersState, order: OrderRead) => {
  upsertOrder(state, order);
  state.current = order;
  state.mutationStatus = 'succeeded';
  state.error = null;
};

const setMutationError = (state: OrdersState, action: { error?: { message?: string } }) => {
  state.mutationStatus = 'failed';
  state.error = action.error?.message ?? 'Could not process order action.';
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setCurrentOrder(state, action: PayloadAction<OrderRead | null>) {
      state.current = action.payload;
      state.currentStatus = action.payload ? 'succeeded' : 'idle';
    },
    clearCurrentOrder(state) {
      state.current = null;
      state.currentStatus = 'idle';
    },
    clearOrdersState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(ordersApi.endpoints.listOrders.matchPending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addMatcher(ordersApi.endpoints.listOrders.matchFulfilled, (state, action) => {
        state.items = sortByCreatedAtDesc(action.payload);
        state.listStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(ordersApi.endpoints.listOrders.matchRejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load orders.';
      })
      .addMatcher(ordersApi.endpoints.getOrderById.matchPending, (state) => {
        state.currentStatus = 'loading';
        state.error = null;
      })
      .addMatcher(ordersApi.endpoints.getOrderById.matchFulfilled, (state, action) => {
        state.current = action.payload;
        upsertOrder(state, action.payload);
        state.currentStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(ordersApi.endpoints.getOrderById.matchRejected, (state, action) => {
        state.currentStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load order.';
      })
      .addMatcher(ordersApi.endpoints.createOrder.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(ordersApi.endpoints.createOrder.matchFulfilled, (state, action) => {
        setMutationSuccess(state, action.payload);
      })
      .addMatcher(ordersApi.endpoints.createOrder.matchRejected, (state, action) => {
        setMutationError(state, action);
      })
      .addMatcher(ordersApi.endpoints.createOrderFromCart.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(ordersApi.endpoints.createOrderFromCart.matchFulfilled, (state, action) => {
        setMutationSuccess(state, action.payload);
      })
      .addMatcher(ordersApi.endpoints.createOrderFromCart.matchRejected, (state, action) => {
        setMutationError(state, action);
      })
      .addMatcher(ordersApi.endpoints.addOrderLine.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(ordersApi.endpoints.addOrderLine.matchFulfilled, (state, action) => {
        setMutationSuccess(state, action.payload);
      })
      .addMatcher(ordersApi.endpoints.addOrderLine.matchRejected, (state, action) => {
        setMutationError(state, action);
      })
      .addMatcher(ordersApi.endpoints.payOrder.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(ordersApi.endpoints.payOrder.matchFulfilled, (state, action) => {
        setMutationSuccess(state, action.payload);
      })
      .addMatcher(ordersApi.endpoints.payOrder.matchRejected, (state, action) => {
        setMutationError(state, action);
      })
      .addMatcher(ordersApi.endpoints.cancelOrder.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(ordersApi.endpoints.cancelOrder.matchFulfilled, (state, action) => {
        setMutationSuccess(state, action.payload);
      })
      .addMatcher(ordersApi.endpoints.cancelOrder.matchRejected, (state, action) => {
        setMutationError(state, action);
      })
      .addMatcher(ordersApi.endpoints.fulfillOrder.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(ordersApi.endpoints.fulfillOrder.matchFulfilled, (state, action) => {
        setMutationSuccess(state, action.payload);
      })
      .addMatcher(ordersApi.endpoints.fulfillOrder.matchRejected, (state, action) => {
        setMutationError(state, action);
      });
  },
});

export const { setCurrentOrder, clearCurrentOrder, clearOrdersState } = ordersSlice.actions;
export default ordersSlice.reducer;

const selectOrdersState = (state: RootState) => state.orders;

export const selectOrders = createSelector(selectOrdersState, (state) => state.items);
export const selectCurrentOrder = createSelector(selectOrdersState, (state) => state.current);
export const selectOrdersStatuses = createSelector(selectOrdersState, (state) => ({
  list: state.listStatus,
  current: state.currentStatus,
  mutation: state.mutationStatus,
}));
export const selectOrdersError = createSelector(selectOrdersState, (state) => state.error);
