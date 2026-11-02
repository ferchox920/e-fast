'use client';

import { useListWishesQuery } from '@/store/api/wishesApi';
import { useAppSelector } from '@/store/hooks';

export default function WishlistSyncManager() {
  const authStatus = useAppSelector((state) => state.user.status);
  const accessToken = useAppSelector((state) => state.user.session.accessToken);
  const scopes = useAppSelector((state) => state.user.session.scopes ?? []);
  const currentUser = useAppSelector((state) => state.user.current);

  const isAuthenticated = Boolean(accessToken) && authStatus === 'authenticated';
  const isAdminUser =
    currentUser?.is_superuser === true ||
    ((currentUser as { role?: string | null } | null)?.role ?? null) === 'admin';
  const shouldFetch = isAuthenticated && !isAdminUser && scopes.includes('users:read');

  useListWishesQuery(undefined, { skip: !shouldFetch });

  return null;
}
