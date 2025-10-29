'use client';

import Link from 'next/link';
import NotificationBell from '@/components/notifications/NotificationBell';
import type { UserRead } from '@/types/user';
import { CartIcon, HeartIcon, SearchIcon, UserIcon } from './icons';

export const ICON_BUTTON_CLASS =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-white text-gray-600 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';

interface NavActionsProps {
  user: UserRead | null;
  cartItemCount: number;
  onSearchClick: () => void;
  onLogout?: () => void;
  onCloseMenu: () => void;
}

export default function NavActions({
  user,
  cartItemCount,
  onSearchClick,
  onLogout,
  onCloseMenu,
}: NavActionsProps) {
  return (
    <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
      <button
        type="button"
        className={ICON_BUTTON_CLASS}
        aria-label="Abrir buscador"
        onClick={onSearchClick}
      >
        <SearchIcon />
        <span className="sr-only">Buscar productos</span>
      </button>

      {user && <NotificationBell />}

      <div className="relative">
        {user ? (
          <div className="group relative">
            <button
              className={ICON_BUTTON_CLASS}
              aria-haspopup="menu"
              aria-expanded="false"
              aria-label="Abrir menu de mi cuenta"
            >
              <UserIcon />
            </button>
            <div className="invisible absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <span className="block truncate px-4 py-2 text-sm italic text-gray-500">
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
                  onClick={onLogout}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                  role="menuitem"
                >
                  Cerrar Sesion
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className={ICON_BUTTON_CLASS}
            onClick={onCloseMenu}
            aria-label="Ir a mi cuenta"
          >
            <UserIcon />
            <span className="sr-only">Mi cuenta</span>
          </Link>
        )}
      </div>

      <Link
        href="/lista-deseos"
        className={ICON_BUTTON_CLASS}
        onClick={onCloseMenu}
        aria-label="Abrir lista de deseos"
      >
        <HeartIcon />
        <span className="sr-only">Lista de deseos</span>
      </Link>

      <Link
        href="/carrito"
        className={`${ICON_BUTTON_CLASS} relative`}
        aria-label={`Abrir carrito (${cartItemCount} articulos)`}
        onClick={onCloseMenu}
      >
        <CartIcon />
        <span className="sr-only">Carrito de compras</span>
        {cartItemCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold leading-none text-white">
            {cartItemCount}
          </span>
        )}
      </Link>
    </div>
  );
}
