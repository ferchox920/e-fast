import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';
import { loyaltyApi } from '@/store/api/loyaltyApi';
import type { LoyaltyLevelRead, LoyaltyProfileRead } from '@/types/loyalty';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface LoyaltyState {
  profile: LoyaltyProfileRead | null;
  levels: LoyaltyLevelRead[];
  profileStatus: RequestStatus;
  levelsStatus: RequestStatus;
  mutationStatus: RequestStatus;
  error: string | null;
}

const initialState: LoyaltyState = {
  profile: null,
  levels: [],
  profileStatus: 'idle',
  levelsStatus: 'idle',
  mutationStatus: 'idle',
  error: null,
};

const sortLevelsByMinPoints = (levels: LoyaltyLevelRead[]) =>
  [...levels].sort((a, b) => a.min_points - b.min_points);

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    setLoyaltyProfile(state, action: PayloadAction<LoyaltyProfileRead | null>) {
      state.profile = action.payload;
      state.profileStatus = action.payload ? 'succeeded' : 'idle';
      state.error = null;
    },
    clearLoyaltyState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(loyaltyApi.endpoints.getLoyaltyProfile.matchPending, (state) => {
        state.profileStatus = 'loading';
        state.error = null;
      })
      .addMatcher(loyaltyApi.endpoints.getLoyaltyProfile.matchFulfilled, (state, action) => {
        state.profile = action.payload;
        state.profileStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(loyaltyApi.endpoints.getLoyaltyProfile.matchRejected, (state, action) => {
        state.profileStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load loyalty profile.';
      })
      .addMatcher(loyaltyApi.endpoints.listLoyaltyLevels.matchPending, (state) => {
        state.levelsStatus = 'loading';
        state.error = null;
      })
      .addMatcher(loyaltyApi.endpoints.listLoyaltyLevels.matchFulfilled, (state, action) => {
        state.levels = sortLevelsByMinPoints(action.payload);
        state.levelsStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(loyaltyApi.endpoints.listLoyaltyLevels.matchRejected, (state, action) => {
        state.levelsStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load loyalty levels.';
      })
      .addMatcher(loyaltyApi.endpoints.adjustLoyaltyProfile.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(loyaltyApi.endpoints.adjustLoyaltyProfile.matchFulfilled, (state, action) => {
        state.profile = action.payload;
        state.mutationStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(loyaltyApi.endpoints.adjustLoyaltyProfile.matchRejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.error?.message ?? 'Could not adjust loyalty profile.';
      })
      .addMatcher(loyaltyApi.endpoints.redeemLoyaltyReward.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(loyaltyApi.endpoints.redeemLoyaltyReward.matchFulfilled, (state, action) => {
        state.profile = action.payload;
        state.mutationStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(loyaltyApi.endpoints.redeemLoyaltyReward.matchRejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.error?.message ?? 'Could not redeem loyalty reward.';
      });
  },
});

export const { setLoyaltyProfile, clearLoyaltyState } = loyaltySlice.actions;
export default loyaltySlice.reducer;

const selectLoyaltyState = (state: RootState) => state.loyalty;

export const selectLoyaltyProfile = createSelector(selectLoyaltyState, (state) => state.profile);
export const selectLoyaltyLevels = createSelector(selectLoyaltyState, (state) => state.levels);
export const selectLoyaltyStatuses = createSelector(selectLoyaltyState, (state) => ({
  profile: state.profileStatus,
  levels: state.levelsStatus,
  mutation: state.mutationStatus,
}));
export const selectLoyaltyError = createSelector(selectLoyaltyState, (state) => state.error);
