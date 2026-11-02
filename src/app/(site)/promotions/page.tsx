'use client';

import Link from 'next/link';

import { useListActivePromotionsQuery } from '@/store/api/promotionsApi';

function PromotionsPageContent() {
  const { data, isLoading, isFetching, isError } = useListActivePromotionsQuery();
  const promotions = data ?? [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold text-neutral-900">Promociones</h1>
        <p className="text-sm text-neutral-600">
          Consulta beneficios activos y revisa si aplican a tu cuenta.
        </p>
      </header>

      {isError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          No pudimos cargar las promociones activas.
        </section>
      ) : isLoading || isFetching ? (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`promo-skeleton-${index}`}
              className="animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100 p-4"
            >
              <div className="h-4 w-20 rounded bg-neutral-200" />
              <div className="mt-3 h-6 w-2/3 rounded bg-neutral-200" />
              <div className="mt-3 h-4 w-full rounded bg-neutral-200" />
            </div>
          ))}
        </section>
      ) : promotions.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
          No hay promociones activas en este momento.
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promotion) => (
            <article
              key={String(promotion.id)}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                {promotion.status}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-neutral-900">{promotion.name}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-neutral-600">
                {promotion.description ?? 'Promocion disponible por tiempo limitado.'}
              </p>
              <Link
                href={`/promotions/${String(promotion.id)}`}
                className="mt-4 inline-flex rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900"
              >
                Ver detalle
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default function PromotionsPage() {
  return <PromotionsPageContent />;
}
