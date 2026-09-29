'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useGetOrderByIdQuery } from '@/store/api/ordersApi';
import { useCreatePaymentForOrderMutation } from '@/store/api/paymentsApi';
import { apiErrorMessage } from '@/lib/apiError';

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAppSelector((state) => state.user.session.accessToken);
  const {
    data: order,
    error,
    isLoading,
    refetch,
  } = useGetOrderByIdQuery({ orderId: id }, { skip: !token });
  const [createPreference, { isLoading: creatingPreference }] = useCreatePaymentForOrderMutation();
  const [paymentUrl, setPaymentUrl] = useState('');
  const [message, setMessage] = useState('');
  const idempotencyKey = useRef<{ orderId: string; value: string } | null>(null);
  const paymentEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true';

  const preparePayment = async () => {
    try {
      setMessage('');
      if (idempotencyKey.current?.orderId !== id) {
        idempotencyKey.current = { orderId: id, value: crypto.randomUUID() };
      }
      const payment = await createPreference({
        orderId: id,
        idempotencyKey: idempotencyKey.current.value,
      }).unwrap();
      const target = payment.init_point ?? payment.sandbox_init_point;
      if (!target) throw new Error('missing payment link');
      setPaymentUrl(target);
    } catch (failure) {
      setMessage(apiErrorMessage(failure));
    }
  };

  if (!token)
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p>Ingresa para consultar el pedido.</p>
        <Link href="/login" className="underline">
          Ingresar
        </Link>
      </main>
    );
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-8">
      <h1 className="text-2xl font-semibold">Pedido</h1>
      {isLoading && <p role="status">Cargando pedido…</p>}
      {error && (
        <div role="alert">
          <p>{apiErrorMessage(error)}</p>
          <button type="button" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      )}
      {order && (
        <>
          <p>Estado: {order.status}</p>
          <p>
            Total confirmado por el servidor:{' '}
            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: order.currency }).format(
              order.total_amount,
            )}
          </p>
          <ul>
            {order.lines.map((line) => (
              <li key={line.id}>
                {line.product_title_snapshot ?? 'Artículo'} · {line.quantity} ×{' '}
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: order.currency,
                }).format(line.unit_price)}
              </li>
            ))}
          </ul>
          {order.payment_status === 'pending' && paymentEnabled && (
            <button
              type="button"
              disabled={creatingPreference}
              onClick={preparePayment}
              className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {creatingPreference ? 'Preparando pago…' : 'Preparar pago'}
            </button>
          )}
          {order.payment_status === 'pending' && !paymentEnabled && (
            <p>El pago en línea todavía no está habilitado en este entorno.</p>
          )}
          {paymentUrl && (
            <a href={paymentUrl} className="underline">
              Continuar al proveedor de pago
            </a>
          )}
          {message && (
            <p role="alert" className="text-red-700">
              {message}
            </p>
          )}
        </>
      )}
    </main>
  );
}
