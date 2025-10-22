'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearUser, setUser } from '@/store/slices/userSlice';
import { useLazyMeQuery } from '@/store/api/usersApi';

const PlaceholderIcon = ({ name }: { name: string }) => (
  <span className="inline-block w-6 h-6 border rounded text-xs leading-none text-center pt-1">
    {name.substring(0, 1)}
  </span>
);

export default function Header() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.current);
  const token = useAppSelector((state) => state.user.token);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [triggerFetchMe, { data: fetchedUser, isFetching: isFetchingMe }] = useLazyMeQuery();

  const categories = [
    { id: '1', name: 'Categoría 1', slug: 'categoria-1' },
    { id: '2', name: 'Categoría 2', slug: 'categoria-2' },
    { id: '3', name: 'Categoría 3', slug: 'categoria-3' },
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
    <header className="w-full border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="md:hidden mr-2">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <PlaceholderIcon name={isMenuOpen ? 'X' : 'M'} />
              </button>
            </div>
            <Link href="/" className="font-bold text-xl text-indigo-600">
              MyApp
            </Link>
          </div>

          <nav className="hidden md:flex space-x-6 items-center">
            <div className="relative group">
              <button className="text-gray-500 hover:text-gray-900">Categorías</button>
              <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categorias/${cat.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/ofertas" className="text-gray-500 hover:text-gray-900">
              Ofertas
            </Link>
            <Link href="/novedades" className="text-gray-500 hover:text-gray-900">
              Novedades
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-gray-500">
              <PlaceholderIcon name="S" />
            </button>

            <Link href="/carrito" className="relative text-gray-400 hover:text-gray-500">
              <PlaceholderIcon name="C" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>

            <div className="relative">
              {user ? (
                <div className="relative group">
                  <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <PlaceholderIcon name="U" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <span className="block px-4 py-2 text-sm text-gray-500 italic truncate">
                        {user.email}
                      </span>
                      <Link
                        href="/mi-cuenta"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Mi Cuenta
                      </Link>
                      <Link
                        href="/mis-pedidos"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Mis Pedidos
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Ingresar
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-b shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {categories.map((cat) => (
              <Link
                key={`mobile-${cat.id}`}
                href={`/categorias/${cat.slug}`}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/ofertas"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Ofertas
            </Link>
            <Link
              href="/novedades"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Novedades
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
