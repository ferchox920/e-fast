'use client';

import type { ReactNode } from 'react';
import ProductCard, { type ProductCardProps } from './ProductCard';

export interface ProductDescriptionCardProps extends ProductCardProps {
  highlights?: string[];
  stockMessage?: string | null;
  shippingEstimate?: string | null;
  actionSlot?: ReactNode;
}

export default function ProductDescriptionCard({
  highlights,
  stockMessage,
  shippingEstimate,
  actionSlot,
  ...cardProps
}: ProductDescriptionCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <ProductCard {...cardProps} />

      {(highlights?.length ?? 0) > 0 && (
        <section className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-600">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Destacados
          </h3>
          <ul className="list-inside list-disc space-y-1">
            {highlights!.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </section>
      )}

      {(stockMessage || shippingEstimate) && (
        <section className="grid gap-3 text-sm text-neutral-600 sm:grid-cols-2">
          {stockMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              {stockMessage}
            </div>
          )}
          {shippingEstimate && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              {shippingEstimate}
            </div>
          )}
        </section>
      )}

      {actionSlot}
    </div>
  );
}
