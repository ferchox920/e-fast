'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch, useLogoutHandler } from '@/store/hooks';
import { setUser } from '@/store/slices/userSlice';
import { useLazyMeQuery } from '@/store/api/usersApi';
import NavBar from './NavBar';
import type { NavBarCategoryGroup } from './NavBar';

export default function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.user?.current ?? null);
  const token = useAppSelector((state) => state.user?.session?.accessToken ?? null);

  const [triggerFetchMe, { data: fetchedUser, isFetching: isFetchingMe }] = useLazyMeQuery();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const categoryGroups: NavBarCategoryGroup[] = [
    {
      id: 'men',
      name: '\u2642 Hombres',
      items: [
        { id: 'men-ropa', name: 'Ropa', slug: 'hombres/ropa' },
        { id: 'men-zapatos', name: 'Zapatos', slug: 'hombres/zapatos' },
        { id: 'men-accesorios', name: 'Accesorios', slug: 'hombres/accesorios' },
      ],
    },
    {
      id: 'women',
      name: '\u2640 Mujeres',
      items: [
        { id: 'women-ropa', name: 'Ropa', slug: 'mujeres/ropa' },
        { id: 'women-zapatos', name: 'Zapatos', slug: 'mujeres/zapatos' },
        { id: 'women-accesorios', name: 'Accesorios', slug: 'mujeres/accesorios' },
      ],
    },
  ];
  useEffect(() => {
    if (token && !user && !isFetchingMe) triggerFetchMe();
    if (fetchedUser) dispatch(setUser(fetchedUser));
  }, [token, user, isFetchingMe, triggerFetchMe, fetchedUser, dispatch]);

  const logout = useLogoutHandler();

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/');
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, router]);

  return (
    <NavBar
      brandHref="/"
      brandLabel="MyApp"
      categoryGroups={categoryGroups}
      user={user}
      onLogout={handleLogout}
      isLogoutPending={isLoggingOut}
    />
  );
}
