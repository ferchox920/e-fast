'use client';

import { useMemo, useState } from 'react';

import {
  useGetInventoryRotationReportQuery,
  useGetInventoryValueReportQuery,
  useGetPurchasesCostAnalysisReportQuery,
  useGetSalesReportQuery,
} from '@/store/api/reportsApi';

const PERIOD_OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
  { value: 180, label: '180 dias' },
] as const;

const formatCurrency = (value: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toFixed(0)} ${currency}`;
  }
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value);

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatRatio = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return value.toFixed(2);
};

const SectionState = ({
  isLoading,
  isError,
  empty,
  loadingText,
  emptyText,
  errorText,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  empty: boolean;
  loadingText: string;
  emptyText: string;
  errorText: string;
  children: React.ReactNode;
}) => {
  if (isLoading) {
    return <p className="text-sm text-neutral-500">{loadingText}</p>;
  }
  if (isError) {
    return <p className="text-sm text-rose-600">{errorText}</p>;
  }
  if (empty) {
    return <p className="text-sm text-neutral-500">{emptyText}</p>;
  }
  return <>{children}</>;
};

export default function AdminReportsPage() {
  const [days, setDays] = useState<number>(30);

  const salesQuery = useGetSalesReportQuery({ days });
  const inventoryValueQuery = useGetInventoryValueReportQuery();
  const costAnalysisQuery = useGetPurchasesCostAnalysisReportQuery({ days });
  const inventoryRotationQuery = useGetInventoryRotationReportQuery({ days });

  const sales = salesQuery.data;
  const inventoryValue = inventoryValueQuery.data;
  const costAnalysis = costAnalysisQuery.data;
  const inventoryRotation = inventoryRotationQuery.data;

  const loadingAny =
    salesQuery.isFetching ||
    inventoryValueQuery.isFetching ||
    costAnalysisQuery.isFetching ||
    inventoryRotationQuery.isFetching;

  const topSellers = useMemo(() => sales?.top_sellers?.slice(0, 5) ?? [], [sales?.top_sellers]);
  const inventoryItems = useMemo(
    () => inventoryValue?.items?.slice(0, 6) ?? [],
    [inventoryValue?.items],
  );
  const costItems = useMemo(
    () => costAnalysis?.items_by_product?.slice(0, 6) ?? [],
    [costAnalysis?.items_by_product],
  );
  const rotationItems = useMemo(
    () => inventoryRotation?.items?.slice(0, 6) ?? [],
    [inventoryRotation?.items],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Reportes</h1>
          <p className="text-sm text-neutral-600">
            Vista consolidada de ventas, inventario, costos de compra y rotacion.
          </p>
        </div>

        <label className="text-xs font-medium text-neutral-500">
          Periodo
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="mt-1 h-10 min-w-36 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Ingresos</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {sales
              ? formatCurrency(sales.sales_summary.total_revenue)
              : loadingAny
                ? '...'
                : '-'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {sales ? `${sales.period_days} dias` : 'Reporte de ventas'}
          </p>
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Transacciones</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {sales ? formatNumber(sales.sales_summary.total_sales_transactions) : loadingAny ? '...' : '-'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Ventas registradas</p>
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Valor inventario</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {inventoryValue
              ? formatCurrency(inventoryValue.total_estimated_value)
              : loadingAny
                ? '...'
                : '-'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {inventoryValue ? `${formatNumber(inventoryValue.total_units)} unidades` : 'Snapshot actual'}
          </p>
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Costo compras</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">
            {costAnalysis
              ? formatCurrency(costAnalysis.total_purchase_cost)
              : loadingAny
                ? '...'
                : '-'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {costAnalysis ? `${formatNumber(costAnalysis.total_units_purchased)} unidades` : 'Periodo seleccionado'}
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Top vendedores</h2>
              <p className="text-xs text-neutral-500">
                Generado {formatDateTime(sales?.generated_at ?? null)}
              </p>
            </div>
          </header>

          <SectionState
            isLoading={salesQuery.isLoading || salesQuery.isFetching}
            isError={salesQuery.isError}
            empty={topSellers.length === 0}
            loadingText="Cargando reporte de ventas..."
            emptyText="No hay ventas para el periodo seleccionado."
            errorText="No pudimos cargar el reporte de ventas."
          >
            <ul className="space-y-2 text-sm">
              {topSellers.map((item) => (
                <li
                  key={`${item.product_id}-${item.sku}`}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{item.product_title}</p>
                    <p className="text-xs text-neutral-500">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">{formatNumber(item.units_sold)} u.</p>
                    <p className="text-xs text-neutral-500">
                      {formatCurrency(item.estimated_revenue)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionState>
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Valor de inventario</h2>
              <p className="text-xs text-neutral-500">
                Generado {formatDateTime(inventoryValue?.generated_at ?? null)}
              </p>
            </div>
          </header>

          <SectionState
            isLoading={inventoryValueQuery.isLoading || inventoryValueQuery.isFetching}
            isError={inventoryValueQuery.isError}
            empty={inventoryItems.length === 0}
            loadingText="Cargando valuacion de inventario..."
            emptyText="No hay inventario valuado."
            errorText="No pudimos cargar la valuacion de inventario."
          >
            <ul className="space-y-2 text-sm">
              {inventoryItems.map((item) => (
                <li
                  key={String(item.variant_id)}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{item.product_title}</p>
                    <p className="text-xs text-neutral-500">
                      SKU: {item.sku} | Stock: {formatNumber(item.stock_on_hand)}
                    </p>
                  </div>
                  <p className="font-semibold text-neutral-900">
                    {formatCurrency(item.estimated_value)}
                  </p>
                </li>
              ))}
            </ul>
          </SectionState>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Analisis de costos</h2>
              <p className="text-xs text-neutral-500">
                Generado {formatDateTime(costAnalysis?.generated_at ?? null)}
              </p>
            </div>
          </header>

          <SectionState
            isLoading={costAnalysisQuery.isLoading || costAnalysisQuery.isFetching}
            isError={costAnalysisQuery.isError}
            empty={costItems.length === 0}
            loadingText="Cargando analisis de costos..."
            emptyText="No hay compras suficientes para el periodo seleccionado."
            errorText="No pudimos cargar el analisis de costos."
          >
            <ul className="space-y-2 text-sm">
              {costItems.map((item) => (
                <li
                  key={String(item.variant_id)}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{item.product_title}</p>
                    <p className="text-xs text-neutral-500">
                      SKU: {item.sku} | Compradas: {formatNumber(item.units_purchased)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">
                      {formatCurrency(item.total_cost)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Avg: {formatCurrency(item.average_cost)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionState>
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Rotacion de inventario</h2>
              <p className="text-xs text-neutral-500">
                Generado {formatDateTime(inventoryRotation?.generated_at ?? null)}
              </p>
            </div>
          </header>

          <SectionState
            isLoading={inventoryRotationQuery.isLoading || inventoryRotationQuery.isFetching}
            isError={inventoryRotationQuery.isError}
            empty={rotationItems.length === 0}
            loadingText="Cargando rotacion de inventario..."
            emptyText="No hay datos de rotacion para el periodo seleccionado."
            errorText="No pudimos cargar el reporte de rotacion."
          >
            <ul className="space-y-2 text-sm">
              {rotationItems.map((item) => (
                <li
                  key={String(item.variant_id)}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{item.product_title}</p>
                    <p className="text-xs text-neutral-500">
                      SKU: {item.sku} | Vendidas: {formatNumber(item.units_sold)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">
                      Stock: {formatNumber(item.current_stock)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Rotacion: {formatRatio(item.turnover_ratio)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionState>
        </article>
      </section>
    </div>
  );
}
