'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import CustomerEngagementSummary from '@/components/engagement/CustomerEngagementSummary';
import { useGetLoyaltyProfileQuery } from '@/store/api/loyaltyApi';
import { useListOrdersQuery } from '@/store/api/ordersApi';
import { useMeQuery } from '@/store/api/usersApi';
import { useListWishesQuery } from '@/store/api/wishesApi';
import { useAppSelector } from '@/store/hooks';
import {
  selectLoyaltyProfile,
  selectLoyaltyStatuses,
  selectLoyaltyError,
} from '@/store/slices/loyaltySlice';
import { selectUnreadCount } from '@/store/slices/notificationsSlice';
import { selectOrders, selectOrdersStatuses, selectOrdersError } from '@/store/slices/ordersSlice';
import { selectWishIds } from '@/store/slices/wishesSlice';
import { selectCartItemsCount } from '@/store/slices/cartSlice';
import { useNotificationsList } from '@/notifications/hooks';
import type { OrderRead } from '@/types/order';

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const formatMoney = (value: number, currency?: string) => {
  if (currency && currency !== 'ARS') {
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  }
  return CURRENCY_FORMATTER.format(value);
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return DATE_FORMATTER.format(parsed);
};

const getOrderStatusLabel = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'pending_payment':
      return 'Pendiente de pago';
    case 'paid':
      return 'Pagado';
    case 'fulfilled':
      return 'Completado';
    case 'cancelled':
      return 'Cancelado';
    case 'refunded':
      return 'Reembolsado';
    default:
      return status;
  }
};

