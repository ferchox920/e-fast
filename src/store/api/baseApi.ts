'use client';
// src/store/api/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '@/store';
import { clearUser, updateAccessToken } from '@/store/slices/userSlice';
import type { TokenRefresh } from '@/types/user';

const rawBaseQuery = fetchBaseQuery({
  baseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ??
    'http://localhost:8000/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const session = state.user?.session;
    const token = session?.accessToken;
    if (token) {
      const candidate = session?.tokenType ?? 'bearer';
      const scheme = candidate.toLowerCase() === 'bearer' ? 'Bearer' : candidate;
      headers.set('authorization', `${scheme} ${token}`);
    }
    return headers;
  },
});

type RawBaseQuery = typeof rawBaseQuery;
type BaseQueryApi = Parameters<RawBaseQuery>[1];
type BaseQueryExtraOptions = Parameters<RawBaseQuery>[2];

const isTokenRefresh = (data: unknown): data is TokenRefresh => {
  if (!data || typeof data !== 'object') return false;
  return (
    'access_token' in data && typeof (data as { access_token: unknown }).access_token === 'string'
  );
};

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  if (typeof atob !== 'function') {
    throw new Error('atob is not available in this environment');
  }
  return atob(padded);
};

const getScopesFromAccessToken = (accessToken: string): string[] => {
  const parts = accessToken.split('.');
  if (parts.length < 2) return [];
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { scopes?: unknown };
    if (!Array.isArray(payload.scopes)) return [];
    return payload.scopes.map((item) => String(item)).filter((item) => item.length > 0);
  } catch {
    return [];
  }
};

let refreshPromise: Promise<boolean> | null = null;

const performRefresh = (
  api: BaseQueryApi,
  extraOptions: BaseQueryExtraOptions,
): Promise<boolean> => {
  const state = api.getState() as RootState;
  const refreshToken = state.user?.session?.refreshToken;
  if (!refreshToken) return Promise.resolve(false);

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshResult = await rawBaseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult.data && isTokenRefresh(refreshResult.data)) {
        const scopes =
          Array.isArray(refreshResult.data.scopes) && refreshResult.data.scopes.length > 0
            ? refreshResult.data.scopes
            : getScopesFromAccessToken(refreshResult.data.access_token);
        api.dispatch(
          updateAccessToken({
            accessToken: refreshResult.data.access_token,
            tokenType: refreshResult.data.token_type,
            expiresIn: refreshResult.data.expires_in,
            scopes,
            issuedAt: Date.now(),
          }),
        );
        refreshPromise = null;
        return true;
      }

      refreshPromise = null;
      api.dispatch(clearUser());
      api.dispatch({ type: 'notifications/reset' });
      api.dispatch({ type: 'wishes/clearAll' });
      return false;
    })();
  }

  return refreshPromise;
};

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const state = api.getState() as RootState;
  const expiresAt = state.user?.session?.expiresAt;
  if (expiresAt && expiresAt - Date.now() <= 30_000) {
    await performRefresh(api, extraOptions);
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshed = await performRefresh(api, extraOptions);
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else if (!state.user?.session?.refreshToken) {
      api.dispatch(clearUser());
      api.dispatch({ type: 'notifications/reset' });
      api.dispatch({ type: 'wishes/clearAll' });
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  tagTypes: [
    'User',
    'UserList',
    'Product',
    'ProductList',
    'ProductVariant',
    'ProductImage',
    'ProductQuestion',
    'Notification',
    'NotificationList',
    'Cart',
    'CatalogBrand',
    'CatalogCategory',
    'AdminAnalytics',
    'AdminOrder',
    'AdminQuestion',
    'Payment',
    'Wish',
    'Promotion',
    'Loyalty',
    'Report',
    'Engagement',
    'Exposure',
    'Scoring',
    'Purchase',
  ],
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
});
