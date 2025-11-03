'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { CartIcon } from '@/components/layout/nav/icons';

export interface CartEmptyStateProps {
  title?: string;
  description?: string;
  cta?: ReactNode;
}

export default function CartEmptyState({
  title = 'Tu carrito esta vacio',
  description = 'Agrega productos para continuar con tu compra. Revisa nuestras recomendaciones o busca nuevas ofertas.',
  cta = (
    <Link
      href="/"
      className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
    >
      Ir a la tienda
    </Link>
  ),
}: CartEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-indigo-500/10 text-3xl text-indigo-500">
        <CartIcon />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      {cta}
    </div>
  );
}
