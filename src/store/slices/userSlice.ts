// src/store/slices|/userSlice.ts  (recomendado mover a esta ruta)
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserRead } from '@/types/user';

interface UserState {
  current: UserRead | null;
  token: string | null;
}

const initialState: UserState = {
  current: null,
  token: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserRead>) {
      state.current = action.payload;
    },
    clearUser(state) {
      state.current = null;
      state.token = null;
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
  },
});

export const { setUser, clearUser, setToken } = userSlice.actions;
export default userSlice.reducer;
