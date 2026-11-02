'use client';

import Link from 'next/link';

import { useGetProductBySlugQuery } from '@/store/api/productApi';
import { useWishlistActions } from '@/wishes/useWishlistActions';
import type { WishWithNotifications } from '@/types/wish';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(parsed);
};

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
};

export default function WishlistProductCard({ wish }: { wish: WishWithNotifications }) {
  const productId = String(wish.product_id);
  const { data: product, isLoading, isFetching } = useGetProductBySlugQuery(productId);
  const { toggleWishlist, isMutating } = useWishlistActions();

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Favorito</p>
          <h2 className="text-lg font-semibold text-neutral-900">
            {product?.title ?? (isLoading || isFetching ? 'Cargando producto...' : `Producto ${productId}`)}
          </h2>
          <p className="text-xs text-neutral-500">Guardado el {formatDate(wish.created_at)}</p>
          {product ? (
            <p className="text-sm text-neutral-600">
              {formatMoney(product.price, String(product.currency))}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/products/${product?.slug ?? productId}`}
              className="inline-flex rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
            >
              Ver producto
            </Link>
            <button
              type="button"
              onClick={() => void toggleWishlist(productId)}
              disabled={isMutating}
              className="inline-flex rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Quitar de favoritos
            </button>
          </div>
        </div>

        <div className="min-w-56 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Alertas</p>
          {wish.notifications.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              Sin notificaciones asociadas a este favorito.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {wish.notifications.slice(0, 3).map((notification) => (
                <li key={String(notification.id)} className="text-sm text-neutral-600">
                  <p className="font-medium text-neutral-800">{notification.message}</p>
                  <p className="text-xs text-neutral-500">
                    {formatDate(notification.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
