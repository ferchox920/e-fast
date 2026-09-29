'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} from '@/store/api/cartApi';
import { useCreateOrderFromCartMutation } from '@/store/api/ordersApi';
import { useListActivePromotionsQuery } from '@/store/api/promotionsApi';
import { useAppSelector } from '@/store/hooks';
import { getOrCreateGuestToken } from '@/lib/guestToken';
import { apiErrorMessage } from '@/lib/apiError';

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(value);

export default function CartPage() {
  const router = useRouter();
  const token = useAppSelector((state) => state.user.session.accessToken);
  const { data: cart, isLoading, isError, error, refetch } = useGetCartQuery();
  const { data: promotions = [] } = useListActivePromotionsQuery();
  const [updateItem, { isLoading: updating }] = useUpdateCartItemMutation();
  const [removeItem, { isLoading: removing }] = useRemoveCartItemMutation();
  const [checkout, { isLoading: checkingOut }] = useCreateOrderFromCartMutation();
  const [promotionId, setPromotionId] = useState('');
  const [message, setMessage] = useState('');
  const [guestOrderId, setGuestOrderId] = useState('');

  const changeQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      setMessage('');
      await updateItem({ itemId, quantity }).unwrap();
    } catch (failure) {
      setMessage(apiErrorMessage(failure));
    }
  };

  const remove = async (itemId: string) => {
    try {
      setMessage('');
      await removeItem({ itemId }).unwrap();
    } catch (failure) {
      setMessage(apiErrorMessage(failure));
    }
  };

  const createOrder = async () => {
    try {
      setMessage('');
      const result = await checkout({
        ...(token ? {} : { guest_token: getOrCreateGuestToken() }),
        ...(promotionId ? { promotion_id: promotionId } : {}),
      }).unwrap();
      if (token) router.push(`/orders/${result.id}`);
      else setGuestOrderId(String(result.id));
    } catch (failure) {
      setMessage(apiErrorMessage(failure));
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Carrito</h1>
      {isLoading && <p role="status">Cargando carrito…</p>}
      {isError && !cart && (
        <div role="alert" className="space-y-2">
          <p>
            {error && typeof error === 'object' && 'status' in error && error.status === 404
              ? 'Tu carrito está vacío.'
              : apiErrorMessage(error)}
          </p>
          <button type="button" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      )}
      {cart && cart.items.length === 0 && (
        <p>
          Tu carrito está vacío.{' '}
          <Link href="/products" className="underline">
            Explorar productos
          </Link>
        </p>
      )}
      {cart && cart.items.length > 0 && (
        <>
          <ul className="divide-y rounded-lg border">
            {cart.items.map((item, index) => (
              <li key={item.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">Artículo {index + 1}</p>
                  <p>{money(item.line_total, cart.currency)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={updating || item.quantity <= 1}
                    onClick={() => changeQuantity(String(item.id), item.quantity - 1)}
                    aria-label={`Reducir cantidad de artículo ${index + 1}`}
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => changeQuantity(String(item.id), item.quantity + 1)}
                    aria-label={`Aumentar cantidad de artículo ${index + 1}`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    disabled={removing}
                    onClick={() => remove(String(item.id))}
                    className="underline"
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <label className="block">
            Promoción
            <select
              className="ml-2 rounded border p-2"
              value={promotionId}
              onChange={(event) => setPromotionId(event.target.value)}
            >
              <option value="">Sin promoción</option>
              {promotions.map((promotion) => (
                <option key={promotion.id} value={promotion.id}>
                  {promotion.name}
                </option>
              ))}
            </select>
          </label>
          <p className="font-semibold">
            Total actual del carrito: {money(cart.total_amount, cart.currency)}
          </p>
          <p className="text-sm text-neutral-600">
            El pedido y cualquier descuento se calcularán nuevamente en el servidor.
          </p>
          <button
            type="button"
            disabled={checkingOut}
            onClick={createOrder}
            className="rounded bg-indigo-600 px-5 py-2 text-white disabled:opacity-50"
          >
            {checkingOut ? 'Creando pedido…' : 'Crear pedido'}
          </button>
        </>
      )}
      {message && (
        <p role="alert" className="text-red-700">
          {message}
        </p>
      )}
      {guestOrderId && (
        <div role="status">
          <p>Pedido invitado creado: {guestOrderId}</p>
          <p>
            Guarda este identificador. Para consultar pedidos desde la cuenta debes ingresar antes
            de comprar.
          </p>
        </div>
      )}
    </main>
  );
}
