import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';

import { resolveApiBaseUrl } from '../baseApi';
import { exposureApi } from '../exposureApi';
import { rootReducer } from '@/store/rootReducer';
import { server } from '@/test-utils/msw/server';

const API_BASE = resolveApiBaseUrl();

const createStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(exposureApi.middleware),
  });

describe('exposureApi', () => {
  it('reads public exposure from the public endpoint', async () => {
    server.use(
      http.get(`${API_BASE}/exposure`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('context')).toBe('home');
        return HttpResponse.json({
          context: 'home',
          mix: [],
          expires_at: '2026-01-01T00:00:00Z',
        });
      }),
    );

    const store = createStore();
    const result = await store.dispatch(
      exposureApi.endpoints.getExposure.initiate({ context: 'home' }),
    );

    expect(result.error).toBeUndefined();
    expect(result.data?.context).toBe('home');
  });

  it('keeps refresh and cache mutations on admin-only backend endpoints', async () => {
    const refreshSpy = jest.fn();
    const clearSpy = jest.fn();

    server.use(
      http.post(`${API_BASE}/exposure/refresh`, ({ request }) => {
        refreshSpy(new URL(request.url).searchParams.get('context'));
        return HttpResponse.json({
          context: 'home',
          mix: [],
          expires_at: '2026-01-01T00:00:00Z',
        });
      }),
      http.delete(`${API_BASE}/exposure/cache`, ({ request }) => {
        clearSpy(new URL(request.url).searchParams.get('context'));
        return HttpResponse.json({ status: 'cleared' });
      }),
    );

    const store = createStore();
    const refreshResult = await store.dispatch(
      exposureApi.endpoints.refreshExposure.initiate({ context: 'home' }),
    );
    const clearResult = await store.dispatch(
      exposureApi.endpoints.clearExposureCache.initiate({ context: 'home' }),
    );

    expect(refreshResult.error).toBeUndefined();
    expect(clearResult.error).toBeUndefined();
    expect(refreshSpy).toHaveBeenCalledWith('home');
    expect(clearSpy).toHaveBeenCalledWith('home');
  });
});
