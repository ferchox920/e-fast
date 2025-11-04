'use client';
import { useCallback } from 'react';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { baseApi } from '@/store/api/baseApi';
import { useLogoutMutation } from '@/store/api/authApi';
import { clearUser } from '@/store/slices/userSlice';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export interface UseLogoutOptions {
  revokeRefreshToken?: boolean;
}

export const useLogoutHandler = () => {
  const dispatch = useAppDispatch();
  const refreshToken = useAppSelector((state) => state.user?.session?.refreshToken ?? null);
  const [triggerLogout] = useLogoutMutation();

  return useCallback(
    async (options?: UseLogoutOptions) => {
      const shouldRevoke = options?.revokeRefreshToken ?? true;
      if (shouldRevoke && refreshToken) {
        try {
          await triggerLogout({ refresh_token: refreshToken }).unwrap();
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('useLogoutHandler: token revocation failed', error);
          }
        }
      }

      dispatch(clearUser());
      dispatch(baseApi.util.resetApiState());
    },
    [dispatch, refreshToken, triggerLogout],
  );
};
