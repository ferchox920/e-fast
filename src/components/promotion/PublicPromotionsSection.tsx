'use client';

import Link from 'next/link';

import { useListActivePromotionsQuery } from '@/store/api/promotionsApi';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return value;
  }
};

const getPromotionHighlight = (benefits: Record<string, unknown>) => {
  const discountPercent = benefits.discount_percent;
  if (typeof discountPercent === 'number') {
    return `${discountPercent}% OFF`;
  }
  return 'Promo activa';
};

export default function PublicPromotionsSection() {
  const { data, isLoading, isFetching, isError } = useListActivePromotionsQuery();

  const promotions = data ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-neutral-900">Promociones activas</h2>
          <p className="text-sm text-neutral-600">
            Beneficios vigentes para aprovechar desde la tienda.
          </p>
        </div>
        <Link
          href="/promotions"
          className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
        >
          Ver todas
        </Link>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          No pudimos cargar las promociones activas.
        </div>
      ) : isLoading || isFetching ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`promotion-skeleton-${index}`}
              className="animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100 p-4"
            >
              <div className="h-4 w-24 rounded bg-neutral-200" />
              <div className="mt-3 h-6 w-2/3 rounded bg-neutral-200" />
              <div className="mt-3 h-4 w-full rounded bg-neutral-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-neutral-200" />
            </div>
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
          No hay promociones publicas activas en este momento.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {promotions.slice(0, 3).map((promotion) => (
            <article
              key={String(promotion.id)}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                {getPromotionHighlight(promotion.benefits_json)}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-neutral-900">{promotion.name}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-neutral-600">
                {promotion.description ?? 'Promocion disponible por tiempo limitado.'}
              </p>
              <div className="mt-4 text-xs text-neutral-500">
                <p>Vigencia desde {formatDate(promotion.start_at)}</p>
                <p>Hasta {formatDate(promotion.end_at)}</p>
              </div>
              <Link
                href={`/promotions/${String(promotion.id)}`}
                className="mt-4 inline-flex rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900"
              >
                Ver detalle
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
