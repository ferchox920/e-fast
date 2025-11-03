import { combineReducers } from '@reduxjs/toolkit';

import { baseApi } from './api/baseApi';
import userReducer from './slices/userSlice';
import notificationsReducer from './slices/notificationsSlice';
import wishesReducer from './slices/wishesSlice';

export const rootReducer = combineReducers({
  user: userReducer,
  notifications: notificationsReducer,
  wishes: wishesReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootReducerState = ReturnType<typeof rootReducer>;
