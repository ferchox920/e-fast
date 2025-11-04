'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  useGetAnalyticsOverviewQuery,
  useGetPendingProductQuestionsQuery,
} from '@/store/api/adminApi';
import type { AdminLoyaltyDistributionEntry, AdminExposureMixEntry } from '@/types/admin';

const DONUT_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f97316', '#ec4899', '#8b5cf6'];
const BAR_COLORS = ['bg-indigo-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

const formatCurrency = (value: number, currency?: string | null) => {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency ?? 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString('es-ES')} ${currency ?? ''}`.trim();
  }
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

interface DonutSegments {
  segments: Array<
    AdminLoyaltyDistributionEntry & {
      color: string;
      start: number;
      end: number;
      normalized: number;
    }
  >;
  total: number;
}

const buildDonutSegments = (distribution: AdminLoyaltyDistributionEntry[]): DonutSegments => {
  if (!distribution.length) {
    return { segments: [], total: 0 };
  }

  const total = distribution.reduce((sum, entry) => sum + Math.max(entry.percentage, 0), 0);
  if (total <= 0) {
    return { segments: [], total: 0 };
  }

  let currentOffset = 0;
  const segments = distribution.map((entry, index) => {
    const normalized = (entry.percentage / total) * 100;
    const start = currentOffset;
    const end = start + normalized;
    currentOffset = end;
    return {
      ...entry,
      color: DONUT_COLORS[index % DONUT_COLORS.length],
      start,
      end,
      normalized,
    };
  });

  return { segments, total: Math.min(100, currentOffset) };
};

const getStatusStyles = (status: string) => {
  const normalized = status.toLowerCase();
  const map: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-700',
    pendiente_pago: 'bg-amber-100 text-amber-700',
    pending: 'bg-amber-100 text-amber-700',
    pagado: 'bg-emerald-100 text-emerald-700',
    paid: 'bg-emerald-100 text-emerald-700',
    enviado: 'bg-blue-100 text-blue-700',
    shipped: 'bg-blue-100 text-blue-700',
    completado: 'bg-slate-200 text-slate-800',
    completed: 'bg-slate-200 text-slate-800',
    cancelado: 'bg-rose-100 text-rose-700',
    cancelled: 'bg-rose-100 text-rose-700',
  };

  return map[normalized] ?? 'bg-neutral-100 text-neutral-700';
};

const buildCtrBars = (entries: AdminExposureMixEntry[]) => {
  if (!entries.length) return { entries: [] as AdminExposureMixEntry[], max: 0 };
  const maxValue = Math.max(...entries.map((entry) => entry.ctr));
  return { entries, max: maxValue > 0 ? maxValue : 1 };
};

export default function AdminDashboard() {
  const {
    data: overview,
    isLoading: isOverviewLoading,
    isFetching: isOverviewFetching,
    isError: isOverviewError,
  } = useGetAnalyticsOverviewQuery();
  const {
    data: pendingQuestionsData,
    isLoading: isQuestionsLoading,
    isError: isQuestionsError,
  } = useGetPendingProductQuestionsQuery({ limit: 5 });

  const totalRevenue = overview?.total_revenue ?? null;
  const ordersKpi = overview?.orders_received ?? null;
  const loyaltyDistribution = useMemo(
    () => overview?.loyalty_distribution ?? [],
    [overview?.loyalty_distribution],
  );
  const exposureMix = useMemo(() => overview?.exposure_mix ?? [], [overview?.exposure_mix]);
  const latestOrders = overview?.latest_orders ?? [];
  const pendingQuestions = pendingQuestionsData?.items ?? [];

  const loyaltySegments = useMemo(
    () => buildDonutSegments(loyaltyDistribution),
    [loyaltyDistribution],
  );

  const exposureBars = useMemo(() => buildCtrBars(exposureMix), [exposureMix]);

  const showLoadingState = isOverviewLoading || isOverviewFetching;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Resumen del comercio</h1>
        <p className="text-sm text-neutral-600">
          Visualiza el rendimiento general de la tienda y da seguimiento a pedidos y moderación.
        </p>
      </header>

      {isOverviewError ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          <p className="font-medium">No pudimos cargar el panel de analíticas.</p>
          <p>Verifica tu conexión o inténtalo de nuevo en unos minutos.</p>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Ingresos totales
          </p>
          <p className="mt-3 text-3xl font-bold text-neutral-900">
            {showLoadingState
              ? '—'
              : formatCurrency(totalRevenue?.value ?? 0, totalRevenue?.currency)}
          </p>
          {totalRevenue?.delta_percentage !== undefined &&
          totalRevenue?.delta_percentage !== null ? (
            <p className="mt-2 text-xs text-neutral-500">
              Variación semanal: {totalRevenue.delta_percentage > 0 ? '+' : ''}
              {totalRevenue.delta_percentage.toFixed(1)}%
            </p>
          ) : (
            <p className="mt-2 text-xs text-neutral-500">Comparativa no disponible</p>
          )}
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Pedidos recibidos
          </p>
          <p className="mt-3 text-3xl font-bold text-neutral-900">
            {showLoadingState ? '—' : formatNumber(ordersKpi?.value ?? 0)}
          </p>
          {ordersKpi?.delta_percentage !== undefined && ordersKpi?.delta_percentage !== null ? (
            <p className="mt-2 text-xs text-neutral-500">
              Variación semanal: {ordersKpi.delta_percentage > 0 ? '+' : ''}
              {ordersKpi.delta_percentage.toFixed(1)}%
            </p>
          ) : (
            <p className="mt-2 text-xs text-neutral-500">Comparativa no disponible</p>
          )}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Distribución de fidelización
              </p>
              <p className="text-sm text-neutral-600">
                Participación por nivel de loyalty en los últimos 30 días.
              </p>
            </div>
          </header>
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="relative h-40 w-40">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: loyaltySegments.segments.length
                    ? `conic-gradient(${loyaltySegments.segments
                        .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
                        .join(', ')})`
                    : 'conic-gradient(#e5e7eb 0deg 360deg)',
                }}
              />
              <div className="absolute inset-6 flex items-center justify-center rounded-full bg-white text-center text-sm font-semibold text-neutral-600">
                {loyaltySegments.segments.length
                  ? '100%'
                  : showLoadingState
                    ? 'Cargando...'
                    : 'Sin datos'}
              </div>
            </div>
            <ul className="flex-1 space-y-3 text-sm">
              {loyaltySegments.segments.length ? (
                loyaltySegments.segments.map((segment) => (
                  <li key={segment.loyalty_level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: segment.color }}
                        aria-hidden
                      />
                      <span className="font-medium text-neutral-800">{segment.loyalty_level}</span>
                    </div>
                    <span className="text-neutral-600">
                      {segment.normalized.toFixed(1)}%
                      {typeof segment.customers === 'number'
                        ? ` · ${formatNumber(segment.customers)} clientes`
                        : ''}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-neutral-500">
                  {showLoadingState
                    ? 'Calculando distribución...'
                    : 'Aún no hay información de niveles de loyalty.'}
                </li>
              )}
            </ul>
          </div>
        </article>

        <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Mix de exposición (CTR)
            </p>
            <p className="text-sm text-neutral-600">
              Rendimiento por slot de exposición en home y categorías destacadas.
            </p>
          </header>
          <div className="space-y-4">
            {exposureBars.entries.length ? (
              exposureBars.entries.map((entry, index) => (
                <div key={entry.slot} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-800">{entry.slot}</span>
                    <span className="text-neutral-600">{entry.ctr.toFixed(2)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100">
                    <div
                      className={`h-full rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`}
                      style={{
                        width: `${Math.max((entry.ctr / exposureBars.max) * 100, 2)}%`,
                      }}
                    />
                  </div>
                  {(entry.impressions || entry.clicks) && (
                    <p className="text-xs text-neutral-500">
                      {entry.impressions ? `${formatNumber(entry.impressions)} impresiones` : null}
                      {entry.impressions && entry.clicks ? ' · ' : ''}
                      {entry.clicks ? `${formatNumber(entry.clicks)} clics` : null}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">
                {showLoadingState
                  ? 'Calculando rendimiento por slot...'
                  : 'Sin datos de exposición disponibles por el momento.'}
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Últimos pedidos
              </p>
              <p className="text-sm text-neutral-600">
                Seguimiento de los últimos movimientos en la tienda.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Ver todos
            </Link>
          </header>
          <ul className="space-y-4">
            {latestOrders.length ? (
              latestOrders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-lg border border-neutral-100 bg-neutral-50 p-4 transition hover:border-neutral-200 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="space-y-1">
                      <p className="font-semibold text-neutral-900">#{order.order_number}</p>
                      <p className="text-xs text-neutral-500">
                        {formatDateTime(order.placed_at)}
                        {order.customer_name ? ` · ${order.customer_name}` : ''}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusStyles(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-600">
                      {formatCurrency(order.total, order.currency)}
                    </span>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-sm text-neutral-500">
                {showLoadingState
                  ? 'Cargando pedidos recientes...'
                  : 'Aún no hay pedidos recientes registrados.'}
              </li>
            )}
          </ul>
        </article>

        <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Preguntas por moderar
              </p>
              <p className="text-sm text-neutral-600">
                Gestiona las consultas de clientes pendientes de respuesta.
              </p>
            </div>
            <Link
              href="/admin/products?tab=questions"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Ir a moderación
            </Link>
          </header>
          {isQuestionsError ? (
            <p className="text-sm text-red-600">
              No se pudieron cargar las preguntas pendientes. Intenta nuevamente más tarde.
            </p>
          ) : (
            <ul className="space-y-4">
              {pendingQuestions.length ? (
                pendingQuestions.map((question) => (
                  <li
                    key={question.id}
                    className="rounded-lg border border-neutral-100 bg-neutral-50 p-4 transition hover:border-neutral-200 hover:bg-white"
                  >
                    <p className="text-sm font-medium text-neutral-900">
                      {question.product_title ?? 'Producto sin título'}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{question.body}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                      <span>
                        {question.author_name ?? 'Anónimo'} · {formatDateTime(question.created_at)}
                      </span>
                      <Link
                        href={`/admin/products/${question.product_id}?tab=questions`}
                        className="font-semibold text-indigo-600 hover:text-indigo-500"
                      >
                        Revisar
                      </Link>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-neutral-500">
                  {isQuestionsLoading
                    ? 'Cargando preguntas pendientes...'
                    : 'No hay preguntas por moderar en este momento.'}
                </li>
              )}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
