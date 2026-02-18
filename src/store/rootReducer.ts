import { combineReducers } from '@reduxjs/toolkit';

import { baseApi } from './api/baseApi';
import userReducer from './slices/userSlice';
import notificationsReducer from './slices/notificationsSlice';
import wishesReducer from './slices/wishesSlice';
import catalogReducer from './slices/catalogSlice';
import cartReducer from './slices/cartSlice';
import ordersReducer from './slices/ordersSlice';
import paymentsReducer from './slices/paymentsSlice';
import promotionsReducer from './slices/promotionsSlice';
import loyaltyReducer from './slices/loyaltySlice';
import reportsReducer from './slices/reportsSlice';
import engagementReducer from './slices/engagementSlice';
import exposureReducer from './slices/exposureSlice';
import scoringReducer from './slices/scoringSlice';
import purchasesReducer from './slices/purchasesSlice';
import productQuestionsReducer from './slices/productQuestionsSlice';

export const rootReducer = combineReducers({
  user: userReducer,
  notifications: notificationsReducer,
  wishes: wishesReducer,
  catalog: catalogReducer,
  cart: cartReducer,
  orders: ordersReducer,
  payments: paymentsReducer,
  promotions: promotionsReducer,
  loyalty: loyaltyReducer,
  reports: reportsReducer,
  engagement: engagementReducer,
  exposure: exposureReducer,
  scoring: scoringReducer,
  purchases: purchasesReducer,
  productQuestions: productQuestionsReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootReducerState = ReturnType<typeof rootReducer>;
