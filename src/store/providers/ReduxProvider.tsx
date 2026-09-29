'use client';

import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { store } from '@/store';

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Remove tokens left by versions that persisted the whole Redux tree.
    window.localStorage.removeItem('persist:root');
  }, []);
  return <Provider store={store}>{children}</Provider>;
}
