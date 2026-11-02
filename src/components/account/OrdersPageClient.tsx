'use client';

import Link from 'next/link';

import { useListOrdersQuery } from '@/store/api/ordersApi';
import { useAppSelector } from '@/store/hooks';

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(parsed);
};

export default function OrdersPageClient() {
  const token = useAppSelector((state) => state.user?.session?.accessToken ?? null);
  const authStatus = useAppSelector((state) => state.user?.status ?? 'idle');
  const currentUser = useAppSelector((state) => state.user?.current ?? null);

  const isAuthenticated = Boolean(token && authStatus === 'authenticated');
  const isAdminUser =
    currentUser?.is_superuser === true ||
    ((currentUser as { role?: string | null } | null)?.role ?? null) === 'admin';

  const ordersQuery = useListOrdersQuery(
    { limit: 20, offset: 0 },
    { skip: !isAuthenticated || isAdminUser },
  );

  if (!isAuthenticated) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">Mis pedidos</h1>
        <p className="text-sm text-neutral-600">
          Inicia sesion para consultar el historial de tus compras.
        </p>
        <div className="flex justify-center">
          <Link
            href="/login?redirect=/orders"
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Ir a login
          </Link>
        </div>
      </section>
    );
  }

  if (isAdminUser) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">Mis pedidos</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Las cuentas administradoras gestionan pedidos desde el panel de admin.
        </p>
        <div className="mt-4">
          <Link
            href="/admin/orders"
            className="inline-flex rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
          >
            Ver pedidos admin
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">Mis pedidos</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Historial de compras y acceso rapido al detalle de cada orden.
        </p>
      </header>

      {ordersQuery.isLoading || ordersQuery.isFetching ? (
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Cargando pedidos...</p>
        </article>
      ) : ordersQuery.isError ? (
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          No pudimos cargar tus pedidos.
        </article>
      ) : !ordersQuery.data || ordersQuery.data.length === 0 ? (
        <article className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          Todavia no tienes pedidos registrados.
        </article>
      ) : (
        <ul className="space-y-4">
          {ordersQuery.data.map((order) => (
            <li
              key={String(order.id)}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-400">Pedido</p>
                  <h2 className="mt-1 text-lg font-semibold text-neutral-900">
                    #{String(order.id)}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Creado el {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="grid gap-2 text-sm text-neutral-600 sm:text-right">
                  <p>Estado: {order.status}</p>
                  <p>Pago: {order.payment_status}</p>
                  <p className="font-semibold text-neutral-900">
                    {formatMoney(order.total_amount, order.currency)}
                  </p>
                </div>
                <div>
                  <Link
                    href={`/orders/${String(order.id)}`}
                    className="inline-flex rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
                  >
                    Ver detalle
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