export default function MyAccountPageClient() {
  const token = useAppSelector((state) => state.user?.session?.accessToken ?? null);
  const sessionScopes = useAppSelector((state) => state.user?.session?.scopes ?? []);
  const authStatus = useAppSelector((state) => state.user?.status ?? 'idle');
  const currentUser = useAppSelector((state) => state.user?.current ?? null);
  const wishIds = useAppSelector(selectWishIds);
  const cartItemsCount = useAppSelector(selectCartItemsCount);
  const unreadCount = useAppSelector(selectUnreadCount);

  const ordersFromStore = useAppSelector(selectOrders);
  const ordersStatuses = useAppSelector(selectOrdersStatuses);
  const ordersError = useAppSelector(selectOrdersError);

  const loyaltyFromStore = useAppSelector(selectLoyaltyProfile);
  const loyaltyStatuses = useAppSelector(selectLoyaltyStatuses);
  const loyaltyError = useAppSelector(selectLoyaltyError);

  const isAuthenticated = Boolean(token && authStatus === 'authenticated');
  const meQuery = useMeQuery(undefined, { skip: !isAuthenticated });
  const me = meQuery.data ?? currentUser;

  const hasAdminScope = sessionScopes.includes('admin');
  const isAdminUser =
    me?.is_superuser === true || ((me as { role?: string | null } | null)?.role ?? null) === 'admin';

  const canReadOrders = !isAdminUser && sessionScopes.includes('orders:read');
  const canReadWishes = !isAdminUser && (hasAdminScope || sessionScopes.includes('users:read'));

  const ordersQuery = useListOrdersQuery(
    { limit: 5, offset: 0 },
    { skip: !isAuthenticated || !canReadOrders },
  );
  const wishesQuery = useListWishesQuery(undefined, { skip: !isAuthenticated || !canReadWishes });
  const loyaltyQuery = useGetLoyaltyProfileQuery(undefined, { skip: !isAuthenticated || isAdminUser });
  const notifications = useNotificationsList({ limit: 5, offset: 0 });

  const orders = useMemo(() => {
    if (ordersQuery.data && ordersQuery.data.length > 0) return ordersQuery.data;
    return ordersFromStore;
  }, [ordersFromStore, ordersQuery.data]);

  const loyaltyProfile = loyaltyQuery.data ?? loyaltyFromStore;
  const ordersSummary = useMemo(
    () =>
      orders.reduce(
        (acc, order) => {
          acc.total += 1;
          if (order.status === 'pending_payment') acc.pendingPayment += 1;
          if (order.status === 'fulfilled') acc.fulfilled += 1;
          return acc;
        },
        { total: 0, pendingPayment: 0, fulfilled: 0 },
      ),
    [orders],
  );

  const latestOrders = useMemo(() => orders.slice(0, 5), [orders]);

  if (!isAuthenticated) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">Mi cuenta</h1>
        <p className="text-sm text-neutral-600">
          Inicia sesion para ver tu perfil, pedidos, favoritos y notificaciones.
        </p>
        <div className="flex justify-center">
          <Link
            href="/login?redirect=/mi-cuenta"
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Ir a login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2 border-b border-neutral-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Mi cuenta</h1>
        <p className="text-sm text-neutral-600">{me ? `Hola ${me.full_name ?? me.email}.` : 'Cargando perfil...'}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!isAdminUser ? (
          <>
            <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Notificaciones</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">{unreadCount}</p>
              <p className="text-xs text-neutral-500">sin leer</p>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Favoritos</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">{wishIds.length}</p>
              <p className="text-xs text-neutral-500">productos guardados</p>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Pedidos</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">{ordersSummary.total}</p>
              <p className="text-xs text-neutral-500">{ordersSummary.pendingPayment} pendientes de pago</p>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Carrito</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">{cartItemsCount}</p>
              <p className="text-xs text-neutral-500">items en carrito</p>
            </article>
          </>
        ) : (
          <>
            <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Modo admin</p>
              <p className="mt-2 text-base font-semibold text-neutral-900">Cuenta administrativa</p>
              <Link
                href="/admin/dashboard"
                className="mt-2 inline-flex text-xs font-semibold text-indigo-600 transition hover:text-indigo-500"
              >
                Ir al dashboard
              </Link>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Pedidos</p>
              <p className="mt-2 text-base font-semibold text-neutral-900">Gestion operativa</p>
              <Link
                href="/admin/orders"
                className="mt-2 inline-flex text-xs font-semibold text-indigo-600 transition hover:text-indigo-500"
              >
                Ir a gestion de pedidos
              </Link>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Catalogo</p>
              <p className="mt-2 text-base font-semibold text-neutral-900">Productos y stock</p>
              <Link
                href="/admin/products"
                className="mt-2 inline-flex text-xs font-semibold text-indigo-600 transition hover:text-indigo-500"
              >
                Administrar productos
              </Link>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Moderacion</p>
              <p className="mt-2 text-base font-semibold text-neutral-900">Preguntas de clientes</p>
              <Link
                href="/admin/questions"
                className="mt-2 inline-flex text-xs font-semibold text-indigo-600 transition hover:text-indigo-500"
              >
                Ver preguntas
              </Link>
            </article>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {!isAdminUser ? (
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Ultimos pedidos</h2>
              <p className="text-xs text-neutral-500">
                estado list: {ordersStatuses.list} | mutation: {ordersStatuses.mutation}
              </p>
            </div>
            {ordersQuery.isLoading && latestOrders.length === 0 ? (
              <p className="text-sm text-neutral-500">Cargando pedidos...</p>
            ) : !canReadOrders ? (
              <p className="text-sm text-neutral-500">
                Tu sesion actual no tiene permiso para listar pedidos (`orders:read`).
              </p>
            ) : latestOrders.length === 0 ? (
              <p className="text-sm text-neutral-500">Todavia no tienes pedidos.</p>
            ) : (
              <ul className="space-y-3">
                {latestOrders.map((order: OrderRead) => (
                  <li
                    key={String(order.id)}
                    className="flex flex-col gap-2 rounded-xl border border-neutral-100 bg-neutral-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <Link
                        href={`/orders/${String(order.id)}`}
                        className="text-sm font-medium text-neutral-900 transition hover:text-indigo-600"
                      >
                        #{String(order.id)}
                      </Link>
                      <p className="text-xs text-neutral-500">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-sm text-neutral-700">{getOrderStatusLabel(order.status)}</div>
                    <div className="text-sm font-semibold text-neutral-900">
                      {formatMoney(order.total_amount, order.currency)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {canReadOrders && (ordersQuery.isError || ordersStatuses.list === 'failed') && (
              <p className="mt-4 text-xs text-red-600">
                No pudimos cargar pedidos. {ordersError ?? 'Intenta nuevamente.'}
              </p>
            )}
            <div className="mt-4">
              <Link
                href="/orders"
                className="inline-flex text-xs font-semibold text-indigo-600 transition hover:text-indigo-500"
              >
                Ver todos mis pedidos
              </Link>
            </div>
          </article>
        ) : (
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Panel administrativo</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Los pedidos de venta se gestionan exclusivamente desde el dashboard de administrador.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/admin/dashboard"
                className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                Ir al dashboard
              </Link>
              <Link
                href="/admin/orders"
                className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
              >
                Ver pedidos admin
              </Link>
            </div>
          </article>
        )}

        {!isAdminUser ? (
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Lealtad</h2>
            <p className="mt-1 text-xs text-neutral-500">
              perfil: {loyaltyStatuses.profile} | niveles: {loyaltyStatuses.levels}
            </p>
            {loyaltyQuery.isLoading && !loyaltyProfile ? (
              <p className="mt-4 text-sm text-neutral-500">Cargando programa de puntos...</p>
            ) : loyaltyProfile ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-neutral-600">
                  Nivel <span className="font-semibold text-neutral-900">{loyaltyProfile.level}</span>
                </p>
                <p className="text-2xl font-semibold text-neutral-900">{loyaltyProfile.points}</p>
                <p className="text-xs text-neutral-500">puntos acumulados</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">No hay perfil de lealtad disponible.</p>
            )}
            {(loyaltyQuery.isError || loyaltyStatuses.profile === 'failed') && (
              <p className="mt-4 text-xs text-red-600">
                No pudimos cargar lealtad. {loyaltyError ?? 'Intenta nuevamente.'}
              </p>
            )}
          </article>
        ) : (
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Accesos rapidos</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/admin/analytics"
                className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
              >
                Analiticas
              </Link>
              <Link
                href="/admin/customers"
                className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
              >
                Clientes
              </Link>
              <Link
                href="/admin/promotions"
                className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
              >
                Promociones
              </Link>
            </div>
          </article>
        )}
      </div>

      <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Ultimas notificaciones</h2>
          <Link href="/notifications" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
            Ver todas
          </Link>
        </div>
        {notifications.isLoading && notifications.items.length === 0 ? (
          <p className="text-sm text-neutral-500">Cargando notificaciones...</p>
        ) : notifications.items.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay notificaciones recientes.</p>
        ) : (
          <ul className="space-y-3">
            {notifications.items.slice(0, 5).map((item) => (
              <li key={item.id} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{item.message}</p>
                <p className="mt-1 text-[11px] text-neutral-400">{formatDate(item.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      {!isAdminUser && me?.id ? <CustomerEngagementSummary userId={String(me.id)} /> : null}

      <footer className="flex flex-wrap gap-3">
        <Link
          href="/notifications"
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
        >
          Gestionar notificaciones
        </Link>
        {!isAdminUser ? (
          <Link
            href="/products"
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
          >
            Seguir comprando
          </Link>
        ) : null}
      </footer>

      {(meQuery.isFetching || wishesQuery.isFetching || ordersQuery.isFetching || loyaltyQuery.isFetching) && (
        <p className="text-xs text-neutral-400">Sincronizando datos de tu cuenta...</p>
      )}
    </section>
  );
}
