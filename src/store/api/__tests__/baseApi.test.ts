import { http, HttpResponse } from 'msw';
import { configureStore } from '@reduxjs/toolkit';

import { baseApi } from '@/store/api/baseApi';
import { server } from '@/test-utils/msw/server';
import { rootReducer, type RootReducerState } from '@/store/rootReducer';
import { setSession, setUser } from '@/store/slices/userSlice';
import type { UserRead } from '@/types/user';

const TEST_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ??
  'http://localhost:8000/api/v1';

const testApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getProtected: build.query<{ ok: boolean }, void>({
      query: () => ({ url: '/protected' }),
    }),
  }),
});

const getProtectedEndpoint = testApi.endpoints.getProtected;

const createStore = (preloadedState?: Partial<RootReducerState>) => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(baseApi.middleware),
    preloadedState: preloadedState as RootReducerState,
  });
};

describe('baseApi baseQueryWithReauth', () => {
  it('uses the current access token when requesting protected resources', async () => {
    const store = createStore();
    store.dispatch(
      setSession({
        accessToken: 'initial-token',
        refreshToken: null,
        tokenType: 'bearer',
        expiresIn: 3600,
        issuedAt: Date.now(),
      }),
    );

    const capturedAuth: string[] = [];

    server.use(
      http.get(`${TEST_BASE_URL}/protected`, ({ request }) => {
        const authHeader = request.headers.get('authorization') ?? '';
        capturedAuth.push(authHeader);
        return HttpResponse.json({ ok: true });
      }),
    );

    const result = await store.dispatch(getProtectedEndpoint.initiate()).unwrap();

    expect(result).toEqual({ ok: true });
    expect(capturedAuth).toHaveLength(1);
    expect(capturedAuth[0]).toBe('Bearer initial-token');
  });

  it('refreshes the access token and retries the original request when receiving 401', async () => {
    const store = createStore();
    store.dispatch(
      setSession({
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        tokenType: 'bearer',
        expiresIn: 1,
        issuedAt: Date.now() - 10_000,
      }),
    );

    let requestCount = 0;

    server.use(
      http.get(`${TEST_BASE_URL}/protected`, () => {
        requestCount += 1;
        if (requestCount === 1) {
          return HttpResponse.json({ detail: 'expired' }, { status: 401 });
        }
        return HttpResponse.json({ ok: true });
      }),
      http.post(`${TEST_BASE_URL}/auth/refresh`, async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ refresh_token: 'refresh-token' });
        return HttpResponse.json({
          access_token: 'renewed-token',
          token_type: 'bearer',
          expires_in: 7200,
          scopes: ['read'],
        });
      }),
    );

    const result = await store.dispatch(getProtectedEndpoint.initiate()).unwrap();

    expect(result).toEqual({ ok: true });
    expect(requestCount).toBe(2);

    const state = store.getState();
    expect(state.user.session.accessToken).toBe('renewed-token');
    expect(state.user.session.tokenType).toBe('bearer');
    expect(state.user.session.expiresIn).toBe(7200);
    expect(state.user.session.scopes).toEqual(['read']);
  });

  it('clears the user session when token refresh fails after a 401 response', async () => {
    const store = createStore();

    const mockUser: UserRead = {
      id: 'user-1',
      email: 'user@example.com',
      full_name: 'Test User',
      is_active: true,
      is_superuser: false,
      email_verified: true,
    };

    store.dispatch(setUser(mockUser));
    store.dispatch(
      setSession({
        accessToken: 'expired-token',
        refreshToken: 'invalid-refresh',
        tokenType: 'bearer',
        expiresIn: 1,
        issuedAt: Date.now() - 5_000,
      }),
    );

    server.use(
      http.get(`${TEST_BASE_URL}/protected`, () => {
        return HttpResponse.json({ detail: 'expired' }, { status: 401 });
      }),
      http.post(`${TEST_BASE_URL}/auth/refresh`, () => {
        return HttpResponse.json({ detail: 'invalid refresh token' }, { status: 401 });
      }),
    );

    await expect(store.dispatch(getProtectedEndpoint.initiate()).unwrap()).rejects.toMatchObject({
      status: 401,
    });

    const state = store.getState();
    expect(state.user.current).toBeNull();
    expect(state.user.status).toBe('anonymous');
    expect(state.user.session.accessToken).toBeNull();
    expect(state.user.session.refreshToken).toBeNull();
  });
});
