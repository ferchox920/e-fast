'use client';

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import type { PersistConfig } from 'redux-persist/es/types';
import storage from 'redux-persist/lib/storage'; // usa localStorage en web

// Importa tu slice de usuario
import userReducer from '@/store/slices/userSlice';

// --- Reducers raíz ---
const rootReducer = combineReducers({
  user: userReducer,
});

// --- Configuración de persistencia ---
const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: 'root',
  storage,
  whitelist: ['user'], // reducers que se persistirán
};

// --- Reducer persistente ---
const persistedReducer = persistReducer(persistConfig, rootReducer);

// --- Store ---
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // requerido por redux-persist
    }),
});

// --- Persistor ---
export const persistor = persistStore(store);

// --- Tipos globales ---
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
