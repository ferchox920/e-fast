'use client';
import { useCallback } from 'react';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { useLogoutMutation } from '@/store/api/authApi';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export interface UseLogoutOptions {
  revokeRefreshToken?: boolean;
}

export const useLogoutHandler = () => {
  const [triggerLogout] = useLogoutMutation();

  return useCallback(
    async (options?: UseLogoutOptions) => {
      try {
        await triggerLogout().unwrap();
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('useLogoutHandler: token revocation failed', error, options);
        }
      }
    },
    [triggerLogout],
  );
};
