'use client';

import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { useListOrdersQuery } from '@/store/api/ordersApi';
import { apiErrorMessage } from '@/lib/apiError';

export default function MyOrdersPage() {
  const token = useAppSelector((state) => state.user.session.accessToken);
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useListOrdersQuery(undefined, { skip: !token });
  if (!token)
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p>Ingresa para consultar tus pedidos.</p>
        <Link href="/login" className="underline">
          Ingresar
        </Link>
      </main>
    );
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-8">
      <h1 className="text-2xl font-semibold">Mis pedidos</h1>
      {isLoading && <p role="status">Cargando pedidos…</p>}
      {error && (
        <div role="alert">
          <p>{apiErrorMessage(error)}</p>
          <button type="button" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      )}
      {!isLoading && !error && orders.length === 0 && <p>Todavía no tienes pedidos.</p>}
      <ul className="divide-y">
        {orders.map((order) => (
          <li key={order.id} className="py-4">
            <Link href={`/orders/${order.id}`} className="underline">
              Pedido {order.id}
            </Link>
            <p>
              {order.status} ·{' '}
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: order.currency,
              }).format(order.total_amount)}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
