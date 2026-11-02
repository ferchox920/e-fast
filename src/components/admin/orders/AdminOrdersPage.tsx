'use client';

import { useMemo, useState } from 'react';
import {
  useCancelOrderMutation,
  useFulfillOrderMutation,
  useListOrdersQuery,
  usePayOrderMutation,
} from '@/store/api/ordersApi';
import type { OrderStatus, PaymentStatus, ShippingStatus } from '@/types/order';

const PAGE_SIZE = 20;

type StatusMessage = {
  type: 'success' | 'error';
  message: string;
} | null;

const ORDER_STATUS_OPTIONS: Array<{ value: '' | OrderStatus; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Borrador' },
  { value: 'pending_payment', label: 'Pendiente pago' },
  { value: 'paid', label: 'Pagado' },
  { value: 'fulfilled', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'refunded', label: 'Reembolsado' },
];

const PAYMENT_STATUS_OPTIONS: Array<{ value: '' | PaymentStatus; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'authorized', label: 'Autorizado' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'partially_refunded', label: 'Reintegro parcial' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'refunded', label: 'Reembolsado' },
];

const SHIPPING_STATUS_OPTIONS: Array<{ value: '' | ShippingStatus; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'returned', label: 'Devuelto' },
];

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

const toErrorMessage = (error: unknown) => {
  if (!error) return 'Ocurrio un error inesperado.';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
      if ('detail' in data && typeof (data as { detail?: unknown }).detail === 'string') {
        return (data as { detail: string }).detail;
      }
      if ('message' in data && typeof (data as { message?: unknown }).message === 'string') {
        return (data as { message: string }).message;
      }
    }
    if ('status' in (error as Record<string, unknown>)) {
      const status = (error as { status?: number | string }).status;
      if (status) return `Error ${String(status)} al procesar la solicitud.`;
    }
  }
  return 'No se pudo completar la accion.';
};

const getOrderStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'pending_payment':
      return 'Pendiente pago';
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

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [orderStatus, setOrderStatus] = useState<'' | OrderStatus>('');
  const [paymentStatus, setPaymentStatus] = useState<'' | PaymentStatus>('');
  const [shippingStatus, setShippingStatus] = useState<'' | ShippingStatus>('');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(null);

  const queryArgs = useMemo(
    () => ({
      status: orderStatus || undefined,
      payment_status: paymentStatus || undefined,
      shipping_status: shippingStatus || undefined,
      page,
      page_size: PAGE_SIZE,
    }),
    [orderStatus, paymentStatus, shippingStatus, page],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useListOrdersQuery(queryArgs);

  const [payOrder, payOrderState] = usePayOrderMutation();
  const [cancelOrder, cancelOrderState] = useCancelOrderMutation();
  const [fulfillOrder, fulfillOrderState] = useFulfillOrderMutation();

  const isMutating =
    payOrderState.isLoading || cancelOrderState.isLoading || fulfillOrderState.isLoading;
  const hasMore = (data?.length ?? 0) === PAGE_SIZE;
  const canGoPrev = page > 1;
  const canGoNext = hasMore;

  const handlePay = async (orderId: string) => {
    setStatusMessage(null);
    setPendingOrderId(orderId);
    try {
      await payOrder({ orderId }).unwrap();
      setStatusMessage({ type: 'success', message: 'Pedido marcado como pagado.' });
    } catch (actionError) {
      setStatusMessage({ type: 'error', message: toErrorMessage(actionError) });
    } finally {
      setPendingOrderId(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    setStatusMessage(null);
    setPendingOrderId(orderId);
    try {
      await cancelOrder({ orderId }).unwrap();
      setStatusMessage({ type: 'success', message: 'Pedido cancelado correctamente.' });
    } catch (actionError) {
      setStatusMessage({ type: 'error', message: toErrorMessage(actionError) });
    } finally {
      setPendingOrderId(null);
    }
  };

  const handleFulfill = async (orderId: string) => {
    setStatusMessage(null);
    setPendingOrderId(orderId);
    try {
      await fulfillOrder({ orderId }).unwrap();
      setStatusMessage({ type: 'success', message: 'Pedido marcado como completado.' });
    } catch (actionError) {
      setStatusMessage({ type: 'error', message: toErrorMessage(actionError) });
    } finally {
      setPendingOrderId(null);
    }
  };

  const resetFilters = () => {
    setOrderStatus('');
    setPaymentStatus('');
    setShippingStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Pedidos</h1>
        <p className="text-sm text-neutral-600">
          Administra pedidos de venta y ejecuta acciones de operacion.
        </p>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-xs font-medium text-neutral-500">
            Estado pedido
            <select
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
              value={orderStatus}
              onChange={(event) => {
                setOrderStatus(event.target.value as '' | OrderStatus);
                setPage(1);
              }}
            >
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all-orders'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-neutral-500">
            Estado pago
            <select
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
              value={paymentStatus}
              onChange={(event) => {
                setPaymentStatus(event.target.value as '' | PaymentStatus);
                setPage(1);
              }}
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all-payments'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-neutral-500">
            Estado envio
            <select
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
              value={shippingStatus}
              onChange={(event) => {
                setShippingStatus(event.target.value as '' | ShippingStatus);
                setPage(1);
              }}
            >
              {SHIPPING_STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all-shipping'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="h-10 rounded-lg border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 hover:border-neutral-400"
              disabled={isFetching}
            >
              Refrescar
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="h-10 rounded-lg border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 hover:border-neutral-400"
              disabled={!orderStatus && !paymentStatus && !shippingStatus}
            >
              Limpiar
            </button>
          </div>
        </div>
      </section>

      {statusMessage ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            statusMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {statusMessage.message}
        </div>
      ) : null}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 text-sm text-neutral-600">
          <p>
            Mostrando {data?.length ?? 0} pedido{(data?.length ?? 0) === 1 ? '' : 's'}
          </p>
          {isFetching ? <span className="text-xs text-neutral-400">Actualizando...</span> : null}
        </header>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Envio</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm text-neutral-700">
              {isError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-sm text-rose-600">
                    No se pudieron cargar pedidos. {toErrorMessage(error)}
                  </td>
                </tr>
              ) : null}

              {!isError && isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-sm text-neutral-500">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : null}

              {!isError && !isLoading && !data?.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-neutral-500">
                    No hay pedidos para los filtros seleccionados.
                  </td>
                </tr>
              ) : null}

              {!isError &&
                !isLoading &&
                data?.map((order) => {
                  const orderId = String(order.id);
                  const isRowPending = pendingOrderId === orderId && isMutating;
                  const canPay = order.status === 'draft' || order.status === 'pending_payment';
                  const canCancel =
                    order.status !== 'paid' &&
                    order.status !== 'fulfilled' &&
                    order.status !== 'cancelled' &&
                    order.status !== 'refunded';
                  const canFulfill = order.status === 'paid';

                  return (
                    <tr key={orderId}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-neutral-900">#{orderId}</p>
                        <p className="text-xs text-neutral-500">{order.lines.length} lineas</p>
                      </td>
                      <td className="px-4 py-4 text-xs text-neutral-600">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-4 text-xs text-neutral-600">
                        {order.user_id ? String(order.user_id) : 'Invitado'}
                      </td>
                      <td className="px-4 py-4">{getOrderStatusLabel(order.status)}</td>
                      <td className="px-4 py-4">{order.payment_status}</td>
                      <td className="px-4 py-4">{order.shipping_status}</td>
                      <td className="px-4 py-4 font-semibold text-neutral-900">
                        {formatMoney(order.total_amount, order.currency)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handlePay(orderId)}
                            disabled={!canPay || isRowPending}
                            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 disabled:opacity-40"
                          >
                            {isRowPending && payOrderState.isLoading ? 'Procesando...' : 'Pagar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFulfill(orderId)}
                            disabled={!canFulfill || isRowPending}
                            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 disabled:opacity-40"
                          >
                            {isRowPending && fulfillOrderState.isLoading
                              ? 'Procesando...'
                              : 'Completar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancel(orderId)}
                            disabled={!canCancel || isRowPending}
                            className="rounded-md border border-rose-300 px-2.5 py-1 text-xs font-semibold text-rose-700 disabled:opacity-40"
                          >
                            {isRowPending && cancelOrderState.isLoading
                              ? 'Procesando...'
                              : 'Cancelar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-sm text-neutral-600">
          <p>Pagina {page}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => prev - 1)}
              disabled={!canGoPrev}
              className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!canGoNext}
              className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
