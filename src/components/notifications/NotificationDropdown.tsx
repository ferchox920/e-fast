'use client';

import { memo, useCallback, useMemo } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';

import {
  useNotificationsList,
  useMarkNotificationRead,
  useUnreadCounter,
} from '@/notifications/hooks';
import type { NotificationEntity } from '@/notifications/normalize';
import { formatRelativeTime } from '@/notifications/utils';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  limit?: number;
}

const ITEM_HEIGHT = 92;
const VIRTUALIZATION_THRESHOLD = 50;

interface NotificationListItemProps {
  notification: NotificationEntity;
  onItemClick: (notification: NotificationEntity) => void;
  onToggleRead: (notification: NotificationEntity, nextState: boolean) => void;
}

const NotificationListItem = memo(
  ({ notification, onItemClick, onToggleRead }: NotificationListItemProps) => {
    const { id, title, message, created_at: createdAt, is_read: isRead, meta } = notification;
    const handleItemClick = useCallback(
      () => onItemClick(notification),
      [notification, onItemClick],
    );
    const handleToggle = useCallback(
      (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onToggleRead(notification, !isRead);
      },
      [notification, onToggleRead, isRead],
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onItemClick(notification);
        }
      },
      [notification, onItemClick],
    );

    return (
      <div
        key={id}
        role="menuitem"
        tabIndex={0}
        onClick={handleItemClick}
        onKeyDown={handleKeyDown}
        className={`flex cursor-pointer items-start gap-3 rounded-md px-3 py-3 transition ${
          isRead ? 'bg-white hover:bg-neutral-50' : 'bg-indigo-50 hover:bg-indigo-100'
        }`}
        data-state={isRead ? 'read' : 'unread'}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
            {!isRead && <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />}
          </div>
          {meta?.badge && (
            <span className="mt-1 inline-flex items-center rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700">
              {meta.badge}
            </span>
          )}
          <p className="mt-1 text-sm text-neutral-600 break-words">{message}</p>
          <p className="mt-2 text-xs text-neutral-400">{formatRelativeTime(createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={isRead ? 'Marcar como no leido' : 'Marcar como leido'}
        >
          {isRead ? 'No leido' : 'Leido'}
        </button>
      </div>
    );
  },
);

NotificationListItem.displayName = 'NotificationListItem';

interface VirtualizedListData {
  items: NotificationEntity[];
  onItemClick: (notification: NotificationEntity) => void;
  onToggleRead: (notification: NotificationEntity, nextState: boolean) => void;
}

const VirtualizedRow = memo(
  ({ index, style, data }: ListChildComponentProps<VirtualizedListData>) => {
    const notification = data.items[index];
    if (!notification) return null;

    return (
      <div style={style} className="px-2">
        <NotificationListItem
          notification={notification}
          onItemClick={data.onItemClick}
          onToggleRead={data.onToggleRead}
        />
      </div>
    );
  },
);

VirtualizedRow.displayName = 'VirtualizedRow';

export default function NotificationDropdown({
  isOpen,
  onClose,
  limit = 100,
}: NotificationDropdownProps) {
  const router = useRouter();
  const { items, isLoading, isError, error, refetch } = useNotificationsList({
    limit,
    offset: 0,
  });
  const unreadCount = useUnreadCounter();
  const markNotificationRead = useMarkNotificationRead();

  const handleItemClick = useCallback(
    (notification: NotificationEntity) => {
      if (!notification.is_read) {
        markNotificationRead(notification.id, true).catch(() => undefined);
      }
      if (notification.meta?.href) {
        router.push(notification.meta.href);
      }
      onClose();
    },
    [markNotificationRead, onClose, router],
  );

  const handleToggleRead = useCallback(
    (notification: NotificationEntity, nextState: boolean) => {
      markNotificationRead(notification.id, nextState).catch(() => undefined);
    },
    [markNotificationRead],
  );

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="py-6 text-center text-sm text-neutral-500" role="status">
          Cargando notificaciones...
        </div>
      );
    }

    if (isError) {
      let errorDetails: string | null = null;
      if (error && typeof error === 'object') {
        if ('status' in error) {
          const statusPart = typeof error.status === 'number' ? `(${error.status}) ` : '';
          const dataPart =
            'data' in error && error.data != null
              ? typeof error.data === 'string'
                ? error.data
                : JSON.stringify(error.data)
              : 'Error desconocido';
          errorDetails = `${statusPart}${dataPart}`;
        } else if ('message' in error && error.message) {
          errorDetails = error.message;
        }
      }

      return (
        <div className="space-y-2 py-6 text-center text-sm text-red-600" role="alert">
          <p>Error al cargar notificaciones.</p>
          {errorDetails && <p className="text-xs text-red-500">{errorDetails}</p>}
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md bg-indigo-500 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Reintentar
          </button>
        </div>
      );
    }

    if (!items.length) {
      return (
        <div className="py-6 text-center text-sm text-neutral-500" role="status">
          No tienes notificaciones.
        </div>
      );
    }

    if (items.length > VIRTUALIZATION_THRESHOLD) {
      const height = Math.min(items.length, 6) * ITEM_HEIGHT;
      return (
        <FixedSizeList
          height={height}
          itemCount={items.length}
          itemSize={ITEM_HEIGHT}
          width="100%"
          itemKey={(index: number) => items[index]?.id ?? index}
          itemData={{
            items,
            onItemClick: handleItemClick,
            onToggleRead: handleToggleRead,
          }}
        >
          {VirtualizedRow}
        </FixedSizeList>
      );
    }

    return (
      <ul className="max-h-96 space-y-2 overflow-y-auto px-2" role="none">
        {items.map((notification) => (
          <li key={notification.id} role="none">
            <NotificationListItem
              notification={notification}
              onItemClick={handleItemClick}
              onToggleRead={handleToggleRead}
            />
          </li>
        ))}
      </ul>
    );
  }, [error, handleItemClick, handleToggleRead, isError, isLoading, items, refetch]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-1.5rem)] rounded-lg border border-neutral-200 bg-white shadow-xl focus:outline-none"
      role="menu"
      aria-orientation="vertical"
    >
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Notificaciones</p>
          <p className="text-xs text-neutral-500">{unreadCount} sin leer</p>
        </div>
        <Link
          href="/notifications"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={onClose}
        >
          Ver historial
        </Link>
      </div>
      <div>{content}</div>
    </div>
  );
}
