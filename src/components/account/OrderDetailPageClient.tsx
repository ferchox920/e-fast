'use client';

import Link from 'next/link';

import { useGetOrderByIdQuery } from '@/store/api/ordersApi';
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
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

export default function OrderDetailPageClient({ orderId }: { orderId: string }) {
  const token = useAppSelector((state) => state.user?.session?.accessToken ?? null);
  const authStatus = useAppSelector((state) => state.user?.status ?? 'idle');
  const currentUser = useAppSelector((state) => state.user?.current ?? null);

  const isAuthenticated = Boolean(token && authStatus === 'authenticated');
  const isAdminUser =
    currentUser?.is_superuser === true ||
    ((currentUser as { role?: string | null } | null)?.role ?? null) === 'admin';

  const orderQuery = useGetOrderByIdQuery({ orderId }, { skip: !isAuthenticated || isAdminUser });

  if (!isAuthenticated) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">Detalle del pedido</h1>
        <p className="text-sm text-neutral-600">
          Inicia sesion para consultar el estado de tu pedido.
        </p>
        <div className="flex justify-center">
          <Link
            href={`/login?redirect=/orders/${orderId}`}
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
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">Detalle del pedido</h1>
        <p className="text-sm text-neutral-600">
          Las cuentas administradoras gestionan pedidos desde el panel de admin.
        </p>
        <div>
          <Link
            href={`/admin/orders/${orderId}`}
            className="inline-flex rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
          >
            Ver pedido en admin
          </Link>
        </div>
      </section>
    );
  }

  if (orderQuery.isLoading || orderQuery.isFetching) {
    return (
      <section className="mx-auto max-w-4xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-500">Cargando pedido...</p>
      </section>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <section className="mx-auto max-w-4xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        <p className="font-medium">No pudimos cargar este pedido.</p>
        <Link href="/orders" className="mt-3 inline-flex text-xs font-semibold text-rose-700">
          Volver a mis pedidos
        </Link>
      </section>
    );
  }

  const order = orderQuery.data;

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Pedido</p>
        <h1 className="mt-2 text-3xl font-semibold text-neutral-900">#{String(order.id)}</h1>
        <div className="mt-4 grid gap-3 text-sm text-neutral-600 sm:grid-cols-2 lg:grid-cols-4">
          <p>Estado: {order.status}</p>
          <p>Pago: {order.payment_status}</p>
          <p>Envio: {order.shipping_status}</p>
          <p>Creado: {formatDate(order.created_at)}</p>
        </div>
      </header>

      <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Resumen</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Subtotal</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              {formatMoney(order.subtotal_amount, order.currency)}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Envio</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              {formatMoney(order.shipping_amount, order.currency)}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Impuestos</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              {formatMoney(order.tax_amount, order.currency)}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Total</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              {formatMoney(order.total_amount, order.currency)}
            </p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Lineas del pedido</h2>
        {order.lines.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">Este pedido no tiene lineas cargadas.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {order.lines.map((line) => (
              <li
                key={String(line.id)}
                className="flex flex-col gap-2 rounded-xl border border-neutral-100 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Variante {String(line.variant_id)}
                  </p>
                  <p className="text-xs text-neutral-500">Cantidad: {line.quantity}</p>
                </div>
                <div className="text-sm text-neutral-700">
                  Unitario: {formatMoney(line.unit_price, order.currency)}
                </div>
                <div className="text-sm font-semibold text-neutral-900">
                  {formatMoney(line.line_total, order.currency)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
