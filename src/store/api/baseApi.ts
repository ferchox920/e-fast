// src/store/api/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '@/store';
import { clearUser, updateAccessToken } from '@/store/slices/userSlice';
import type { TokenRefresh } from '@/types/user';

const rawBaseQuery = fetchBaseQuery({
  baseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000/api/v1',
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
        api.dispatch(
          updateAccessToken({
            accessToken: refreshResult.data.access_token,
            tokenType: refreshResult.data.token_type,
            expiresIn: refreshResult.data.expires_in,
            scopes: refreshResult.data.scopes ?? null,
            issuedAt: Date.now(),
          }),
        );
        refreshPromise = null;
        return true;
      }

      refreshPromise = null;
      api.dispatch(clearUser());
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
    'Notification',
    'NotificationList',
    'Cart',
    'CatalogBrand',
    'CatalogCategory',
  ],
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
});
