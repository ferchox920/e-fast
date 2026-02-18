import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';
import { scoringApi } from '@/store/api/scoringApi';
import type { ScoringRankingItem, ScoringRunResult } from '@/types/scoring';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ScoringState {
  rankings: ScoringRankingItem[];
  latestRun: ScoringRunResult | null;
  rankingsStatus: RequestStatus;
  runStatus: RequestStatus;
  error: string | null;
}

const initialState: ScoringState = {
  rankings: [],
  latestRun: null,
  rankingsStatus: 'idle',
  runStatus: 'idle',
  error: null,
};

const sortByComputedAtDesc = (items: ScoringRankingItem[]) =>
  [...items].sort((a, b) => String(b.computed_at).localeCompare(String(a.computed_at)));

const scoringSlice = createSlice({
  name: 'scoring',
  initialState,
  reducers: {
    setScoringRankings(state, action: PayloadAction<ScoringRankingItem[]>) {
      state.rankings = sortByComputedAtDesc(action.payload);
      state.rankingsStatus = 'succeeded';
      state.error = null;
    },
    clearScoringState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(scoringApi.endpoints.getScoringRankings.matchPending, (state) => {
        state.rankingsStatus = 'loading';
        state.error = null;
      })
      .addMatcher(scoringApi.endpoints.getScoringRankings.matchFulfilled, (state, action) => {
        state.rankings = sortByComputedAtDesc(action.payload);
        state.rankingsStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(scoringApi.endpoints.getScoringRankings.matchRejected, (state, action) => {
        state.rankingsStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load scoring rankings.';
      })
      .addMatcher(scoringApi.endpoints.runScoring.matchPending, (state) => {
        state.runStatus = 'loading';
        state.error = null;
      })
      .addMatcher(scoringApi.endpoints.runScoring.matchFulfilled, (state, action) => {
        state.latestRun = action.payload;
        state.runStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(scoringApi.endpoints.runScoring.matchRejected, (state, action) => {
        state.runStatus = 'failed';
        state.error = action.error?.message ?? 'Could not run scoring process.';
      });
  },
});

export const { setScoringRankings, clearScoringState } = scoringSlice.actions;
export default scoringSlice.reducer;

const selectScoringState = (state: RootState) => state.scoring;

export const selectScoringRankings = createSelector(selectScoringState, (state) => state.rankings);
export const selectLatestScoringRun = createSelector(
  selectScoringState,
  (state) => state.latestRun,
);
export const selectScoringStatuses = createSelector(selectScoringState, (state) => ({
  rankings: state.rankingsStatus,
  run: state.runStatus,
}));
export const selectScoringError = createSelector(selectScoringState, (state) => state.error);
