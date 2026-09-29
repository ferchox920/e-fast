'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useListWishesQuery, useDeleteWishMutation } from '@/store/api/wishesApi';
import { apiErrorMessage } from '@/lib/apiError';

export default function WishesPage() {
  const token = useAppSelector((state) => state.user.session.accessToken);
  const {
    data: wishes = [],
    isLoading,
    error,
    refetch,
  } = useListWishesQuery(undefined, { skip: !token });
  const [deleteWish, { isLoading: removing }] = useDeleteWishMutation();
  const [message, setMessage] = useState('');
  if (!token)
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p>Ingresa para consultar tu lista de deseos.</p>
        <Link href="/login" className="underline">
          Ingresar
        </Link>
      </main>
    );
  const remove = async (wishId: string, productId: string) => {
    try {
      setMessage('');
      await deleteWish({ wishId, productId }).unwrap();
    } catch (failure) {
      setMessage(apiErrorMessage(failure));
    }
  };
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-8">
      <h1 className="text-2xl font-semibold">Lista de deseos</h1>
      {isLoading && <p role="status">Cargando deseos…</p>}
      {error && (
        <div role="alert">
          <p>{apiErrorMessage(error)}</p>
          <button type="button" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      )}
      {!isLoading && !error && wishes.length === 0 && <p>Tu lista está vacía.</p>}
      <ul className="divide-y">
        {wishes.map((wish, index) => (
          <li key={wish.id} className="flex justify-between gap-4 py-4">
            <span>Producto guardado {index + 1}</span>
            <button
              type="button"
              disabled={removing}
              onClick={() => remove(String(wish.id), String(wish.product_id))}
              className="underline"
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
      {message && <p role="alert">{message}</p>}
    </main>
  );
}
