import { type PropsWithChildren, type ReactElement } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';

import { baseApi } from '@/store/api/baseApi';
import { rootReducer } from '@/store/rootReducer';
import type { RootReducerState } from '@/store/rootReducer';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export type RootPreloadedState = DeepPartial<RootReducerState>;

export type AppStore = ReturnType<typeof setupStore>;

interface ExtendedRenderOptions {
  preloadedState?: RootPreloadedState;
  store?: AppStore;
  renderOptions?: Omit<RenderOptions, 'wrapper'>;
}

export function setupStore(preloadedState?: RootPreloadedState) {
  return configureStore({
    reducer: rootReducer,
    // Allow passing only slices of state for targeted tests.
    preloadedState: preloadedState as RootReducerState | undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(baseApi.middleware),
  });
}

export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, store = setupStore(preloadedState), renderOptions }: ExtendedRenderOptions = {},
) {
  function Wrapper({ children }: PropsWithChildren<unknown>) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
