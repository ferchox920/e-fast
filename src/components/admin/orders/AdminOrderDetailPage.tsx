'use client';

import Link from 'next/link';
import { useGetOrderByIdQuery } from '@/store/api/ordersApi';

interface AdminOrderDetailPageProps {
  orderId: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatMoney = (value: number, currency?: string | null) => {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency ?? 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency ?? 'USD'}`;
  }
};

export default function AdminOrderDetailPage({ orderId }: AdminOrderDetailPageProps) {
  const { data: order, isLoading, isError, error } = useGetOrderByIdQuery({ orderId });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Pedido #{orderId}</h1>
          <p className="text-sm text-neutral-600">Detalle completo del pedido seleccionado.</p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex h-9 items-center rounded-lg border border-neutral-300 px-3 text-sm font-semibold text-neutral-700 hover:border-neutral-400"
        >
          Volver a pedidos
        </Link>
      </header>

      {isLoading ? (
        <section className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 shadow-sm">
          Cargando detalle del pedido...
        </section>
      ) : null}

      {isError ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          No se pudo cargar el pedido.{' '}
          {typeof error === 'object' && error && 'status' in error
            ? `Error ${String((error as { status?: unknown }).status)}.`
            : ''}
        </section>
      ) : null}

      {order ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-neutral-500">Estado pedido</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">{order.status}</p>
            </article>
            <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-neutral-500">Estado pago</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">{order.payment_status}</p>
            </article>
            <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-neutral-500">Estado envio</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">{order.shipping_status}</p>
            </article>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Montos</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <p className="text-sm text-neutral-700">
                Subtotal: <strong>{formatMoney(order.subtotal_amount, order.currency)}</strong>
              </p>
              <p className="text-sm text-neutral-700">
                Descuento: <strong>{formatMoney(order.discount_amount, order.currency)}</strong>
              </p>
              <p className="text-sm text-neutral-700">
                Envio: <strong>{formatMoney(order.shipping_amount, order.currency)}</strong>
              </p>
              <p className="text-sm text-neutral-700">
                Impuestos: <strong>{formatMoney(order.tax_amount, order.currency)}</strong>
              </p>
              <p className="text-sm text-neutral-900">
                Total: <strong>{formatMoney(order.total_amount, order.currency)}</strong>
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            <header className="border-b border-neutral-200 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Lineas del pedido
              </h2>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Linea</th>
                    <th className="px-4 py-3">Variante</th>
                    <th className="px-4 py-3">Cantidad</th>
                    <th className="px-4 py-3">Unitario</th>
                    <th className="px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-sm text-neutral-700">
                  {order.lines.map((line) => (
                    <tr key={String(line.id)}>
                      <td className="px-4 py-3">{String(line.id)}</td>
                      <td className="px-4 py-3">{String(line.variant_id)}</td>
                      <td className="px-4 py-3">{line.quantity}</td>
                      <td className="px-4 py-3">{formatMoney(line.unit_price, order.currency)}</td>
                      <td className="px-4 py-3 font-semibold">
                        {formatMoney(line.line_total, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Trazabilidad
            </h2>
            <div className="mt-3 grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
              <p>Creado: {formatDate(order.created_at)}</p>
              <p>Actualizado: {formatDate(order.updated_at ?? null)}</p>
              <p>Pagado: {formatDate(order.paid_at ?? null)}</p>
              <p>Completado: {formatDate(order.fulfilled_at ?? null)}</p>
              <p>Cancelado: {formatDate(order.cancelled_at ?? null)}</p>
              <p>Cliente: {order.user_id ? String(order.user_id) : 'Invitado'}</p>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
