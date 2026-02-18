import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';
import { engagementApi } from '@/store/api/engagementApi';
import type { CustomerEngagementRead, ProductEngagementRead } from '@/types/engagement';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface EngagementState {
  latestIngested: ProductEngagementRead | null;
  productSeriesById: Record<string, ProductEngagementRead[]>;
  customerSeriesById: Record<string, CustomerEngagementRead[]>;
  ingestStatus: RequestStatus;
  productStatus: RequestStatus;
  customerStatus: RequestStatus;
  error: string | null;
}

const initialState: EngagementState = {
  latestIngested: null,
  productSeriesById: {},
  customerSeriesById: {},
  ingestStatus: 'idle',
  productStatus: 'idle',
  customerStatus: 'idle',
  error: null,
};

const sortByDateAsc = <T extends { date: string }>(items: T[]) =>
  [...items].sort((a, b) => String(a.date).localeCompare(String(b.date)));

const engagementSlice = createSlice({
  name: 'engagement',
  initialState,
  reducers: {
    setProductSeries(
      state,
      action: PayloadAction<{ productId: string; series: ProductEngagementRead[] }>,
    ) {
      const { productId, series } = action.payload;
      state.productSeriesById[productId] = sortByDateAsc(series);
      state.productStatus = 'succeeded';
      state.error = null;
    },
    setCustomerSeries(
      state,
      action: PayloadAction<{ userId: string; series: CustomerEngagementRead[] }>,
    ) {
      const { userId, series } = action.payload;
      state.customerSeriesById[userId] = sortByDateAsc(series);
      state.customerStatus = 'succeeded';
      state.error = null;
    },
    clearEngagementState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(engagementApi.endpoints.ingestEvent.matchPending, (state) => {
        state.ingestStatus = 'loading';
        state.error = null;
      })
      .addMatcher(engagementApi.endpoints.ingestEvent.matchFulfilled, (state, action) => {
        state.latestIngested = action.payload;
        state.ingestStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(engagementApi.endpoints.ingestEvent.matchRejected, (state, action) => {
        state.ingestStatus = 'failed';
        state.error = action.error?.message ?? 'Could not ingest engagement event.';
      })
      .addMatcher(engagementApi.endpoints.getProductEngagement.matchPending, (state) => {
        state.productStatus = 'loading';
        state.error = null;
      })
      .addMatcher(
        engagementApi.endpoints.getProductEngagement.matchFulfilled,
        (state, action) => {
          const productId = action.meta.arg.originalArgs.productId;
          state.productSeriesById[productId] = sortByDateAsc(action.payload);
          state.productStatus = 'succeeded';
          state.error = null;
        },
      )
      .addMatcher(engagementApi.endpoints.getProductEngagement.matchRejected, (state, action) => {
        state.productStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load product engagement.';
      })
      .addMatcher(engagementApi.endpoints.getCustomerEngagement.matchPending, (state) => {
        state.customerStatus = 'loading';
        state.error = null;
      })
      .addMatcher(
        engagementApi.endpoints.getCustomerEngagement.matchFulfilled,
        (state, action) => {
          const userId = action.meta.arg.originalArgs.userId;
          state.customerSeriesById[userId] = sortByDateAsc(action.payload);
          state.customerStatus = 'succeeded';
          state.error = null;
        },
      )
      .addMatcher(
        engagementApi.endpoints.getCustomerEngagement.matchRejected,
        (state, action) => {
          state.customerStatus = 'failed';
          state.error = action.error?.message ?? 'Could not load customer engagement.';
        },
      );
  },
});

export const { setProductSeries, setCustomerSeries, clearEngagementState } =
  engagementSlice.actions;
export default engagementSlice.reducer;

const selectEngagementState = (state: RootState) => state.engagement;

export const selectLatestIngestedEngagement = createSelector(
  selectEngagementState,
  (state) => state.latestIngested,
);
export const selectProductEngagementById = (state: RootState, productId: string) =>
  state.engagement.productSeriesById[productId] ?? [];
export const selectCustomerEngagementById = (state: RootState, userId: string) =>
  state.engagement.customerSeriesById[userId] ?? [];
export const selectEngagementStatuses = createSelector(selectEngagementState, (state) => ({
  ingest: state.ingestStatus,
  product: state.productStatus,
  customer: state.customerStatus,
}));
export const selectEngagementError = createSelector(
  selectEngagementState,
  (state) => state.error,
);
