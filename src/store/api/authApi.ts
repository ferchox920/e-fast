// src/store/api/authApi.ts
import { baseApi } from './baseApi';
import type { TokenPair, TokenRefresh } from '@/types/user';
import { clearUser, setSession, setUser, updateAccessToken } from '@/store/slices/userSlice';
import { reset as resetNotifications } from '@/store/slices/notificationsSlice';
import { clearAll as clearAllWishes } from '@/store/slices/wishesSlice';
import type { OAuthProvider } from '@/types/user';

type LoginBody = { email: string; password: string; rememberMe?: boolean };
type RefreshBody = { refresh_token: string };
type VerifyEmailBody = { email: string };
type VerifyConfirmParams = { token: string };
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
          const rememberMe = arg.rememberMe ?? true;
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
          const scopes =
            Array.isArray(data.scopes) && data.scopes.length > 0
              ? data.scopes
              : getScopesFromAccessToken(data.access_token);

          dispatch(resetNotifications());
          dispatch(clearAllWishes());
          dispatch(
            setSession({
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              tokenType: data.token_type,
              expiresIn: data.expires_in,
              scopes,
              issuedAt: Date.now(),
            }),
          );
          dispatch(setUser(data.user));
        } catch {
          // No-op: la UI maneja el error del endpoint.
        }
      },
    }),

    logout: build.mutation<void, void>({
      // Backend no expone /auth/logout por ahora.
      // Conservamos el hook para centralizar el flujo de cierre de sesion.
      queryFn: async () => ({ data: undefined }),
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
  useOauthUpsertMutation,
  useLogoutMutation,
} = authApi;
