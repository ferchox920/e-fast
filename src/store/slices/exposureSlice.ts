import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';
import { exposureApi } from '@/store/api/exposureApi';
import type { ExposureResponse } from '@/types/exposure';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ExposureState {
  latest: ExposureResponse | null;
  byContext: Record<string, ExposureResponse>;
  fetchStatus: RequestStatus;
  refreshStatus: RequestStatus;
  clearStatus: RequestStatus;
  error: string | null;
}

const initialState: ExposureState = {
  latest: null,
  byContext: {},
  fetchStatus: 'idle',
  refreshStatus: 'idle',
  clearStatus: 'idle',
  error: null,
};

const setExposure = (state: ExposureState, payload: ExposureResponse) => {
  state.latest = payload;
  state.byContext[payload.context] = payload;
};

const exposureSlice = createSlice({
  name: 'exposure',
  initialState,
  reducers: {
    setLatestExposure(state, action: PayloadAction<ExposureResponse | null>) {
      state.latest = action.payload;
      if (action.payload) {
        state.byContext[action.payload.context] = action.payload;
      }
      state.error = null;
    },
    clearExposureState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(exposureApi.endpoints.getExposure.matchPending, (state) => {
        state.fetchStatus = 'loading';
        state.error = null;
      })
      .addMatcher(exposureApi.endpoints.getExposure.matchFulfilled, (state, action) => {
        setExposure(state, action.payload);
        state.fetchStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(exposureApi.endpoints.getExposure.matchRejected, (state, action) => {
        state.fetchStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load exposure.';
      })
      .addMatcher(exposureApi.endpoints.refreshExposure.matchPending, (state) => {
        state.refreshStatus = 'loading';
        state.error = null;
      })
      .addMatcher(exposureApi.endpoints.refreshExposure.matchFulfilled, (state, action) => {
        setExposure(state, action.payload);
        state.refreshStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(exposureApi.endpoints.refreshExposure.matchRejected, (state, action) => {
        state.refreshStatus = 'failed';
        state.error = action.error?.message ?? 'Could not refresh exposure.';
      })
      .addMatcher(exposureApi.endpoints.clearExposureCache.matchPending, (state) => {
        state.clearStatus = 'loading';
        state.error = null;
      })
      .addMatcher(exposureApi.endpoints.clearExposureCache.matchFulfilled, (state) => {
        state.clearStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(exposureApi.endpoints.clearExposureCache.matchRejected, (state, action) => {
        state.clearStatus = 'failed';
        state.error = action.error?.message ?? 'Could not clear exposure cache.';
      });
  },
});

export const { setLatestExposure, clearExposureState } = exposureSlice.actions;
export default exposureSlice.reducer;

const selectExposureState = (state: RootState) => state.exposure;

export const selectLatestExposure = createSelector(selectExposureState, (state) => state.latest);
export const selectExposureByContext = (state: RootState, context: string) =>
  state.exposure.byContext[context] ?? null;
export const selectExposureStatuses = createSelector(selectExposureState, (state) => ({
  fetch: state.fetchStatus,
  refresh: state.refreshStatus,
  clear: state.clearStatus,
}));
export const selectExposureError = createSelector(selectExposureState, (state) => state.error);
