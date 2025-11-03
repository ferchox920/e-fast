'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  badge?: string | null;
  note?: string | null;
}

export interface CartItemCardProps {
  item: CartItem;
  onIncrement?: (id: string) => void;
  onDecrement?: (id: string) => void;
  onRemove?: (id: string) => void;
  actions?: ReactNode;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=256&q=60';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);

export default function CartItemCard({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  actions,
}: CartItemCardProps) {
  const handleIncrement = () => onIncrement?.(item.id);
  const handleDecrement = () => onDecrement?.(item.id);
  const handleRemove = () => onRemove?.(item.id);

  const subtotal = item.price * item.quantity;

  return (
    <article className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
        <Image
          src={item.imageUrl ?? FALLBACK_IMAGE}
          alt={item.name}
          fill
          sizes="96px"
          className="object-cover"
          unoptimized
        />
        {item.badge && (
          <span className="absolute left-2 top-2 rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
            {item.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">{item.name}</h3>
            <p className="text-xs text-neutral-500">{item.variant}</p>
            {item.note && <p className="mt-1 text-xs text-neutral-400">{item.note}</p>}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs font-medium text-neutral-400 transition hover:text-red-500"
            aria-label={`Quitar ${item.name}`}
          >
            Quitar
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={item.quantity <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Reducir cantidad"
            >
              -
            </button>
            <span className="min-w-[2.5rem] text-center text-sm font-semibold text-neutral-800">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>

          <div className="text-right text-sm font-semibold text-neutral-900">
            <div>{formatCurrency(item.price)}</div>
            <div className="text-xs font-normal text-neutral-400">
              Subtotal:{' '}
              <span className="font-semibold text-neutral-700">{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </div>

        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </article>
  );
}
