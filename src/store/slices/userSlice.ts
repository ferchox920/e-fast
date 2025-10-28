import { createSlice } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TokenType, UserRead } from '@/types/user';

export type AuthStatus = 'idle' | 'authenticated' | 'anonymous';

export interface AuthSessionState {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: TokenType | null;
  expiresIn: number | null;
  expiresAt: number | null;
  scopes: string[];
}

export interface SetSessionPayload {
  accessToken: string | null;
  refreshToken?: string | null;
  tokenType?: TokenType | null;
  expiresIn?: number | null;
  issuedAt?: number;
  scopes?: string[] | null;
}

export interface AccessTokenPayload {
  accessToken: string;
  tokenType?: TokenType | null;
  expiresIn?: number | null;
  issuedAt?: number;
  scopes?: string[] | null;
}

export interface UserState {
  current: UserRead | null;
  session: AuthSessionState;
  status: AuthStatus;
}

export const createEmptySession = (): AuthSessionState => ({
  accessToken: null,
  refreshToken: null,
  tokenType: null,
  expiresIn: null,
  expiresAt: null,
  scopes: [],
});

const computeExpiresAt = (expiresIn?: number | null, issuedAt?: number | null): number | null => {
  if (typeof expiresIn !== 'number' || expiresIn <= 0) return null;
  const base = typeof issuedAt === 'number' ? issuedAt : Date.now();
  return base + expiresIn * 1000;
};

const buildSession = (payload: SetSessionPayload): AuthSessionState => {
  const expiresIn = typeof payload.expiresIn === 'number' ? payload.expiresIn : null;
  return {
    accessToken: payload.accessToken ?? null,
    refreshToken: payload.refreshToken ?? null,
    tokenType: payload.tokenType ?? (payload.accessToken ? 'bearer' : null),
    expiresIn,
    expiresAt: computeExpiresAt(expiresIn, payload.issuedAt ?? null),
    scopes: payload.scopes ? [...payload.scopes] : [],
  };
};

const normalizeSession = (payload?: unknown): AuthSessionState => {
  const base = createEmptySession();
  if (!payload || typeof payload !== 'object') {
    return base;
  }

  const session = payload as Partial<AuthSessionState> & {
    token?: string | null;
    access_token?: string | null;
    refresh_token?: string | null;
    token_type?: string | null;
    expires_in?: number | null;
    expires_at?: number | null;
  };

  const legacy = payload as {
    token?: string | null;
    refresh_token?: string | null;
    scopes?: unknown;
  };

  const coerceString = (value: unknown): string | null =>
    typeof value === 'string' && value.length > 0 ? value : null;

  const accessToken =
    coerceString(session.accessToken) ??
    coerceString(session.access_token) ??
    coerceString(legacy.token);

  const refreshToken =
    coerceString(session.refreshToken) ??
    coerceString(session.refresh_token) ??
    coerceString(legacy.refresh_token);

  const rawTokenType = coerceString(session.tokenType) ?? coerceString(session.token_type);

  const tokenType = rawTokenType ?? (accessToken ? 'bearer' : null);

  const expiresIn =
    typeof session.expiresIn === 'number'
      ? session.expiresIn
      : typeof session.expires_in === 'number'
        ? session.expires_in
        : null;

  const expiresAt =
    typeof session.expiresAt === 'number' && Number.isFinite(session.expiresAt)
      ? session.expiresAt
      : typeof session.expires_at === 'number' && Number.isFinite(session.expires_at)
        ? session.expires_at
        : null;

  const coerceScopes = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item)).filter((item) => item.length > 0);
  };

  const sessionScopes = coerceScopes((session as { scopes?: unknown }).scopes);
  const legacyScopes = coerceScopes(legacy.scopes);
  const scopes = sessionScopes.length ? sessionScopes : legacyScopes;

  return {
    accessToken: accessToken ?? null,
    refreshToken: refreshToken ?? null,
    tokenType: tokenType ?? (accessToken ? 'bearer' : null),
    expiresIn,
    expiresAt,
    scopes,
  };
};

const ensureSession = (state: { session?: AuthSessionState | null }): AuthSessionState => {
  if (!state.session) {
    state.session = createEmptySession();
  }
  return state.session;
};

type PersistedUserState = Partial<UserState> & {
  token?: string | null;
  refresh_token?: string | null;
  session?: unknown;
};

const initialState: UserState = {
  current: null,
  session: createEmptySession(),
  status: 'idle',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserRead | null>) {
      state.current = action.payload;
      state.status = action.payload ? 'authenticated' : 'anonymous';
    },
    clearUser(state) {
      state.current = null;
      state.session = createEmptySession();
      state.status = 'anonymous';
    },
    setSession(state, action: PayloadAction<SetSessionPayload | null>) {
      ensureSession(state);
      if (!action.payload) {
        state.session = createEmptySession();
        return;
      }
      state.session = buildSession(action.payload);
    },
    updateAccessToken(state, action: PayloadAction<AccessTokenPayload>) {
      const session = ensureSession(state);
      const { accessToken, tokenType, expiresIn, scopes, issuedAt } = action.payload;
      session.accessToken = accessToken;
      if (typeof tokenType !== 'undefined' && tokenType !== null) {
        session.tokenType = tokenType;
      }
      if (typeof expiresIn === 'number') {
        session.expiresIn = expiresIn;
        session.expiresAt = computeExpiresAt(expiresIn, issuedAt ?? null);
      } else if (typeof issuedAt === 'number' && session.expiresIn !== null) {
        session.expiresAt = computeExpiresAt(session.expiresIn, issuedAt);
      }
      if (Array.isArray(scopes)) {
        session.scopes = [...scopes];
      }
    },
    setStatus(state, action: PayloadAction<AuthStatus>) {
      state.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action) => {
      const payload = (action as PayloadAction<{ user?: PersistedUserState } | undefined>).payload;
      const inbound = payload?.user;
      if (!inbound) {
        return;
      }

      state.current = (inbound.current as UserRead | null) ?? null;
      state.status =
        (inbound.status as AuthStatus | undefined) ?? (state.current ? 'authenticated' : 'idle');

      const normalizedSession = normalizeSession(
        inbound.session ?? {
          token: inbound.token ?? null,
          refresh_token: inbound.refresh_token ?? null,
          scopes: (inbound as Record<string, unknown>)?.scopes,
        },
      );

      state.session = normalizedSession;
    });
  },
});

export const { setUser, clearUser, setSession, updateAccessToken, setStatus } = userSlice.actions;
export default userSlice.reducer;
