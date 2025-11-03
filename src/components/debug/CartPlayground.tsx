'use client';

import { useMemo, useState } from 'react';

import CartItemCard, { type CartItem } from '@/components/cart/CartItemCard';
import CartSummaryCard, { type CartSummaryLine } from '@/components/cart/CartSummaryCard';
import CartEmptyState from '@/components/cart/CartEmptyState';

type ThemeOption = 'light' | 'dark';

const baseItems: CartItem[] = [
  {
    id: 'sku-hoodie-black-m',
    name: 'Hoodie Essentials',
    variant: 'Negro - Talla M',
    price: 54.9,
    quantity: 1,
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=60',
    badge: 'Nuevo',
  },
  {
    id: 'sku-sneaker-blue-41',
    name: 'Sneaker AirFlux',
    variant: 'Azul - 41 EU',
    price: 89.5,
    quantity: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=60',
    note: 'Entrega estimada 2-3 dias',
  },
  {
    id: 'sku-bag-grey',
    name: 'Bolso CityPack',
    variant: 'Gris Urbano',
    price: 39.99,
    quantity: 1,
    imageUrl:
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=60',
  },
];

export default function CartPlayground() {
  const [items, setItems] = useState<CartItem[]>(baseItems);
  const [theme, setTheme] = useState<ThemeOption>('light');
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showEmptyState, setShowEmptyState] = useState(false);

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = subtotal > 120 ? 0 : subtotal > 0 ? 4.9 : 0;
    const discount = subtotal >= 150 ? subtotal * -0.1 : 0;
    const total = subtotal + shipping + discount;

    const lines: CartSummaryLine[] = [{ id: 'subtotal', label: 'Subtotal', value: subtotal }];
    if (shipping > 0) lines.push({ id: 'shipping', label: 'Envio estandar', value: shipping });
    if (shipping === 0 && subtotal > 0)
      lines.push({ id: 'shipping-free', label: 'Envio gratis', value: 0, type: 'discount' });
    if (discount !== 0)
      lines.push({ id: 'discount', label: 'Descuento promo', value: discount, type: 'discount' });
    lines.push({ id: 'total', label: 'Total', value: total, type: 'total' });
    return lines;
  }, [items]);

  const handleIncrement = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)),
    );
  };

  const handleDecrement = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item,
      ),
    );
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const resetCart = () => {
    setItems(baseItems);
    setShowEmptyState(false);
  };

  return (
    <section className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Cart Playground</h1>
        <p className="text-sm text-neutral-600">
          Visualiza el flujo del carrito y prueba distintos escenarios: cantidades, descuentos, tema
          oscuro y estados vacios.
        </p>
      </header>

      <div
        className={`grid gap-6 lg:grid-cols-[minmax(0,1fr)_350px] ${theme === 'dark' ? 'bg-neutral-900 text-neutral-100 p-6 rounded-3xl shadow-inner' : ''}`}
      >
        <div className="space-y-4">
          {showEmptyState ? (
            <CartEmptyState
              cta={
                <button
                  type="button"
                  onClick={resetCart}
                  className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
                >
                  Recuperar items demo
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}

          {showRecommendations && !showEmptyState && (
            <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-neutral-900">Recomendaciones</h2>
              <p className="text-xs text-neutral-500">
                Sugiere productos relacionados para aumentar el ticket promedio.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {['Calcetines performance', 'Gorra Classic', 'Botella termica'].map((name) => (
                  <div
                    key={name}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
                  >
                    {name}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <CartSummaryCard
            lines={totals}
            cta={
              <button
                type="button"
                className="w-full rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={showEmptyState || items.length === 0}
              >
                Proceder al checkout
              </button>
            }
            footer={
              <span>
                Tienes un cupon? Aplica el codigo <strong>MYAPP10</strong> en el siguiente paso.
              </span>
            }
          />

          <aside className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-900">Controles</h2>
            <div className="mt-3 space-y-2 text-sm text-neutral-700">
              <label className="flex items-center justify-between">
                Tema oscuro
                <input
                  type="checkbox"
                  checked={theme === 'dark'}
                  onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')}
                  className="rounded border-neutral-300 text-indigo-500 focus:ring-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between">
                Mostrar recomendaciones
                <input
                  type="checkbox"
                  checked={showRecommendations}
                  onChange={(event) => setShowRecommendations(event.target.checked)}
                  className="rounded border-neutral-300 text-indigo-500 focus:ring-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between">
                Mostrar estado vacio
                <input
                  type="checkbox"
                  checked={showEmptyState}
                  onChange={(event) => setShowEmptyState(event.target.checked)}
                  className="rounded border-neutral-300 text-indigo-500 focus:ring-indigo-500"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <button
                type="button"
                onClick={resetCart}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-left transition hover:border-neutral-300"
              >
                Restaurar carrito demo
              </button>
              <button
                type="button"
                onClick={() => setItems([])}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-left transition hover:border-neutral-300"
              >
                Vaciar carrito
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
