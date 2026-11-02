'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';

export interface RegisterFormSocialButton {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface RegisterFormProps {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  rememberMe: boolean;
  isLoading?: boolean;
  showPassword?: boolean;
  showConfirmPassword?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  loginHref?: string;
  isSubmitDisabled?: boolean;
  socialButtons?: RegisterFormSocialButton[];
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onRememberMeChange: (value: boolean) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: () => void;
}

export default function RegisterForm({
  fullName,
  email,
  password,
  confirmPassword,
  rememberMe,
  isLoading = false,
  showPassword = false,
  showConfirmPassword = false,
  errorMessage = null,
  successMessage = null,
  loginHref = '/login',
  isSubmitDisabled = false,
  socialButtons,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onRememberMeChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onSubmit,
}: RegisterFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSubmitDisabled) {
      onSubmit();
    }
  };

  return (
    <>
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-semibold">Crea tu cuenta en MyApp</h3>
        <p className="text-sm text-neutral-500">Registrate con email o con Google para continuar.</p>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label htmlFor="register-fullname" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="register-fullname"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => onFullNameChange(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="Tu nombre"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="register-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="register-email"
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
            <label htmlFor="register-password">Contrasena</label>
            <button
              type="button"
              onClick={onTogglePassword}
              className="text-xs font-medium text-indigo-500 hover:text-indigo-600"
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="Minimo 8 caracteres"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm font-medium">
            <label htmlFor="register-confirm-password">Confirmar contrasena</label>
            <button
              type="button"
              onClick={onToggleConfirmPassword}
              className="text-xs font-medium text-indigo-500 hover:text-indigo-600"
            >
              {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <input
            id="register-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => onConfirmPasswordChange(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="Repite tu contrasena"
            disabled={isLoading}
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => onRememberMeChange(event.target.checked)}
            className="rounded border-neutral-300 text-indigo-500 focus:ring-indigo-400"
            disabled={isLoading}
          />
          Mantener sesion si ingreso con Google
        </label>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      {socialButtons && socialButtons.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-neutral-400">
            <span className="h-px flex-1 bg-neutral-200" />
            O continua con
            <span className="h-px flex-1 bg-neutral-200" />
          </div>
          <div className="flex gap-3">
            {socialButtons.map((button) => (
              <button
                key={button.label}
                type="button"
                onClick={button.onClick}
                disabled={isLoading || button.disabled}
                className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-neutral-500">
        Ya tienes cuenta?{' '}
        <Link href={loginHref} className="font-semibold text-indigo-500 hover:text-indigo-600">
          Ingresa aqui
        </Link>
      </p>
    </>
  );
}
