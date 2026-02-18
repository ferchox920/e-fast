'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import LoginLayout from './LoginLayout';
import LoginHero from './LoginHero';
import LoginForm from './LoginForm';
import { useLoginMutation } from '@/store/api/authApi';

function extractErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Ha ocurrido un error inesperado. Intenta nuevamente.';
  }

  if ('status' in error) {
    const fetchError = error as FetchBaseQueryError & { data?: unknown };
    const data = fetchError.data;

    if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
      return data.detail;
    }

    if (typeof fetchError.status === 'number' && fetchError.status >= 500) {
      return 'Servicio temporalmente no disponible. Intenta más tarde.';
    }

    return 'Revisa tus credenciales e intenta nuevamente.';
  }

  return 'No pudimos procesar tu solicitud. Intenta de nuevo.';
}

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [login, { isLoading }] = useLoginMutation();

  const isSubmitDisabled = useMemo(
    () => isLoading || email.trim().length === 0 || password.trim().length === 0,
    [email, password, isLoading],
  );

  const handleSubmit = async () => {
    try {
      setErrorMessage(null);
      const result = await login({ email: email.trim(), password, rememberMe }).unwrap();

      const isAdminUser =
        result.user?.is_superuser === true ||
        ((result.user as { role?: string | null })?.role ?? null) === 'admin';

      const requestedRedirect = searchParams?.get('redirect') ?? null;
      const normalizedRedirect =
        requestedRedirect && requestedRedirect.startsWith('/') ? requestedRedirect : null;

      const safeRedirect =
        normalizedRedirect && !isAdminUser && normalizedRedirect.startsWith('/admin')
          ? null
          : normalizedRedirect;

      const fallbackRoute = isAdminUser ? '/admin/dashboard' : '/';
      const targetRoute = safeRedirect ?? fallbackRoute;

      router.replace(targetRoute);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-neutral-900">Ingresar</h1>
        <p className="text-sm text-neutral-600">
          Usa tu email y contraseña para acceder a tu cuenta MyApp. Si todavía no tienes una, te
          ayudamos a crearla en minutos.
        </p>
      </header>

      <LoginLayout
        theme={theme}
        hero={<LoginHero />}
        form={
          <LoginForm
            email={email}
            password={password}
            rememberMe={rememberMe}
            isLoading={isLoading}
            showPassword={showPassword}
            errorMessage={errorMessage}
            isSubmitDisabled={isSubmitDisabled}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onRememberMeChange={setRememberMe}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
            onSubmit={handleSubmit}
          />
        }
      />

      <aside className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-neutral-800">Preferencias visuales</h2>
          <p className="text-xs text-neutral-500">
            Alterna el tema para validar el contraste y la legibilidad en ambos modos.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              theme === 'light'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            Tema claro
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            Tema oscuro
          </button>
        </div>
      </aside>
    </div>
  );
}
