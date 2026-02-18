import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';
import { purchasesApi } from '@/store/api/purchasesApi';
import type { PORead, ReplenishmentSuggestion, StockAlert, SupplierRead } from '@/types/purchase';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface PurchasesState {
  suppliers: SupplierRead[];
  currentPO: PORead | null;
  alerts: StockAlert[];
  suggestion: ReplenishmentSuggestion | null;
  suppliersStatus: RequestStatus;
  poStatus: RequestStatus;
  mutationStatus: RequestStatus;
  replenishmentStatus: RequestStatus;
  error: string | null;
}

const initialState: PurchasesState = {
  suppliers: [],
  currentPO: null,
  alerts: [],
  suggestion: null,
  suppliersStatus: 'idle',
  poStatus: 'idle',
  mutationStatus: 'idle',
  replenishmentStatus: 'idle',
  error: null,
};

const purchasesSlice = createSlice({
  name: 'purchases',
  initialState,
  reducers: {
    setCurrentPurchaseOrder(state, action: PayloadAction<PORead | null>) {
      state.currentPO = action.payload;
      state.poStatus = action.payload ? 'succeeded' : 'idle';
      state.error = null;
    },
    clearPurchasesState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(purchasesApi.endpoints.listSuppliers.matchPending, (state) => {
        state.suppliersStatus = 'loading';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.listSuppliers.matchFulfilled, (state, action) => {
        state.suppliers = action.payload;
        state.suppliersStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.listSuppliers.matchRejected, (state, action) => {
        state.suppliersStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load suppliers.';
      })
      .addMatcher(purchasesApi.endpoints.getPurchaseOrderById.matchPending, (state) => {
        state.poStatus = 'loading';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.getPurchaseOrderById.matchFulfilled, (state, action) => {
        state.currentPO = action.payload;
        state.poStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.getPurchaseOrderById.matchRejected, (state, action) => {
        state.poStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load purchase order.';
      })
      .addMatcher(purchasesApi.endpoints.createSupplier.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.createSupplier.matchFulfilled, (state, action) => {
        state.suppliers = [action.payload, ...state.suppliers];
        state.mutationStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.createSupplier.matchRejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.error?.message ?? 'Could not create supplier.';
      })
      .addMatcher(purchasesApi.endpoints.createPurchaseOrder.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.createPurchaseOrder.matchFulfilled, (state, action) => {
        state.currentPO = action.payload;
        state.mutationStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.createPurchaseOrder.matchRejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.error?.message ?? 'Could not create purchase order.';
      })
      .addMatcher(purchasesApi.endpoints.addPurchaseOrderLine.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.addPurchaseOrderLine.matchFulfilled, (state, action) => {
        state.currentPO = action.payload;
        state.mutationStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.addPurchaseOrderLine.matchRejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.error?.message ?? 'Could not add purchase order line.';
      })
      .addMatcher(purchasesApi.endpoints.placePurchaseOrder.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.placePurchaseOrder.matchFulfilled, (state, action) => {
        state.currentPO = action.payload;
        state.mutationStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.placePurchaseOrder.matchRejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.error?.message ?? 'Could not place purchase order.';
      })
      .addMatcher(purchasesApi.endpoints.receivePurchaseOrder.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.receivePurchaseOrder.matchFulfilled, (state, action) => {
        state.currentPO = action.payload;
        state.mutationStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.receivePurchaseOrder.matchRejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.error?.message ?? 'Could not receive purchase order.';
      })
      .addMatcher(purchasesApi.endpoints.cancelPurchaseOrder.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.cancelPurchaseOrder.matchFulfilled, (state, action) => {
        state.currentPO = action.payload;
        state.mutationStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.cancelPurchaseOrder.matchRejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.error?.message ?? 'Could not cancel purchase order.';
      })
      .addMatcher(
        purchasesApi.endpoints.createPurchaseOrderFromSuggestions.matchPending,
        (state) => {
          state.mutationStatus = 'loading';
          state.error = null;
        },
      )
      .addMatcher(
        purchasesApi.endpoints.createPurchaseOrderFromSuggestions.matchFulfilled,
        (state, action) => {
          state.currentPO = action.payload;
          state.mutationStatus = 'succeeded';
          state.error = null;
        },
      )
      .addMatcher(
        purchasesApi.endpoints.createPurchaseOrderFromSuggestions.matchRejected,
        (state, action) => {
          state.mutationStatus = 'failed';
          state.error =
            action.error?.message ?? 'Could not create purchase order from suggestions.';
        },
      )
      .addMatcher(purchasesApi.endpoints.getReplenishmentAlerts.matchPending, (state) => {
        state.replenishmentStatus = 'loading';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.getReplenishmentAlerts.matchFulfilled, (state, action) => {
        state.alerts = action.payload;
        state.replenishmentStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(purchasesApi.endpoints.getReplenishmentAlerts.matchRejected, (state, action) => {
        state.replenishmentStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load replenishment alerts.';
      })
      .addMatcher(purchasesApi.endpoints.getReplenishmentSuggestions.matchPending, (state) => {
        state.replenishmentStatus = 'loading';
        state.error = null;
      })
      .addMatcher(
        purchasesApi.endpoints.getReplenishmentSuggestions.matchFulfilled,
        (state, action) => {
          state.suggestion = action.payload;
          state.replenishmentStatus = 'succeeded';
          state.error = null;
        },
      )
      .addMatcher(
        purchasesApi.endpoints.getReplenishmentSuggestions.matchRejected,
        (state, action) => {
          state.replenishmentStatus = 'failed';
          state.error = action.error?.message ?? 'Could not load replenishment suggestions.';
        },
      );
  },
});

export const { setCurrentPurchaseOrder, clearPurchasesState } = purchasesSlice.actions;
export default purchasesSlice.reducer;

const selectPurchasesState = (state: RootState) => state.purchases;

export const selectSuppliers = createSelector(selectPurchasesState, (state) => state.suppliers);
export const selectCurrentPurchaseOrder = createSelector(
  selectPurchasesState,
  (state) => state.currentPO,
);
export const selectReplenishmentAlerts = createSelector(
  selectPurchasesState,
  (state) => state.alerts,
);
export const selectReplenishmentSuggestion = createSelector(
  selectPurchasesState,
  (state) => state.suggestion,
);
export const selectPurchasesStatuses = createSelector(selectPurchasesState, (state) => ({
  suppliers: state.suppliersStatus,
  po: state.poStatus,
  mutation: state.mutationStatus,
  replenishment: state.replenishmentStatus,
}));
export const selectPurchasesError = createSelector(selectPurchasesState, (state) => state.error);
