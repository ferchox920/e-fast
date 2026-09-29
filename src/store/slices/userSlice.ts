import { createSlice } from '@reduxjs/toolkit';
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

const ensureSession = (state: { session?: AuthSessionState | null }): AuthSessionState => {
  if (!state.session) {
    state.session = createEmptySession();
  }
  return state.session;
};

const initialState: UserState = {
  current: null,
  session: createEmptySession(),
  status: 'anonymous',
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
        state.current = null;
        state.status = 'anonymous';
        return;
      }
      state.session = buildSession(action.payload);
      state.status = state.session.accessToken ? 'authenticated' : 'anonymous';
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
      state.status = accessToken ? 'authenticated' : 'anonymous';
    },
    setStatus(state, action: PayloadAction<AuthStatus>) {
      state.status = action.payload;
    },
  },
});

export const { setUser, clearUser, setSession, updateAccessToken, setStatus } = userSlice.actions;
export default userSlice.reducer;
