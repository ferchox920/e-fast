'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { KeyboardEvent } from 'react';
import type { NavBarCategoryGroup } from '../NavBar';

interface DesktopCategoriesProps {
  categoryGroups: NavBarCategoryGroup[];
}

export default function DesktopCategories({ categoryGroups }: DesktopCategoriesProps) {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      setActiveGroupId(null);
      closeTimer.current = null;
    }, 120);
  }, [clearCloseTimer]);

  useEffect(
    () => () => {
      clearCloseTimer();
    },
    [clearCloseTimer],
  );

  const openGroup = useCallback(
    (groupId: string | null) => {
      clearCloseTimer();
      setActiveGroupId(groupId);
    },
    [clearCloseTimer],
  );

  const handleToggleClick = useCallback(
    (groupId: string) => {
      setActiveGroupId((prev) => {
        const nextValue = prev === groupId ? null : groupId;
        if (nextValue === null) {
          clearCloseTimer();
        }
        return nextValue;
      });
    },
    [clearCloseTimer],
  );

  const handlePanelKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setActiveGroupId(null);
    }
  }, []);

  if (!categoryGroups.length) return null;

  return (
    <nav className="hidden items-center gap-4 md:flex">
      {categoryGroups.map((group) => {
        const isActive = activeGroupId === group.id;
        return (
          <div
            key={group.id}
            className="relative"
            onMouseEnter={() => openGroup(group.id)}
            onMouseLeave={scheduleClose}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                openGroup(null);
              }
            }}
          >
            <button
              type="button"
              className={`text-sm font-medium transition ${
                isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
              }`}
              onFocus={() => openGroup(group.id)}
              onClick={() => handleToggleClick(group.id)}
              aria-expanded={isActive}
              aria-controls={`category-panel-${group.id}`}
            >
              {group.name}
            </button>
            <div
              id={`category-panel-${group.id}`}
              onMouseEnter={() => openGroup(group.id)}
              onMouseLeave={scheduleClose}
              className={`absolute left-0 mt-3 min-w-[240px] rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition duration-200 focus:outline-none ${
                isActive
                  ? 'visible translate-y-0 opacity-100'
                  : 'invisible -translate-y-2 opacity-0'
              }`}
            >
              <div
                role="menu"
                aria-orientation="vertical"
                className="py-2"
                onKeyDown={handlePanelKeyDown}
              >
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/categorias/${item.slug}`}
                    className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 hover:text-indigo-600"
                    role="menuitem"
                    onClick={() => openGroup(null)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
