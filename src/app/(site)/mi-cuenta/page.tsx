'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useMeQuery, useUpdateMeMutation } from '@/store/api/usersApi';
import { apiErrorMessage } from '@/lib/apiError';

export default function AccountPage() {
  const token = useAppSelector((state) => state.user.session.accessToken);
  const { data: user, isLoading, error, refetch } = useMeQuery(undefined, { skip: !token });
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  if (!token)
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p>Ingresa para consultar tu cuenta.</p>
        <Link href="/login" className="underline">
          Ingresar
        </Link>
      </main>
    );
  const save = async () => {
    try {
      setMessage('');
      await updateMe({ full_name: name.trim() }).unwrap();
      setMessage('Perfil actualizado.');
    } catch (failure) {
      setMessage(apiErrorMessage(failure));
    }
  };
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-8">
      <h1 className="text-2xl font-semibold">Mi cuenta</h1>
      {isLoading && (
        <p aria-live="polite" aria-atomic="true">
          Cargando perfil…
        </p>
      )}
      {error && (
        <div role="alert">
          <p>{apiErrorMessage(error)}</p>
          <button type="button" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      )}
      {user && (
        <>
          <p>Email: {user.email}</p>
          <p>Nombre: {user.full_name ?? 'Sin nombre'}</p>
          <label className="block">
            Actualizar nombre
            <input
              className="ml-2 rounded border p-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={save}
            className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Guardar
          </button>
        </>
      )}
      {message && (
        <p aria-live="polite" aria-atomic="true">
          {message}
        </p>
      )}
    </main>
  );
}
