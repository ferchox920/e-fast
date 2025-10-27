'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import NotificationDropdown from './NotificationDropdown';
import {
  useNotificationConnectionStatus,
  useNotificationsList,
  useUnreadCounter,
} from '@/notifications/hooks';

const DROPDOWN_LIMIT = 100;

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownWrapperRef = useRef<HTMLDivElement>(null);

  const unreadCount = useUnreadCounter();
  const { isFetching } = useNotificationsList({ limit: DROPDOWN_LIMIT, offset: 0 });
  const connectionStatus = useNotificationConnectionStatus();

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleDocumentClick = useCallback(
    (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !isOpen ||
        buttonRef.current?.contains(target) ||
        dropdownWrapperRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    },
    [isOpen],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDropdown();
        buttonRef.current?.focus();
      }
    },
    [closeDropdown, isOpen],
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDocumentClick, handleKeyDown, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    dropdownWrapperRef.current?.querySelector<HTMLElement>('button, [tabindex]')?.focus();
  }, [isOpen]);

  const connectionIndicatorClass = useMemo(() => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-amber-400';
      default:
        return 'bg-neutral-300';
    }
  }, [connectionStatus]);

  const unreadLabel =
    unreadCount === 1 ? '1 notificacion sin leer' : `${unreadCount} notificaciones sin leer`;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="relative flex items-center justify-center rounded-full border border-transparent bg-white p-2 text-neutral-600 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Notificaciones, ${unreadLabel}`}
        onClick={toggleDropdown}
        aria-busy={isFetching}
      >
        <svg
          aria-hidden="true"
          className="h-6 w-6 text-current"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span
          aria-hidden="true"
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white ${connectionIndicatorClass}`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex min-h-[1.2rem] min-w-[1.2rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <div ref={dropdownWrapperRef} role="presentation" style={{ zIndex: 60 }}>
        <NotificationDropdown isOpen={isOpen} onClose={closeDropdown} limit={DROPDOWN_LIMIT} />
      </div>
    </div>
  );
}
