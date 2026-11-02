'use client';

import { useMemo } from 'react';

import { useGetProductEngagementQuery } from '@/store/api/engagementApi';

const formatNumber = (value: number) => new Intl.NumberFormat('es-AR').format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

export default function ProductEngagementSummary({ productId }: { productId: string }) {
  const { data, isLoading, isFetching, isError } = useGetProductEngagementQuery(
    { productId },
    { skip: !productId },
  );

  const totals = useMemo(
    () =>
      (data ?? []).reduce(
        (acc, item) => {
          acc.views += item.views;
          acc.clicks += item.clicks;
          acc.carts += item.carts;
          acc.purchases += item.purchases;
          acc.revenue += item.revenue;
          return acc;
        },
        { views: 0, clicks: 0, carts: 0, purchases: 0, revenue: 0 },
      ),
    [data],
  );

  const conversionRate = totals.views > 0 ? (totals.purchases / totals.views) * 100 : 0;

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Engagement del producto</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Señales agregadas de interes y conversion para este producto.
          </p>
        </div>
      </div>

      {isError ? (
        <p className="mt-4 text-sm text-rose-600">No pudimos cargar el engagement del producto.</p>
      ) : isLoading || isFetching ? (
        <p className="mt-4 text-sm text-neutral-500">Cargando engagement del producto...</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Vistas</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatNumber(totals.views)}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Carritos</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatNumber(totals.carts)}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Compras</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatNumber(totals.purchases)}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Conversion</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatPercent(conversionRate)}%
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
