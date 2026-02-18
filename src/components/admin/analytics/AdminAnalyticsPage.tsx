'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useGetAnalyticsDashboardQuery } from '@/store/api/adminApi';
import type { AdminPromotionSummary, AdminStockAlertSummary } from '@/types/admin';

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

const formatPercent = (value: number, digits = 1) => `${value.toFixed(digits)}%`;

const formatDate = (value?: string | null) => {
  if (!value) return 'Pendiente';
  try {
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return value;
  }
};

const recordToPairs = (record: Record<string, number> | undefined) =>
  Object.entries(record ?? {}).sort(([, a], [, b]) => b - a);

const buildAlertLabel = (alert: AdminStockAlertSummary) => {
  if (alert.product_title) return alert.product_title;
  if (alert.sku) return alert.sku;
  return `Variante ${alert.variant_id}`;
};

const normalizePromotions = (promotions: AdminPromotionSummary[]) =>
  promotions.map((promo) => ({
    ...promo,
    status: promo.status ?? 'active',
    scope: promo.scope ?? 'global',
  }));

export default function AdminAnalyticsPage() {
  const { data, isLoading, isFetching, isError } = useGetAnalyticsDashboardQuery();
  const loading = isLoading || isFetching;

  const totalRevenue = data?.total_revenue;
  const orders = data?.orders_received;
  const avgOrderValue = data?.average_order_value ?? 0;
  const salesSummary = data?.sales_summary;
  const topSellers = data?.top_sellers ?? [];
  const inventory = data?.inventory ?? { total_estimated_value: 0, total_units: 0, items: [] };
  const engagementTotals = data?.engagement.totals;
  const engagementTrend = data?.engagement.trend;
  const exposureMix = data?.exposure_mix ?? [];
  const loyaltyDistribution = data?.loyalty_distribution ?? [];
  const operations = data?.operations ?? {
    orders_by_status: {},
    payments_by_status: {},
    shipments_by_status: {},
    stock_alerts: [],
    pending_questions: [],
  };
  const promotions = data?.promotions ?? { active_count: 0, active: [] };

  const orderStatusPairs = useMemo(
    () => recordToPairs(operations.orders_by_status),
    [operations.orders_by_status],
  );
  const paymentStatusPairs = useMemo(
    () => recordToPairs(operations.payments_by_status),
    [operations.payments_by_status],
  );
  const shipmentStatusPairs = useMemo(
    () => recordToPairs(operations.shipments_by_status),
    [operations.shipments_by_status],
  );
  const latestTrend = useMemo(() => {
    const points = engagementTrend ?? [];
    return points.slice(-5).reverse();
  }, [engagementTrend]);
  const normalizedPromotions = useMemo(
    () => normalizePromotions(promotions.active ?? []),
    [promotions.active],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Analíticas avanzadas</h1>
          <p className="text-sm text-neutral-600">
            Explora el detalle de ventas, engagement, inventario y operaciones en un único lugar.
          </p>
        </div>
        {data?.period ? (
          <p className="text-xs text-neutral-500">
            Periodo analizado:{' '}
            {data.period.start ? new Date(data.period.start).toLocaleDateString('es-ES') : 'N/D'} ��{' '}
            {data.period.end ? new Date(data.period.end).toLocaleDateString('es-ES') : 'N/D'}
          </p>
        ) : null}
      </header>

      {isError ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          <p className="font-medium">No pudimos cargar el panel de analíticas.</p>
          <p>Verifica tu conexión o vuelve a intentarlo en unos minutos.</p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Ingresos acumulados
          </p>
          <p className="mt-3 text-3xl font-bold text-neutral-900">
            {loading
              ? '•••'
              : formatCurrency(totalRevenue?.value ?? 0, totalRevenue?.currency ?? 'USD')}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            {totalRevenue?.delta_percentage !== undefined && totalRevenue?.delta_percentage !== null
              ? `Variación vs período previo: ${
                  totalRevenue.delta_percentage > 0 ? '+' : ''
                }${totalRevenue.delta_percentage.toFixed(1)}%`
              : 'Sin comparativa disponible'}
          </p>
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Pedidos procesados
          </p>
          <p className="mt-3 text-3xl font-bold text-neutral-900">
            {loading ? '•••' : formatNumber(orders?.value ?? 0)}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            {orders?.delta_percentage !== undefined && orders?.delta_percentage !== null
              ? `Variación vs período previo: ${
                  orders.delta_percentage > 0 ? '+' : ''
                }${orders.delta_percentage.toFixed(1)}%`
              : 'Sin comparativa disponible'}
          </p>
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Ticket promedio
          </p>
          <p className="mt-3 text-3xl font-bold text-neutral-900">
            {loading ? '•••' : formatCurrency(avgOrderValue, totalRevenue?.currency ?? 'USD')}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Estimado considerando pedidos capturados en el período analizado.
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Rendimiento comercial
              </p>
              <p className="text-sm text-neutral-600">
                KPIs agregados y top vendedores del período seleccionado.
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-600">
              {salesSummary ? `${formatNumber(salesSummary.total_units_sold)} u.` : 'Sin datos'}
            </span>
          </header>
          {salesSummary ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-neutral-500">Ingresos</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {formatCurrency(salesSummary.total_revenue, totalRevenue?.currency ?? 'USD')}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-500">Unidades</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {formatNumber(salesSummary.total_units_sold)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-500">Transacciones</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {formatNumber(salesSummary.total_sales_transactions)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              {loading ? 'Calculando resumen...' : 'No hay suficientes ventas registradas.'}
            </p>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Top vendedores
            </p>
            {topSellers.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {topSellers.slice(0, 5).map((seller) => (
                  <li
                    key={`${seller.product_id}-${seller.sku}`}
                    className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">{seller.product_title}</p>
                      <p className="text-xs text-neutral-500">SKU: {seller.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatNumber(seller.units_sold)} u.
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatCurrency(seller.estimated_revenue, totalRevenue?.currency ?? 'USD')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">
                {loading ? 'Obteniendo ranking...' : 'Sin ventas registradas para este período.'}
              </p>
            )}
          </div>
        </article>

        <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Salud del inventario
              </p>
              <p className="text-sm text-neutral-600">Valor total estimado y variantes destacadas.</p>
            </div>
            <span className="text-xs font-semibold text-indigo-600">
              {formatNumber(inventory.total_units)} uds.
            </span>
          </header>
          <p className="text-2xl font-bold text-neutral-900">
            {formatCurrency(inventory.total_estimated_value, totalRevenue?.currency ?? 'USD')}
          </p>
          {inventory.items.length ? (
            <ul className="space-y-2 text-sm">
              {inventory.items.slice(0, 5).map((item) => (
                <li
                  key={item.variant_id}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{item.product_title}</p>
                    <p className="text-xs text-neutral-500">
                      SKU: {item.sku} �� Stock: {formatNumber(item.stock_on_hand)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900">
                      {formatCurrency(item.estimated_value, totalRevenue?.currency ?? 'USD')}
                    </p>
                    {typeof item.last_unit_cost === 'number' ? (
                      <p className="text-xs text-neutral-500">
                        Último costo: {formatCurrency(item.last_unit_cost, totalRevenue?.currency)}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">
              {loading ? 'Calculando inventario...' : 'No hay inventario valuado todavía.'}
            </p>
          )}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Engagement y conversión
              </p>
              <p className="text-sm text-neutral-600">
                Actividad de usuarios y evolución diaria de compras.
              </p>
            </div>
          </header>
          {engagementTotals ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-neutral-500">Vistas</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {formatNumber(engagementTotals.views)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-500">Clicks</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {formatNumber(engagementTotals.clicks)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-500">Carritos</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {formatNumber(engagementTotals.carts)}
                </p>
              </div>
            </div>
          ) : null}
          {engagementTotals ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-neutral-500">Compras</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {formatNumber(engagementTotals.purchases)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-500">Tasa de conversión</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {formatPercent(engagementTotals.conversion_rate * 100)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-500">Add-to-cart</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {formatPercent(engagementTotals.cart_rate * 100)}
                </p>
              </div>
            </div>
          ) : null}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Series recientes
            </p>
            {latestTrend.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {latestTrend.map((point) => (
                  <li
                    key={point.date}
                    className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                  >
                    <span className="font-medium text-neutral-800">{formatDate(point.date)}</span>
                    <span className="text-neutral-600">
                      {formatNumber(point.purchases)} compras ��{' '}
                      {formatCurrency(point.revenue, totalRevenue?.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">
                {loading ? 'Analizando serie temporal...' : 'Sin datos de engagement disponibles.'}
              </p>
            )}
          </div>
        </article>

        <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Mix de exposición y loyalty
            </p>
            <p className="text-sm text-neutral-600">
              Distribución por slot e insights de fidelización.
            </p>
          </header>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Slots de exposición
            </p>
            {exposureMix.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {exposureMix.slice(0, 5).map((entry) => (
                  <li key={entry.slot} className="flex items-center justify-between">
                    <span className="font-medium text-neutral-800">{entry.slot}</span>
                    <span className="text-neutral-600">{entry.ctr.toFixed(2)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">
                {loading ? 'Calculando CTR por slot...' : 'Sin datos de exposición disponibles.'}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Distribución de fidelización
            </p>
            {loyaltyDistribution.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {loyaltyDistribution.map((entry) => (
                  <li key={entry.loyalty_level} className="flex items-center justify-between">
                    <span className="font-medium text-neutral-800">{entry.loyalty_level}</span>
                    <span className="text-neutral-600">
                      {entry.percentage.toFixed(1)}%
                      {typeof entry.customers === 'number'
                        ? ` �� ${formatNumber(entry.customers)} clientes`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">
                {loading ? 'Calculando niveles...' : 'Sin datos de loyalty disponibles.'}
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Estado operativo
            </p>
            <p className="text-sm text-neutral-600">Pedidos, pagos y envíos por estado.</p>
          </header>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-neutral-500">Pedidos</p>
              {orderStatusPairs.length ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {orderStatusPairs.map(([status, value]) => (
                    <li key={status} className="flex items-center justify-between">
                      <span className="text-neutral-700">{status}</span>
                      <span className="font-semibold text-neutral-900">{formatNumber(value)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-neutral-500">Sin datos</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500">Pagos</p>
              {paymentStatusPairs.length ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {paymentStatusPairs.map(([status, value]) => (
                    <li key={status} className="flex items-center justify-between">
                      <span className="text-neutral-700">{status}</span>
                      <span className="font-semibold text-neutral-900">{formatNumber(value)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-neutral-500">Sin datos</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500">Envíos</p>
              {shipmentStatusPairs.length ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {shipmentStatusPairs.map(([status, value]) => (
                    <li key={status} className="flex items-center justify-between">
                      <span className="text-neutral-700">{status}</span>
                      <span className="font-semibold text-neutral-900">{formatNumber(value)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-neutral-500">Sin datos</p>
              )}
            </div>
          </div>
        </article>

        <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Alertas de stock
              </p>
              <p className="text-sm text-neutral-600">Variantes por debajo del punto de reposición.</p>
            </div>
          </header>
          {operations.stock_alerts.length ? (
            <ul className="space-y-2 text-sm">
              {operations.stock_alerts.slice(0, 5).map((alert) => (
                <li
                  key={alert.variant_id}
                  className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-amber-900">{buildAlertLabel(alert)}</p>
                    <p className="text-xs text-amber-800">
                      Disponible: {formatNumber(alert.available)} �� Faltante:{' '}
                      {formatNumber(alert.missing)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-amber-900">
                    RP: {formatNumber(alert.reorder_point)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">
              {loading ? 'Evaluando niveles...' : 'No hay alertas activas en este momento.'}
            </p>
          )}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Preguntas por moderar
              </p>
              <p className="text-sm text-neutral-600">
                Extraídas directamente del módulo de operaciones.
              </p>
            </div>
            <Link
              href="/admin/products?tab=questions"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Ir al módulo
            </Link>
          </header>
          {operations.pending_questions.length ? (
            <ul className="space-y-2 text-sm">
              {operations.pending_questions.slice(0, 5).map((question) => (
                <li
                  key={question.id}
                  className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                >
                  <p className="font-medium text-neutral-900">
                    {question.product_title ?? 'Producto sin título'}
                  </p>
                  <p className="text-neutral-600 line-clamp-2">{question.body}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      {question.author_name ?? 'Anónimo'} �� {formatDate(question.created_at ?? '')}
                    </span>
                    <Link
                      href={`/admin/products/${question.product_id}?tab=questions`}
                      className="font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Revisar
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">
              {loading ? 'Sincronizando moderación...' : 'No hay preguntas pendientes.'}
            </p>
          )}
        </article>

        <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Promociones activas
              </p>
              <p className="text-sm text-neutral-600">
                Estado de campañas y próximos vencimientos.
              </p>
            </div>
            <Link
              href="/admin/promotions"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Gestionar
            </Link>
          </header>
          {normalizedPromotions.length ? (
            <ul className="space-y-2 text-sm">
              {normalizedPromotions.slice(0, 5).map((promo) => (
                <li
                  key={promo.id}
                  className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-neutral-900">{promo.name}</p>
                    <span className="text-xs font-semibold text-neutral-600">{promo.scope}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                    <span className="uppercase">{promo.status}</span>
                    <span>
                      {formatDate(promo.starts_at ?? null)} �� {formatDate(promo.ends_at ?? null)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">
              {loading ? 'Sincronizando promociones...' : 'No hay promociones activas.'}
            </p>
          )}
          <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
            Total activas reportadas: {promotions.active_count ?? 0}
          </div>
        </article>
      </section>
    </div>
  );
}
