'use client';

import { useMemo } from 'react';

import { useGetCustomerEngagementQuery } from '@/store/api/engagementApi';

const formatNumber = (value: number) => new Intl.NumberFormat('es-AR').format(value);

export default function CustomerEngagementSummary({ userId }: { userId: string }) {
  const { data, isLoading, isFetching, isError } = useGetCustomerEngagementQuery(
    { userId },
    { skip: !userId },
  );

  const totals = useMemo(
    () =>
      (data ?? []).reduce(
        (acc, item) => {
          acc.views += item.views;
          acc.clicks += item.clicks;
          acc.carts += item.carts;
          acc.purchases += item.purchases;
          acc.points += item.points_earned;
          return acc;
        },
        { views: 0, clicks: 0, carts: 0, purchases: 0, points: 0 },
      ),
    [data],
  );

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Mi engagement</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Resumen de actividad vinculada a tu cuenta en la tienda.
          </p>
        </div>
      </div>

      {isError ? (
        <p className="mt-4 text-sm text-rose-600">No pudimos cargar tu historial de engagement.</p>
      ) : isLoading || isFetching ? (
        <p className="mt-4 text-sm text-neutral-500">Cargando actividad de tu cuenta...</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Vistas</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatNumber(totals.views)}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Clicks</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatNumber(totals.clicks)}
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
            <p className="text-xs uppercase tracking-wide text-neutral-400">Puntos</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatNumber(totals.points)}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
