import { baseApi } from './baseApi';
import type { UserRead } from '@/types/user';

// Tipos según tus endpoints de FastAPI
export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: UserRead;
};

export type TokenRefresh = {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
};

type LoginBody = { email: string; password: string };
type RefreshBody = { refresh_token: string };
type VerifyEmailBody = { email: string };

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // /auth/login usa OAuth2PasswordRequestForm (username + password) x-www-form-urlencoded
    // /auth/login (OAuth2PasswordRequestForm)
    login: build.mutation<TokenPair, { email: string; password: string }>({
      query: ({ email, password }) => ({
        url: '/auth/login',
        method: 'POST',
        body: new URLSearchParams({ username: email, password }),
      }),
      invalidatesTags: ['User'],
    }),

    // /auth/refresh { refresh_token }
    refresh: build.mutation<TokenRefresh, RefreshBody>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),

    // /auth/verify/request { email } → 204
    requestVerifyEmail: build.mutation<void, VerifyEmailBody>({
      query: (body) => ({
        url: '/auth/verify/request',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation, useRefreshMutation, useRequestVerifyEmailMutation } = authApi;
