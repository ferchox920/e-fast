'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';

import type { NotificationType } from '@/types/notifications';
import {
  useNotificationsList,
  useMarkNotificationRead,
  useNotificationConnectionStatus,
} from '@/notifications/hooks';
import { formatRelativeTime } from '@/notifications/utils';

const PAGE_SIZE = 25;

type TypeFilter = 'all' | NotificationType;

const typeOptions: Array<{ value: TypeFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'product_question', label: 'Preguntas de producto' },
  { value: 'product_answer', label: 'Respuestas de producto' },
  { value: 'order_status', label: 'Estado de pedido' },
  { value: 'new_order', label: 'Nuevo pedido' },
  { value: 'promotion', label: 'Promociones' },
  { value: 'loyalty', label: 'Lealtad' },
  { value: 'generic', label: 'Genericas' },
];

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const limit = page * PAGE_SIZE;
  const { items, total, isLoading, isFetching, isError, error, refetch } = useNotificationsList({
    limit,
    offset: 0,
  });
  const markNotificationRead = useMarkNotificationRead();
  const connectionStatus = useNotificationConnectionStatus();

  const filteredItems = useMemo(() => {
    if (typeFilter === 'all') return items;
    return items.filter((notification) => notification.type === typeFilter);
  }, [items, typeFilter]);

  const hasMore = items.length < total;

  const handleToggleRead = async (id: string, nextState: boolean) => {
    try {
      await markNotificationRead(id, nextState);
    } catch (updateError) {
      console.error('NotificationsPage: error updating notification state', updateError);
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(event.target.value as TypeFilter);
    setPage(1);
  };

  let errorDetails: string | null = null;
  if (isError && error && typeof error === 'object') {
    if ('status' in error) {
      const statusPart = typeof error.status === 'number' ? `${error.status} ` : '';
      const data =
        'data' in error && error.data != null
          ? typeof error.data === 'string'
            ? error.data
            : JSON.stringify(error.data)
          : 'Error desconocido';
      errorDetails = `${statusPart}${data}`;
    } else if ('message' in error && error.message) {
      errorDetails = error.message;
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-neutral-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Historial de notificaciones</h1>
          <p className="text-sm text-neutral-500">
            Estado de conexion: <span className="font-medium">{connectionStatus}</span>
          </p>
          <p className="text-xs text-neutral-400">
            Mostrando {filteredItems.length} de {total} notificaciones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="notification-type-filter"
            className="text-sm font-medium text-neutral-700"
          >
            Filtrar por tipo
          </label>
          <select
            id="notification-type-filter"
            value={typeFilter}
            onChange={handleFilterChange}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {isLoading ? (
        <div className="py-10 text-center text-sm text-neutral-500" role="status">
          Cargando historial...
        </div>
      ) : isError ? (
        <div
          className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          <div>Ocurrio un error al cargar las notificaciones.</div>
          {errorDetails && <pre className="whitespace-pre-wrap text-xs">{errorDetails}</pre>}
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex w-fit items-center rounded-md bg-indigo-500 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Reintentar
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-10 text-center text-sm text-neutral-500" role="status">
          No se encontraron notificaciones para este filtro.
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredItems.map((notification) => (
            <li
              key={notification.id}
              className={`rounded-lg border p-4 transition ${
                notification.is_read
                  ? 'border-neutral-200 bg-white'
                  : 'border-indigo-200 bg-indigo-50'
              }`}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-400">
                    {notification.type}
                  </p>
                  <h2 className="text-lg font-semibold text-neutral-900">{notification.title}</h2>
                  <p className="mt-1 text-sm text-neutral-600 whitespace-pre-line">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-neutral-400">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                  {notification.meta?.href && (
                    <a
                      href={notification.meta.href}
                      className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      onClick={() => {
                        if (!notification.is_read) {
                          markNotificationRead(notification.id, true).catch(() => undefined);
                        }
                      }}
                    >
                      Ver detalle
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">
                    {notification.is_read ? 'Leida' : 'No leida'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleRead(notification.id, !notification.is_read)}
                    className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    disabled={isFetching}
                  >
                    {notification.is_read ? 'Marcar como no leida' : 'Marcar como leida'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore && !isError && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-neutral-400"
            disabled={isFetching}
          >
            {isFetching ? 'Cargando...' : 'Ver mas'}
          </button>
        </div>
      )}
    </section>
  );
}
