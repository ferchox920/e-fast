'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearUser, setUser } from '@/store/slices/userSlice';
import { useLazyMeQuery } from '@/store/api/usersApi';
import NavBar from './NavBar';
import type { NavBarCategoryGroup } from './NavBar';

export default function Header() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user?.current ?? null);
  const token = useAppSelector((state) => state.user?.session?.accessToken ?? null);

  const [triggerFetchMe, { data: fetchedUser, isFetching: isFetchingMe }] = useLazyMeQuery();

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
  const cartItemCount = 2;

  useEffect(() => {
    if (token && !user && !isFetchingMe) triggerFetchMe();
    if (fetchedUser) dispatch(setUser(fetchedUser));
  }, [token, user, isFetchingMe, triggerFetchMe, fetchedUser, dispatch]);

  const handleLogout = () => {
    dispatch(clearUser());
  };

  return (
    <NavBar
      brandHref="/"
      brandLabel="MyApp"
      categoryGroups={categoryGroups}
      cartItemCount={cartItemCount}
      user={user}
      onLogout={handleLogout}
    />
  );
}
