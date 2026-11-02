import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';

import { resolveApiBaseUrl } from '../baseApi';
import { scoringApi } from '../scoringApi';
import { rootReducer } from '@/store/rootReducer';
import { server } from '@/test-utils/msw/server';

const API_BASE = resolveApiBaseUrl();

const createStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(scoringApi.middleware),
  });

describe('scoringApi', () => {
  it('fetches public scoring rankings instead of hidden internal endpoints', async () => {
    server.use(
      http.get(`${API_BASE}/scoring/rankings`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('limit')).toBe('200');
        return HttpResponse.json([
          {
            product_id: 'product-1',
            popularity_score: 10,
            cold_score: 2,
            profit_score: 3,
            exposure_score: 4,
            computed_at: '2026-01-01T00:00:00Z',
          },
        ]);
      }),
      http.get(`${API_BASE}/internal/scoring/rankings`, () => {
        return HttpResponse.json({ detail: 'unexpected internal call' }, { status: 500 });
      }),
    );

    const store = createStore();
    const result = await store.dispatch(
      scoringApi.endpoints.getScoringRankings.initiate({ limit: 200 }),
    );

    expect(result.error).toBeUndefined();
    expect(result.data?.[0]?.product_id).toBe('product-1');
  });

  it('keeps scoring runs on the protected internal endpoint', async () => {
    const runSpy = jest.fn();
    server.use(
      http.post(`${API_BASE}/internal/scoring/run`, () => {
        runSpy();
        return HttpResponse.json({ count: 1 });
      }),
    );

    const store = createStore();
    const result = await store.dispatch(scoringApi.endpoints.runScoring.initiate());

    expect(result.error).toBeUndefined();
    expect(runSpy).toHaveBeenCalledTimes(1);
  });
});
