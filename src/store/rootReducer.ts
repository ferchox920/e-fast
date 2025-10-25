import { combineReducers } from '@reduxjs/toolkit';

import { baseApi } from './api/baseApi';
import userReducer from './slices/userSlice';

export const rootReducer = combineReducers({
  user: userReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootReducerState = ReturnType<typeof rootReducer>;
