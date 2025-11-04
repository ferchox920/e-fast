'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import Link from 'next/link';
import NotificationBell from '@/components/notifications/NotificationBell';
import type { UserRead } from '@/types/user';
import MiniCart from '@/components/cart/MiniCart';
import { HeartIcon, SearchIcon, UserIcon } from './icons';
import { ICON_BUTTON_CLASS } from './constants';

interface NavActionsProps {
  user: UserRead | null;
  onSearchClick: () => void;
  onLogout?: () => void;
  onCloseMenu: () => void;
}

export default function NavActions({
  user,
  onSearchClick,
  onLogout,
  onCloseMenu,
}: NavActionsProps) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelScheduledClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelScheduledClose();
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      setIsAccountMenuOpen(false);
    }, 150);
  }, [cancelScheduledClose]);

  const openAccountMenu = useCallback(() => {
    cancelScheduledClose();
    setIsAccountMenuOpen(true);
  }, [cancelScheduledClose]);

  const closeAccountMenu = useCallback(() => {
    cancelScheduledClose();
    setIsAccountMenuOpen(false);
  }, [cancelScheduledClose]);

  const toggleAccountMenu = useCallback(() => {
    cancelScheduledClose();
    setIsAccountMenuOpen((prev) => !prev);
  }, [cancelScheduledClose]);

  const handlePointerLeaveAccount = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget as Node | null;
      if (nextTarget && event.currentTarget.contains(nextTarget)) {
        return;
      }
      scheduleClose();
    },
    [scheduleClose],
  );

  const handleAccountBlur = useCallback(
    (event: ReactFocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
        return;
      }
      scheduleClose();
    },
    [scheduleClose],
  );

  const handleAccountLinkClick = useCallback(() => {
    closeAccountMenu();
    onCloseMenu();
  }, [closeAccountMenu, onCloseMenu]);

  const handleLogoutWithClose = useCallback(() => {
    closeAccountMenu();
    onLogout?.();
  }, [closeAccountMenu, onLogout]);

  const handleAccountKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeAccountMenu();
      }
    },
    [closeAccountMenu],
  );

  useEffect(
    () => () => {
      cancelScheduledClose();
    },
    [cancelScheduledClose],
  );

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

      <div
        className="relative"
        onPointerEnter={openAccountMenu}
        onPointerLeave={handlePointerLeaveAccount}
        onFocus={openAccountMenu}
        onBlur={handleAccountBlur}
        onKeyDown={handleAccountKeyDown}
      >
        {user ? (
          <div className="relative">
            <button
              type="button"
              className={ICON_BUTTON_CLASS}
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
              aria-label="Abrir menu de mi cuenta"
              onClick={toggleAccountMenu}
            >
              <UserIcon />
            </button>
            <div
              className={`absolute right-0 mt-2 w-52 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition duration-150 ${
                isAccountMenuOpen
                  ? 'pointer-events-auto translate-y-0 opacity-100'
                  : 'pointer-events-none -translate-y-1 opacity-0'
              }`}
              role="menu"
              aria-orientation="vertical"
            >
              <div className="py-1">
                <span className="block truncate px-4 py-2 text-sm italic text-gray-500">
                  {user.email}
                </span>
                <Link
                  href="/mi-cuenta"
                  className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                  role="menuitem"
                  onClick={handleAccountLinkClick}
                >
                  Mi Cuenta
                </Link>
                <Link
                  href="/mis-pedidos"
                  className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                  role="menuitem"
                  onClick={handleAccountLinkClick}
                >
                  Mis Pedidos
                </Link>
                <button
                  type="button"
                  onClick={handleLogoutWithClose}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 transition hover:bg-gray-100"
                  role="menuitem"
                >
                  Cerrar sesion
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

      <MiniCart onCloseMenu={onCloseMenu} />
    </div>
  );
}
