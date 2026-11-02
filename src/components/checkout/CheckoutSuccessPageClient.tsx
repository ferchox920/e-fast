'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { useGetCheckoutStatusQuery } from '@/store/api/paymentsApi';
import type { CheckoutResult } from '@/types/payment';

const STATUS_LABELS: Record<CheckoutResult, string> = {
  success: 'Pago aprobado',
  failure: 'Pago rechazado',
  pending: 'Pago pendiente',
  refunded: 'Pago reintegrado',
  unknown: 'Estado de pago no disponible',
};

const STATUS_STYLES: Record<CheckoutResult, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  failure: 'border-red-200 bg-red-50 text-red-800',
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  refunded: 'border-sky-200 bg-sky-50 text-sky-800',
  unknown: 'border-neutral-200 bg-neutral-50 text-neutral-700',
};

const normalizeResult = (status: string): CheckoutResult => {
  const normalized = status.trim().toLowerCase();

  if (['approved', 'success', 'accredited'].includes(normalized)) {
    return 'success';
  }
  if (['rejected', 'failure', 'cancelled', 'canceled'].includes(normalized)) {
    return 'failure';
  }
  if (
    ['pending', 'authorized', 'in_process', 'inprocess', 'partially_refunded'].includes(normalized)
  ) {
    return 'pending';
  }
  if (['refunded'].includes(normalized)) {
    return 'refunded';
  }
  return 'unknown';
};

const getResultDescription = (result: CheckoutResult) => {
  switch (result) {
    case 'success':
      return 'Tu compra fue confirmada. En breve vas a ver la orden actualizada en tu cuenta.';
    case 'failure':
      return 'El pago no se pudo completar. Puedes volver al checkout e intentarlo otra vez.';
    case 'pending':
      return 'El pago esta siendo procesado por Mercado Pago. Te avisaremos cuando se acredite.';
    case 'refunded':
      return 'El pago fue reintegrado. Puedes revisar el detalle de la orden en tu cuenta.';
    default:
      return 'No recibimos informacion suficiente del pago. Revisa tu cuenta para confirmar el estado.';
  }
};

export default function CheckoutSuccessPageClient() {
  const searchParams = useSearchParams();
  const currentUser = useAppSelector((state) => state.user.current);
  const isAdminUser =
    currentUser?.is_superuser === true ||
    ((currentUser as { role?: string | null } | null)?.role ?? null) === 'admin';

  const statusParam =
    searchParams.get('status') ??
    searchParams.get('collection_status') ??
    searchParams.get('payment_status') ??
    '';

  const paymentId = searchParams.get('payment_id') ?? searchParams.get('collection_id');
  const orderId = searchParams.get('external_reference') ?? searchParams.get('merchant_order_id');

  const {
    data: checkoutStatus,
    isFetching,
    isError,
    refetch,
  } = useGetCheckoutStatusQuery({ orderId: orderId ?? '' }, { skip: !orderId });

  const result = useMemo<CheckoutResult>(
    () => checkoutStatus?.checkout_result ?? normalizeResult(statusParam),
    [checkoutStatus?.checkout_result, statusParam],
  );

  const effectivePaymentId =
    checkoutStatus?.latest_payment?.provider_payment_id ??
    checkoutStatus?.latest_payment?.id ??
    paymentId ??
    null;
  const effectiveOrderId = checkoutStatus?.order_id ?? orderId ?? null;
  const canRetryPayment = checkoutStatus?.can_retry_payment === true;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-2 border-b border-neutral-200 pb-5">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          Resultado del pago
        </h1>
        <p className="text-sm text-neutral-600">
          {orderId
            ? 'Consultamos el estado actualizado de tu orden.'
            : 'Mercado Pago nos devolvio el estado de tu checkout.'}
        </p>
      </header>

      <article className={`rounded-2xl border p-5 ${STATUS_STYLES[result]}`}>
        <h2 className="text-lg font-semibold">{STATUS_LABELS[result]}</h2>
        <p className="mt-2 text-sm">
          {isFetching ? 'Actualizando estado del pago...' : getResultDescription(result)}
        </p>

        {isError ? (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-white/70 p-3 text-xs">
            <p>No pudimos consultar el estado actualizado de la orden.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-full border border-neutral-300 px-3 py-1 font-semibold text-neutral-700 transition hover:border-neutral-400"
            >
              Reintentar consulta
            </button>
          </div>
        ) : null}

        <dl className="mt-4 space-y-1 text-xs">
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium">Estado reportado</dt>
            <dd>{checkoutStatus?.payment_status ?? (statusParam || 'no informado')}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium">Pago</dt>
            <dd>{effectivePaymentId ?? 'no informado'}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium">Orden</dt>
            <dd>{effectiveOrderId ?? 'no informado'}</dd>
          </div>
          {checkoutStatus ? (
            <div className="flex items-center justify-between gap-4">
              <dt className="font-medium">Total</dt>
              <dd>
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: checkoutStatus.currency,
                }).format(checkoutStatus.total_amount)}
              </dd>
            </div>
          ) : null}
        </dl>
      </article>

      <footer className="flex flex-wrap gap-3">
        {canRetryPayment ? (
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Volver al checkout
          </Link>
        ) : null}
        <Link
          href={isAdminUser ? '/admin/orders' : '/orders'}
          className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
        >
          {isAdminUser ? 'Ver pedidos admin' : 'Ver mis pedidos'}
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
        >
          Seguir comprando
        </Link>
      </footer>
    </section>
  );
}
