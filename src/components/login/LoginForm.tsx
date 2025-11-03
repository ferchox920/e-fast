'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';

export interface LoginFormSocialButton {
  label: string;
  onClick?: () => void;
}

export interface LoginFormProps {
  email: string;
  password: string;
  rememberMe: boolean;
  isLoading?: boolean;
  showPassword?: boolean;
  errorMessage?: string | null;
  forgotPasswordHref?: string;
  registerHref?: string;
  isSubmitDisabled?: boolean;
  socialButtons?: LoginFormSocialButton[];
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberMeChange: (value: boolean) => void;
  onTogglePassword: () => void;
  onSubmit: () => void;
}

export default function LoginForm({
  email,
  password,
  rememberMe,
  isLoading = false,
  showPassword = false,
  errorMessage = null,
  forgotPasswordHref = '/recuperar',
  registerHref = '/registro',
  isSubmitDisabled = false,
  socialButtons,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onTogglePassword,
  onSubmit,
}: LoginFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSubmitDisabled) {
      onSubmit();
    }
  };

  return (
    <>
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-semibold">Inicia sesión en MyApp</h3>
        <p className="text-sm text-neutral-500">
          Usa tus credenciales o las opciones sociales para continuar.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label htmlFor="login-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="tu@email.com"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm font-medium">
            <label htmlFor="login-password">Contraseña</label>
            <button
              type="button"
              onClick={onTogglePassword}
              className="text-xs font-medium text-indigo-500 hover:text-indigo-600"
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="********"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-neutral-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => onRememberMeChange(event.target.checked)}
              className="rounded border-neutral-300 text-indigo-500 focus:ring-indigo-400"
              disabled={isLoading}
            />
            Recordarme
          </label>
          <Link
            href={forgotPasswordHref}
            className="font-medium text-indigo-500 hover:text-indigo-600"
          >
            Olvidé mi contraseña
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      {socialButtons && socialButtons.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-neutral-400">
            <span className="h-px flex-1 bg-neutral-200" />
            O continúa con
            <span className="h-px flex-1 bg-neutral-200" />
          </div>
          <div className="flex gap-3">
            {socialButtons.map((button) => (
              <button
                key={button.label}
                type="button"
                onClick={button.onClick}
                className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-neutral-500">
        ¿Eres nuevo?{' '}
        <Link href={registerHref} className="font-semibold text-indigo-500 hover:text-indigo-600">
          Crea una cuenta
        </Link>
      </p>
    </>
  );
}
