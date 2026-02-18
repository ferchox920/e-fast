'use client';

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useAddCartItemMutation, useCreateOrGetCartMutation } from '@/store/api/cartApi';
import { productApi } from '@/store/api/productApi';
import { useAppSelector } from '@/store/hooks';
import { selectCartError, selectCartStatus } from '@/store/slices/cartSlice';
import type { CurrencyCode, UUID } from '@/types/common';
import type { Product } from '@/types/product';

export interface ProductCardProps {
  product: Product;
  badges?: string[];
  rating?: number | null;
  reviewCount?: number | null;
  isFavorite?: boolean;
  onToggleFavorite?: (id: UUID | string) => void;
  footerSlot?: ReactNode;
  defaultVariantId?: UUID | string | null;
  defaultQuantity?: number;
  imageUrl?: string | null;
  imageAlt?: string | null;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=60';

const formatCurrency = (value: number, currency?: CurrencyCode | null) => {
  const resolvedCurrency: string = (currency ?? 'EUR') as string;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: resolvedCurrency,
    minimumFractionDigits: 2,
  }).format(value);
};

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
      return data.detail;
    }
  }
  return fallback;
};

export default function ProductCard({
  product,
  badges = [],
  rating,
  reviewCount,
  isFavorite = false,
  onToggleFavorite,
  footerSlot,
  defaultVariantId,
  defaultQuantity = 1,
  imageUrl,
  imageAlt,
}: ProductCardProps) {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const cartStatus = useAppSelector(selectCartStatus);
  const cartError = useAppSelector(selectCartError);
  const ensuredCartRef = useRef(false);
  const prefetchProduct = productApi.usePrefetch('getProductBySlug');

  const [createOrGetCart, { isLoading: ensuringCart }] = useCreateOrGetCartMutation();
  const [addCartItem, { isLoading: addingCartItem }] = useAddCartItemMutation();

  const productId = String(product.id);
  const slug = product.slug ?? productId;
  const title = product.title ?? slug;
  const description = product.description ?? '';
  const currency = (product.currency ?? 'EUR') as CurrencyCode | null;
  const primaryImageUrl =
    imageUrl ?? product.primary_image?.url ?? product.images?.[0]?.url ?? FALLBACK_IMAGE;
  const primaryAltText = imageAlt ?? product.primary_image?.alt_text ?? title;
  const resolvedVariantId =
    defaultVariantId ?? (product.variants?.[0]?.id ? String(product.variants[0].id) : null);

  const isProcessing = ensuringCart || addingCartItem;
  const addDisabled = isProcessing || !resolvedVariantId;

  const handleAddToCart = async () => {
    if (!resolvedVariantId) {
      setFeedback({ type: 'error', message: 'Selecciona una variante disponible.' });
      return;
    }

    try {
      setFeedback(null);

      if (!ensuredCartRef.current) {
        const payload = product.currency ? { currency: product.currency } : undefined;
        await createOrGetCart(payload).unwrap();
        ensuredCartRef.current = true;
      }

      await addCartItem({
        variantId: String(resolvedVariantId),
        quantity: defaultQuantity,
      }).unwrap();
      setFeedback({ type: 'success', message: 'Producto agregado al carrito.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: cartError ?? getErrorMessage(err, 'No pudimos agregar el producto al carrito.'),
      });
    }
  };

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md">
      <Link
        href={`/products/${slug}`}
        className="group relative block aspect-4/3"
        onMouseEnter={() => prefetchProduct(slug, { force: false })}
        onFocus={() => prefetchProduct(slug, { force: false })}
      >
        <Image
          src={primaryImageUrl}
          alt={primaryAltText}
          fill
          sizes="(min-width:1024px) 320px, (min-width:640px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-105"
          unoptimized
        />

        {badges.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-semibold text-white shadow"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onToggleFavorite?.(productId);
          }}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-neutral-500 transition hover:bg-white hover:text-red-500"
        >
          {isFavorite ? '\u2665' : '\u2661'}
        </button>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="space-y-1">
          <Link
            href={`/products/${slug}`}
            className="line-clamp-2 text-sm font-semibold text-neutral-900 transition hover:text-indigo-600"
          >
            {title}
          </Link>
          <div className="text-lg font-semibold text-indigo-600">
            {formatCurrency(product.price, currency)}
          </div>
          {rating !== undefined && rating !== null && (
            <p className="flex items-center gap-1 text-xs text-amber-500">
              <span>{'\u2605'}</span>
              <span>{rating.toFixed(1)}</span>
              {typeof reviewCount === 'number' && reviewCount > 0 ? (
                <span className="text-neutral-400">({reviewCount})</span>
              ) : null}
            </p>
          )}
        </header>

        {description ? (
          <p className="line-clamp-3 text-sm text-neutral-500">{description}</p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/products/${slug}`}
              className="flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
            >
              Ver detalle
            </Link>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addDisabled}
              className="rounded-full bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
          {feedback && (
            <p
              className={`text-xs ${
                feedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {feedback.message}
            </p>
          )}
          {!feedback && cartStatus === 'failed' && cartError ? (
            <p className="text-xs text-red-600">{cartError}</p>
          ) : null}
        </div>

        {footerSlot}
      </div>
    </article>
  );
}
