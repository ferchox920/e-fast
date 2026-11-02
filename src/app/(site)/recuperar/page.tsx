'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import {
  useConfirmPasswordResetMutation,
  useRequestPasswordResetMutation,
} from '@/store/api/authApi';

const extractErrorMessage = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return 'No pudimos procesar la solicitud. Intenta nuevamente.';
  }
  if ('status' in error) {
    const fetchError = error as FetchBaseQueryError & { data?: unknown };
    const detail =
      fetchError.data &&
      typeof fetchError.data === 'object' &&
      'detail' in fetchError.data &&
      typeof fetchError.data.detail === 'string'
        ? fetchError.data.detail
        : null;
    return detail ?? 'El enlace no es valido o expiro.';
  }
  return 'No pudimos procesar la solicitud. Intenta nuevamente.';
};

export default function PasswordRecoveryPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token')?.trim() ?? '';
  const isConfirmMode = token.length > 0;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [requestPasswordReset, requestState] = useRequestPasswordResetMutation();
  const [confirmPasswordReset, confirmState] = useConfirmPasswordResetMutation();

  const isBusy = requestState.isLoading || confirmState.isLoading;
  const isSubmitDisabled = useMemo(() => {
    if (isBusy) return true;
    if (isConfirmMode) {
      return password.length < 8 || password !== confirmPassword;
    }
    return email.trim().length === 0;
  }, [confirmPassword, email, isBusy, isConfirmMode, password]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    try {
      if (isConfirmMode) {
        if (password !== confirmPassword) {
          setErrorMessage('Las contrasenas no coinciden.');
          return;
        }
        await confirmPasswordReset({ token, new_password: password }).unwrap();
        setMessage('Contrasena actualizada. Ya puedes iniciar sesion.');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      await requestPasswordReset({ email: email.trim() }).unwrap();
      setMessage('Si el email existe, enviaremos instrucciones para recuperar el acceso.');
      setEmail('');
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    }
  };

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-4 py-12">
      <section className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {isConfirmMode ? 'Crear nueva contrasena' : 'Recuperar acceso'}
          </h1>
          <p className="text-sm leading-6 text-neutral-600">
            {isConfirmMode
              ? 'Ingresa una nueva contrasena para cerrar el proceso de recuperacion.'
              : 'Escribe tu email y te enviaremos un enlace para restablecer tu contrasena.'}
          </p>
        </header>

        {message ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isConfirmMode ? (
            <>
              <label className="block space-y-1 text-sm text-neutral-700">
                <span>Nueva contrasena</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-neutral-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Minimo 8 caracteres"
                />
              </label>
              <label className="block space-y-1 text-sm text-neutral-700">
                <span>Confirmar contrasena</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-neutral-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Repite tu contrasena"
                />
              </label>
            </>
          ) : (
            <label className="block space-y-1 text-sm text-neutral-700">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-neutral-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="tu@email.com"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy
              ? 'Procesando...'
              : isConfirmMode
                ? 'Actualizar contrasena'
                : 'Enviar enlace'}
          </button>
        </form>

        <Link href="/login" className="block text-center text-sm font-semibold text-indigo-600">
          Volver a login
        </Link>
      </section>
    </main>
  );
}
