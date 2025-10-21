import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserRead } from '@/types/user';

interface UserState {
  current: UserRead | null;
  token: string | null;
  refresh_token?: string | null;
}

const initialState: UserState = {
  current: null,
  token: null,
  refresh_token: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserRead | null>) {
      state.current = action.payload;
    },
    clearUser(state) {
      state.current = null;
      state.token = null;
      state.refresh_token = null;
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
    },
    setRefreshToken(state, action: PayloadAction<string | null>) {
      state.refresh_token = action.payload;
    },
  },
});

export const { setUser, clearUser, setToken, setRefreshToken } = userSlice.actions;
export default userSlice.reducer;
