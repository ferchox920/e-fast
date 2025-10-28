// src/store/api/authApi.ts
import { baseApi } from './baseApi';
import type { TokenPair, TokenRefresh } from '@/types/user';

type LoginBody = { email: string; password: string };
type RefreshBody = { refresh_token: string };
type VerifyEmailBody = { email: string };

export const authApi = baseApi.injectEndpoints({
  // <- Clave para evitar el error de “override already-existing endpointName ...”
  overrideExisting: true,

  endpoints: (build) => ({
    // /auth/login usa OAuth2PasswordRequestForm (username + password) x-www-form-urlencoded
    login: build.mutation<TokenPair, LoginBody>({
      query: ({ email, password }) => ({
        url: '/auth/login',
        method: 'POST',
        body: new URLSearchParams({ username: email, password }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
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
});

export const { useLoginMutation, useRefreshMutation, useRequestVerifyEmailMutation } = authApi;
