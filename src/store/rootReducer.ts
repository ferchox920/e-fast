import { combineReducers } from '@reduxjs/toolkit';

import { baseApi } from './api/baseApi';
import userReducer from './slices/userSlice';
import notificationsReducer from './slices/notificationsSlice';

export const rootReducer = combineReducers({
  user: userReducer,
  notifications: notificationsReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootReducerState = ReturnType<typeof rootReducer>;
