'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCreateOrGetCartMutation, useGetCartQuery } from '@/store/api/cartApi';
import { useAppSelector } from '@/store/hooks';
import {
  selectCart,
  selectCartItems,
  selectCartItemsCount,
  selectCartSubtotal,
} from '@/store/slices/cartSlice';
import { CartIcon } from '@/components/layout/nav/icons';
import { ICON_BUTTON_CLASS } from '@/components/layout/nav/constants';

interface MiniCartProps {
  onCloseMenu: () => void;
}

const formatCurrency = (value: number, currency = 'EUR') =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);

export default function MiniCart({ onCloseMenu }: MiniCartProps) {
  const [ensureCart] = useCreateOrGetCartMutation();
  const { error, isLoading, isFetching, refetch } = useGetCartQuery();
  const cart = useAppSelector(selectCart);
  const items = useAppSelector(selectCartItems);
  const totalItems = useAppSelector(selectCartItemsCount);
  const subtotal = useAppSelector(selectCartSubtotal);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasEnsuredCart = useRef(false);

  useEffect(() => {
    if (hasEnsuredCart.current) return;
    hasEnsuredCart.current = true;
    ensureCart(undefined).catch(() => undefined);
  }, [ensureCart]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const isNotFound =
    !cart && error && typeof error === 'object' && 'status' in error && error.status === 404;
  const isDataEmpty = Boolean(cart) && items.length === 0;
  const isEmpty = isNotFound || isDataEmpty;

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      onCloseMenu();
      refetch();
    }
  };
  const handleClose = () => setIsOpen(false);
  const handleNavigateAway = () => {
    handleClose();
    onCloseMenu();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className={`${ICON_BUTTON_CLASS} relative`}
        aria-label={totalItems > 0 ? `Abrir carrito (${totalItems} articulos)` : 'Abrir carrito'}
      >
        <CartIcon />
        <span className="sr-only">Carrito de compras</span>
        {totalItems > 0 && (
          <span className="absolute -top-1.5 -right-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold leading-none text-white">
            {totalItems}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-lg">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">Carrito</h3>
            <button
              type="button"
              className="text-xs text-neutral-400 transition hover:text-neutral-600"
              onClick={handleClose}
            >
              Cerrar
            </button>
          </header>

          {isLoading || isFetching ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`mini-cart-skeleton-${index}`} className="animate-pulse space-y-2">
                  <div className="h-3 rounded bg-neutral-200" />
                  <div className="h-3 w-1/2 rounded bg-neutral-200" />
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600">
              <p className="font-medium text-neutral-700">Tu carrito esta vacio.</p>
              <p>Explora el catalogo y agrega tus articulos favoritos para verlos aqui.</p>
              <Link
                href="/products"
                onClick={handleNavigateAway}
                className="inline-flex items-center justify-center rounded-full border border-neutral-200 px-3 py-1.5 font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
              >
                Ver productos
              </Link>
            </div>
          ) : error ? (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-600">
              <p className="font-semibold text-red-700">Error al cargar el carrito.</p>
              <p>Ha ocurrido un problema temporal. Intenta nuevamente en unos segundos.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center justify-center rounded-full border border-red-300 px-3 py-1.5 font-semibold text-red-600 transition hover:border-red-400 hover:text-red-700"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-neutral-200">
                {items.slice(0, 4).map((item) => (
                  <li key={String(item.id)} className="py-2 text-xs text-neutral-600">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-neutral-900">x{item.quantity}</span>
                      <span className="text-neutral-500">
                        {formatCurrency(item.line_total, cart?.currency)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {items.length > 4 && (
                <p className="mt-2 text-xs text-neutral-400">
                  Y {items.length - 4} producto(s) mas
                </p>
              )}

              <div className="mt-3 flex items-center justify-between text-sm font-semibold text-neutral-900">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, cart?.currency)}</span>
              </div>

              <Link
                href="/carrito"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
                onClick={handleNavigateAway}
              >
                Ver carrito
              </Link>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
              >
                Actualizar carrito
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
