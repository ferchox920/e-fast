'use client';

import Link from 'next/link';
import { useState } from 'react';
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
  cartItemCount?: number;
  popularSearches?: string[];
  user: UserRead | null;
  onLogout?: () => void;
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
  cartItemCount = 0,
  popularSearches = DEFAULT_POPULAR_SEARCHES,
  user,
  onLogout,
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

  const handleLogout = () => {
    onLogout?.();
    closeMenu();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          <div className="flex flex-1 items-center gap-2">
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-white text-gray-500 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
              className="text-lg font-semibold text-indigo-600 transition hover:text-indigo-700 md:text-xl"
              onClick={closeMenu}
            >
              {brandLabel}
            </Link>
          </div>

          <NavActions
            user={user}
            cartItemCount={cartItemCount}
            onSearchClick={openSearch}
            onLogout={handleLogout}
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
