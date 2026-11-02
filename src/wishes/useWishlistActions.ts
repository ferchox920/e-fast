'use client';

import { useCallback } from 'react';

import { showErrorToast, showInfoToast } from '@/lib/toast';
import { useCreateWishMutation, useDeleteWishMutation } from '@/store/api/wishesApi';
import { useAppSelector } from '@/store/hooks';
import { selectWishIdByProductId, selectWishIds } from '@/store/slices/wishesSlice';

const getWishErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
      return data.detail;
    }
  }
  return fallback;
};

export const useWishlistActions = () => {
  const authStatus = useAppSelector((state) => state.user.status);
  const accessToken = useAppSelector((state) => state.user.session.accessToken);
  const currentUser = useAppSelector((state) => state.user.current);
  const scopes = useAppSelector((state) => state.user.session.scopes ?? []);
  const wishIds = useAppSelector(selectWishIds);
  const wishIdByProductId = useAppSelector(selectWishIdByProductId);

  const [createWish, createWishState] = useCreateWishMutation();
  const [deleteWish, deleteWishState] = useDeleteWishMutation();

  const isAuthenticated = Boolean(accessToken) && authStatus === 'authenticated';
  const isAdminUser =
    currentUser?.is_superuser === true ||
    ((currentUser as { role?: string | null } | null)?.role ?? null) === 'admin';
  const canReadWishes = !isAdminUser && scopes.includes('users:read');
  const canWriteWishes = !isAdminUser && scopes.includes('users:write');

  const isFavorite = useCallback((productId: string) => wishIds.includes(productId), [wishIds]);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      const normalizedProductId = productId.trim();
      if (!normalizedProductId) return false;

      if (!isAuthenticated) {
        showInfoToast('Inicia sesion para guardar productos en favoritos.');
        return false;
      }
      if (isAdminUser) {
        showInfoToast('Las cuentas administradoras no gestionan favoritos de cliente.');
        return false;
      }
      if (!canWriteWishes) {
        showErrorToast('Tu sesion no tiene permisos para gestionar favoritos.');
        return false;
      }

      const existingWishId = wishIdByProductId[normalizedProductId] ?? null;
      const alreadyWished = wishIds.includes(normalizedProductId);

      try {
        if (alreadyWished) {
          if (!existingWishId) {
            showInfoToast('Sincronizando favoritos. Intenta nuevamente en unos segundos.');
            return true;
          }
          await deleteWish({
            wishId: existingWishId,
            productId: normalizedProductId,
          }).unwrap();
          showInfoToast('Producto quitado de favoritos.');
          return false;
        }

        await createWish({
          product_id: normalizedProductId,
          notify_discount: true,
        }).unwrap();
        showInfoToast('Producto agregado a favoritos.');
        return true;
      } catch (error) {
        showErrorToast(
          getWishErrorMessage(error, 'No pudimos actualizar tus favoritos. Intenta nuevamente.'),
        );
        return alreadyWished;
      }
    },
    [
      canWriteWishes,
      createWish,
      deleteWish,
      isAdminUser,
      isAuthenticated,
      wishIdByProductId,
      wishIds,
    ],
  );

  return {
    canReadWishes,
    canWriteWishes,
    isFavorite,
    isMutating: createWishState.isLoading || deleteWishState.isLoading,
    toggleWishlist,
  };
};
