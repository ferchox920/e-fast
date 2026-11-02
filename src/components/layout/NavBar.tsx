'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import type { UserRead } from '@/types/user';
import DesktopCategories from './nav/DesktopCategories';
import MobileMenu from './nav/MobileMenu';
import NavActions from './nav/NavActions';
import SearchOverlay from './nav/SearchOverlay';
import { MenuIcon } from './nav/icons';

export interface NavBarCategory {
  id: string;
  name: string;
  slug: string;
}

export interface NavBarCategoryGroup {
  id: string;
  name: string;
  items: NavBarCategory[];
}

export interface NavBarProps {
  brandHref?: string;
  brandLabel?: string;
  categoryGroups?: NavBarCategoryGroup[];
  popularSearches?: string[];
  user: UserRead | null;
  onLogout?: () => Promise<void> | void;
  isLogoutPending?: boolean;
}

const DEFAULT_POPULAR_SEARCHES = [
  'Sneakers blancas',
  'Blazer negro',
  'Bolso tote',
  'Pantalones cargo',
  'Vestido midi',
];

export default function NavBar({
  brandHref = '/',
  brandLabel = 'MyApp',
  categoryGroups = [],
  popularSearches = DEFAULT_POPULAR_SEARCHES,
  user,
  onLogout,
  isLogoutPending = false,
}: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  const openSearch = () => {
    closeMenu();
    setIsSearchOpen(true);
  };

  const closeSearch = () => setIsSearchOpen(false);

  const handleLogout = useCallback(async () => {
    setIsMenuOpen(false);
    if (onLogout) {
      await onLogout();
    }
  }, [onLogout]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200/80 bg-stone-50/90 shadow-[0_8px_24px_-18px_rgba(28,25,23,0.45)] backdrop-blur relative">
      {isLogoutPending ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden">
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-stone-300 via-amber-500 to-stone-900" />
        </div>
      ) : null}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center py-2">
          <div className="flex flex-1 items-center gap-2">
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300/80 bg-stone-50 text-stone-700 transition hover:bg-white hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
                aria-label={isMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
              >
                <MenuIcon isOpen={isMenuOpen} />
              </button>
            </div>
            <DesktopCategories categoryGroups={categoryGroups} />
          </div>

          <div className="flex flex-1 justify-center">
            <Link
              href={brandHref}
              className="rounded-md px-2 py-1 text-center text-sm font-semibold uppercase tracking-[0.34em] text-stone-900 transition hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 md:text-base"
              onClick={closeMenu}
            >
              {brandLabel}
            </Link>
          </div>

          <NavActions
            user={user}
            onSearchClick={openSearch}
            onLogout={handleLogout}
            isLogoutPending={isLogoutPending}
            onCloseMenu={closeMenu}
          />
        </div>
      </div>

      <MobileMenu
        isOpen={isMenuOpen}
        categoryGroups={categoryGroups}
        user={user}
        onCloseMenu={closeMenu}
        onLogout={handleLogout}
        isLogoutPending={isLogoutPending}
      />

      <SearchOverlay
        isOpen={isSearchOpen}
        brandHref={brandHref}
        brandLabel={brandLabel}
        onClose={closeSearch}
        popularSearches={popularSearches}
      />
    </header>
  );
}
