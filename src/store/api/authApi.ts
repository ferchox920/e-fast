// src/store/api/authApi.ts
import { baseApi } from './baseApi';
import type { TokenPair, TokenRefresh } from '@/types/user';
import { clearUser, setSession, setUser, updateAccessToken } from '@/store/slices/userSlice';
import { reset as resetNotifications } from '@/store/slices/notificationsSlice';
import { clearAll as clearAllWishes } from '@/store/slices/wishesSlice';
import type { OAuthProvider } from '@/types/user';
import type { AppDispatch, RootState } from '@/store';

type LoginBody = { email: string; password: string; rememberMe?: boolean };
type RefreshBody = { refresh_token: string };
type VerifyEmailBody = { email: string };
type PasswordResetRequestBody = { email: string };
type PasswordResetConfirmBody = { token: string; new_password: string };
type VerifyConfirmParams = { token: string };
type OAuthConfigItem = {
  provider: OAuthProvider | string;
  client_id: string;
};
type OAuthConfigResponse = {
  providers: OAuthConfigItem[];
};
type OAuthExchangeBody = {
  provider: OAuthProvider | string;
  id_token: string;
};
type OAuthUpsertBody = {
  provider: OAuthProvider | string;
  sub: string;
  email: string;
  full_name?: string | null;
  picture?: string | null;
  email_verified?: boolean | null;
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

const applySessionFromTokenPair = (
  data: TokenPair,
  dispatch: AppDispatch,
  rememberMe: boolean,
) => {
  const scopes =
    Array.isArray(data.scopes) && data.scopes.length > 0
      ? data.scopes
      : getScopesFromAccessToken(data.access_token);

  dispatch(resetNotifications());
  dispatch(clearAllWishes());
  dispatch(
    setSession({
      accessToken: data.access_token,
      refreshToken: rememberMe ? data.refresh_token : null,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scopes,
      issuedAt: Date.now(),
    }),
  );
  dispatch(setUser(data.user));
};

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
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          applySessionFromTokenPair(data, dispatch, arg.rememberMe ?? true);
        } catch {
          // No-op: la UI maneja el error del endpoint.
        }
      },
    }),

    // /auth/refresh { refresh_token }
    refresh: build.mutation<TokenRefresh, RefreshBody>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const scopes =
            Array.isArray(data.scopes) && data.scopes.length > 0
              ? data.scopes
              : getScopesFromAccessToken(data.access_token);
          dispatch(
            updateAccessToken({
              accessToken: data.access_token,
              tokenType: data.token_type,
              expiresIn: data.expires_in,
              scopes,
              issuedAt: Date.now(),
            }),
          );
        } catch {
          // No-op: baseQuery ya limpia sesion si refresh falla por 401.
        }
      },
    }),

    // /auth/verify/request { email } → 204
    requestVerifyEmail: build.mutation<void, VerifyEmailBody>({
      query: (body) => ({
        url: '/auth/verify/request',
        method: 'POST',
        body,
      }),
    }),
    verifyEmailConfirm: build.query<{ message: string }, VerifyConfirmParams>({
      query: ({ token }) => ({
        url: '/auth/verify/confirm',
        params: { token },
      }),
    }),

    requestPasswordReset: build.mutation<void, PasswordResetRequestBody>({
      query: (body) => ({
        url: '/auth/password/reset/request',
        method: 'POST',
        body,
      }),
    }),

    confirmPasswordReset: build.mutation<void, PasswordResetConfirmBody>({
      query: (body) => ({
        url: '/auth/password/reset/confirm',
        method: 'POST',
        body,
      }),
    }),

    oauthConfig: build.query<OAuthConfigResponse, void>({
      query: () => ({
        url: '/auth/oauth/config',
      }),
    }),

    oauthExchange: build.mutation<TokenPair, OAuthExchangeBody & { rememberMe?: boolean }>({
      query: ({ provider, id_token }) => ({
        url: '/auth/oauth/exchange',
        method: 'POST',
        body: { provider, id_token },
      }),
      invalidatesTags: ['User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          applySessionFromTokenPair(data, dispatch, arg.rememberMe ?? true);
        } catch {
          // No-op: la UI maneja el error del endpoint.
        }
      },
    }),

    oauthUpsert: build.mutation<TokenPair, OAuthUpsertBody>({
      query: (body) => ({
        url: '/auth/oauth/upsert',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          applySessionFromTokenPair(data, dispatch, true);
        } catch {
          // No-op: la UI maneja el error del endpoint.
        }
      },
    }),

    logout: build.mutation<null, void>({
      queryFn: async (_arg, api, _extraOptions, fetchWithBQ) => {
        const state = api.getState() as RootState;
        const refreshToken = state.user.session.refreshToken;
        if (!refreshToken) {
          return { data: null };
        }
        const response = await fetchWithBQ({
          url: '/auth/logout',
          method: 'POST',
          body: { refresh_token: refreshToken },
        });
        if (response.error) {
          return { error: response.error };
        }
        return { data: null };
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearUser());
          dispatch(resetNotifications());
          dispatch(clearAllWishes());
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshMutation,
  useRequestVerifyEmailMutation,
  useVerifyEmailConfirmQuery,
  useLazyVerifyEmailConfirmQuery,
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
  useOauthConfigQuery,
  useOauthExchangeMutation,
  useOauthUpsertMutation,
  useLogoutMutation,
} = authApi;
