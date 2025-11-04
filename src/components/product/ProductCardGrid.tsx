'use client';

import type { ReactNode } from 'react';
import ProductCard, { type ProductCardProps } from './ProductCard';

interface ProductCardGridProps {
  products: ProductCardProps[];
  emptyState?: ReactNode;
}

export default function ProductCardGrid({ products, emptyState }: ProductCardGridProps) {
  if (products.length === 0) {
    return (
      emptyState ?? (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-12 text-center text-sm text-neutral-500">
          No hay productos disponibles.
        </div>
      )
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={String(product.product.id)} {...product} />
      ))}
    </div>
  );
}
