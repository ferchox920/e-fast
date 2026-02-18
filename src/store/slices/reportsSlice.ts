import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { RootState } from '@/store';
import { reportsApi } from '@/store/api/reportsApi';
import type {
  CostAnalysisReport,
  InventoryRotationReport,
  InventoryValueReport,
  SalesReport,
} from '@/types/report';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ReportsState {
  sales: SalesReport | null;
  inventoryValue: InventoryValueReport | null;
  costAnalysis: CostAnalysisReport | null;
  inventoryRotation: InventoryRotationReport | null;
  salesStatus: RequestStatus;
  inventoryValueStatus: RequestStatus;
  costAnalysisStatus: RequestStatus;
  inventoryRotationStatus: RequestStatus;
  error: string | null;
}

const initialState: ReportsState = {
  sales: null,
  inventoryValue: null,
  costAnalysis: null,
  inventoryRotation: null,
  salesStatus: 'idle',
  inventoryValueStatus: 'idle',
  costAnalysisStatus: 'idle',
  inventoryRotationStatus: 'idle',
  error: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearReportsState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(reportsApi.endpoints.getSalesReport.matchPending, (state) => {
        state.salesStatus = 'loading';
        state.error = null;
      })
      .addMatcher(reportsApi.endpoints.getSalesReport.matchFulfilled, (state, action) => {
        state.sales = action.payload;
        state.salesStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(reportsApi.endpoints.getSalesReport.matchRejected, (state, action) => {
        state.salesStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load sales report.';
      })
      .addMatcher(reportsApi.endpoints.getInventoryValueReport.matchPending, (state) => {
        state.inventoryValueStatus = 'loading';
        state.error = null;
      })
      .addMatcher(
        reportsApi.endpoints.getInventoryValueReport.matchFulfilled,
        (state, action) => {
          state.inventoryValue = action.payload;
          state.inventoryValueStatus = 'succeeded';
          state.error = null;
        },
      )
      .addMatcher(reportsApi.endpoints.getInventoryValueReport.matchRejected, (state, action) => {
        state.inventoryValueStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load inventory value report.';
      })
      .addMatcher(reportsApi.endpoints.getPurchasesCostAnalysisReport.matchPending, (state) => {
        state.costAnalysisStatus = 'loading';
        state.error = null;
      })
      .addMatcher(
        reportsApi.endpoints.getPurchasesCostAnalysisReport.matchFulfilled,
        (state, action) => {
          state.costAnalysis = action.payload;
          state.costAnalysisStatus = 'succeeded';
          state.error = null;
        },
      )
      .addMatcher(
        reportsApi.endpoints.getPurchasesCostAnalysisReport.matchRejected,
        (state, action) => {
          state.costAnalysisStatus = 'failed';
          state.error = action.error?.message ?? 'Could not load purchases cost analysis report.';
        },
      )
      .addMatcher(reportsApi.endpoints.getInventoryRotationReport.matchPending, (state) => {
        state.inventoryRotationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(
        reportsApi.endpoints.getInventoryRotationReport.matchFulfilled,
        (state, action) => {
          state.inventoryRotation = action.payload;
          state.inventoryRotationStatus = 'succeeded';
          state.error = null;
        },
      )
      .addMatcher(
        reportsApi.endpoints.getInventoryRotationReport.matchRejected,
        (state, action) => {
          state.inventoryRotationStatus = 'failed';
          state.error = action.error?.message ?? 'Could not load inventory rotation report.';
        },
      );
  },
});

export const { clearReportsState } = reportsSlice.actions;
export default reportsSlice.reducer;

const selectReportsState = (state: RootState) => state.reports;

export const selectSalesReport = createSelector(selectReportsState, (state) => state.sales);
export const selectInventoryValueReport = createSelector(
  selectReportsState,
  (state) => state.inventoryValue,
);
export const selectCostAnalysisReport = createSelector(
  selectReportsState,
  (state) => state.costAnalysis,
);
export const selectInventoryRotationReport = createSelector(
  selectReportsState,
  (state) => state.inventoryRotation,
);
export const selectReportsStatuses = createSelector(selectReportsState, (state) => ({
  sales: state.salesStatus,
  inventoryValue: state.inventoryValueStatus,
  costAnalysis: state.costAnalysisStatus,
  inventoryRotation: state.inventoryRotationStatus,
}));
export const selectReportsError = createSelector(selectReportsState, (state) => state.error);
