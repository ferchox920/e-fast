'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';

import CartEmptyState from '@/components/cart/CartEmptyState';
import CartItemCard, { type CartItem } from '@/components/cart/CartItemCard';
import CartSummaryCard from '@/components/cart/CartSummaryCard';
import {
  useCreateOrGetCartMutation,
  useGetCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from '@/store/api/cartApi';
import { useAppSelector } from '@/store/hooks';
import { selectCart, selectCartError, selectCartItems } from '@/store/slices/cartSlice';

const toCartItem = (item: ReturnType<typeof selectCartItems>[number]): CartItem => ({
  id: String(item.id),
  name: `Variante ${String(item.variant_id)}`,
  variant: `ID ${String(item.variant_id)}`,
  price: item.unit_price,
  quantity: item.quantity,
  note: 'Detalle de producto pendiente de enriquecer en esta pantalla.',
});

export default function CartPageClient() {
  const [ensureCart] = useCreateOrGetCartMutation();
  const { isLoading, isFetching, refetch, error } = useGetCartQuery();
  const [updateCartItem, updateState] = useUpdateCartItemMutation();
  const [removeCartItem, removeState] = useRemoveCartItemMutation();

  const cart = useAppSelector(selectCart);
  const items = useAppSelector(selectCartItems);
  const cartError = useAppSelector(selectCartError);
  const hasEnsuredCart = useRef(false);

  useEffect(() => {
    if (hasEnsuredCart.current) return;
    hasEnsuredCart.current = true;
    ensureCart(undefined).catch(() => undefined);
  }, [ensureCart]);

  const viewItems = useMemo(() => items.map((item) => toCartItem(item)), [items]);

  const summaryLines = useMemo(
    () => [
      { id: 'subtotal', label: 'Subtotal', value: cart?.subtotal_amount ?? 0 },
      { id: 'discount', label: 'Descuentos', value: -(cart?.discount_amount ?? 0), type: 'discount' as const },
      { id: 'total', label: 'Total', value: cart?.total_amount ?? 0, type: 'total' as const },
    ],
    [cart],
  );

  const handleIncrement = async (itemId: string) => {
    const current = items.find((entry) => String(entry.id) === itemId);
    if (!current) return;
    await updateCartItem({ itemId, quantity: current.quantity + 1 }).unwrap();
  };

  const handleDecrement = async (itemId: string) => {
    const current = items.find((entry) => String(entry.id) === itemId);
    if (!current || current.quantity <= 1) return;
    await updateCartItem({ itemId, quantity: current.quantity - 1 }).unwrap();
  };

  const handleRemove = async (itemId: string) => {
    await removeCartItem({ itemId }).unwrap();
  };

  const isBusy = isLoading || isFetching || updateState.isLoading || removeState.isLoading;
  const hasError = Boolean(error || cartError);

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">Carrito</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Revisa tus productos antes de continuar al checkout.
        </p>
      </header>

      {hasError ? (
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          <p className="font-medium">No pudimos cargar el carrito.</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-400"
            >
              Reintentar
            </button>
            <Link
              href="/products"
              className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
            >
              Volver a productos
            </Link>
          </div>
        </article>
      ) : isBusy && !cart ? (
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Cargando carrito...</p>
        </article>
      ) : !cart || items.length === 0 ? (
        <CartEmptyState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-4">
            {viewItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onIncrement={(id) => void handleIncrement(id)}
                onDecrement={(id) => void handleDecrement(id)}
                onRemove={(id) => void handleRemove(id)}
              />
            ))}
          </div>

          <CartSummaryCard
            lines={summaryLines}
            cta={
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Ir al checkout
              </Link>
            }
            footer="Puedes ajustar cantidades desde esta pantalla antes de confirmar la compra."
          />
        </div>
      )}
    </section>
  );
}
