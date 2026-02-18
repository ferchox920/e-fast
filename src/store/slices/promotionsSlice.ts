import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';
import { promotionsApi } from '@/store/api/promotionsApi';
import type { PromotionEligibilityResponse, PromotionRead } from '@/types/promotion';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface PromotionsState {
  active: PromotionRead[];
  current: PromotionRead | null;
  eligibilityByPromotionId: Record<string, PromotionEligibilityResponse>;
  listStatus: RequestStatus;
  currentStatus: RequestStatus;
  eligibilityStatus: RequestStatus;
  error: string | null;
}

const initialState: PromotionsState = {
  active: [],
  current: null,
  eligibilityByPromotionId: {},
  listStatus: 'idle',
  currentStatus: 'idle',
  eligibilityStatus: 'idle',
  error: null,
};

const sortByStartAtDesc = (items: PromotionRead[]) =>
  [...items].sort((a, b) => String(b.start_at).localeCompare(String(a.start_at)));

const promotionsSlice = createSlice({
  name: 'promotions',
  initialState,
  reducers: {
    setCurrentPromotion(state, action: PayloadAction<PromotionRead | null>) {
      state.current = action.payload;
      state.currentStatus = action.payload ? 'succeeded' : 'idle';
      state.error = null;
    },
    clearPromotionsState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(promotionsApi.endpoints.listActivePromotions.matchPending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addMatcher(promotionsApi.endpoints.listActivePromotions.matchFulfilled, (state, action) => {
        state.active = sortByStartAtDesc(action.payload);
        state.listStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(promotionsApi.endpoints.listActivePromotions.matchRejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load active promotions.';
      })
      .addMatcher(promotionsApi.endpoints.getPromotionById.matchPending, (state) => {
        state.currentStatus = 'loading';
        state.error = null;
      })
      .addMatcher(promotionsApi.endpoints.getPromotionById.matchFulfilled, (state, action) => {
        state.current = action.payload;
        state.currentStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(promotionsApi.endpoints.getPromotionById.matchRejected, (state, action) => {
        state.currentStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load promotion detail.';
      })
      .addMatcher(promotionsApi.endpoints.checkPromotionEligibility.matchPending, (state) => {
        state.eligibilityStatus = 'loading';
        state.error = null;
      })
      .addMatcher(
        promotionsApi.endpoints.checkPromotionEligibility.matchFulfilled,
        (state, action) => {
          const key = String(action.payload.promotion_id);
          state.eligibilityByPromotionId[key] = action.payload;
          state.eligibilityStatus = 'succeeded';
          state.error = null;
        },
      )
      .addMatcher(
        promotionsApi.endpoints.checkPromotionEligibility.matchRejected,
        (state, action) => {
          state.eligibilityStatus = 'failed';
          state.error = action.error?.message ?? 'Could not check promotion eligibility.';
        },
      );
  },
});

export const { setCurrentPromotion, clearPromotionsState } = promotionsSlice.actions;
export default promotionsSlice.reducer;

const selectPromotionsState = (state: RootState) => state.promotions;

export const selectActivePromotions = createSelector(
  selectPromotionsState,
  (state) => state.active,
);
export const selectCurrentPromotion = createSelector(
  selectPromotionsState,
  (state) => state.current,
);
export const selectPromotionEligibilityById = (state: RootState, promotionId: string) =>
  state.promotions.eligibilityByPromotionId[promotionId] ?? null;
export const selectPromotionsStatuses = createSelector(selectPromotionsState, (state) => ({
  list: state.listStatus,
  current: state.currentStatus,
  eligibility: state.eligibilityStatus,
}));
export const selectPromotionsError = createSelector(selectPromotionsState, (state) => state.error);
