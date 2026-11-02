'use client';

import Link from 'next/link';
import type { FormEvent, ReactNode } from 'react';

export interface LoginFormSocialButton {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
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
      <div className="space-y-3">
        <span className="inline-flex w-fit items-center rounded-full border border-[color:var(--login-line)] bg-[var(--login-accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--login-accent)]">
          Clientes MyApp
        </span>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-[var(--login-ink)]">Ingresa a tu cuenta</h3>
          <p className="max-w-sm text-sm leading-6 text-[var(--login-muted)]">
            Continúa con tu email o accede con Google para retomar pedidos, favoritos y beneficios.
          </p>
        </div>
      </div>

      <div className="rounded-[24px] border border-[color:var(--login-line)] bg-white/72 p-4 text-sm text-[var(--login-muted)] shadow-[0_18px_40px_rgba(31,42,36,0.05)]">
        <p className="font-semibold text-[var(--login-ink)]">Acceso seguro y rápido</p>
        <p className="mt-1 leading-6">
          Tu sesión mantiene protegidos tus datos y te devuelve exactamente al flujo que dejaste.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="login-email"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--login-muted)]"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="w-full rounded-[20px] border border-[color:var(--login-line)] bg-white px-4 py-3 text-sm text-[var(--login-ink)] shadow-[0_10px_30px_rgba(31,42,36,0.04)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--login-accent)] focus:ring-4 focus:ring-[color:var(--login-accent-soft)]"
            placeholder="tu@email.com"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="login-password"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--login-muted)]"
            >
              Contraseña
            </label>
            <button
              type="button"
              onClick={onTogglePassword}
              className="rounded-full border border-[color:var(--login-line)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--login-accent)] transition hover:border-[var(--login-accent)] hover:bg-[var(--login-accent-soft)]"
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
            className="w-full rounded-[20px] border border-[color:var(--login-line)] bg-white px-4 py-3 text-sm text-[var(--login-ink)] shadow-[0_10px_30px_rgba(31,42,36,0.04)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--login-accent)] focus:ring-4 focus:ring-[color:var(--login-accent-soft)]"
            placeholder="********"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="inline-flex items-center gap-3 text-[var(--login-muted)]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => onRememberMeChange(event.target.checked)}
              className="rounded border-neutral-300 text-[var(--login-accent)] focus:ring-[var(--login-accent)]"
              disabled={isLoading}
            />
            Recordarme
          </label>
          <Link
            href={forgotPasswordHref}
            className="font-semibold text-[var(--login-accent)] transition hover:text-[var(--login-accent-strong)]"
          >
            Olvidé mi contraseña
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full rounded-[20px] bg-[var(--login-accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(20,99,86,0.28)] transition hover:bg-[var(--login-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      {socialButtons && socialButtons.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--login-muted)]">
            <span className="h-px flex-1 bg-[color:var(--login-line)]" />
            O continúa con
            <span className="h-px flex-1 bg-[color:var(--login-line)]" />
          </div>
          <div className="grid gap-3">
            {socialButtons.map((button) => (
              <button
                key={button.label}
                type="button"
                onClick={button.onClick}
                disabled={isLoading || button.disabled}
                className="inline-flex items-center justify-center gap-3 rounded-[18px] border border-[color:var(--login-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--login-ink)] shadow-[0_12px_30px_rgba(31,42,36,0.04)] transition hover:border-[var(--login-accent)] hover:bg-[var(--login-accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {button.icon ?? (
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--login-accent-soft)] text-sm font-bold text-[var(--login-accent)]">
                    {button.label.charAt(0)}
                  </span>
                )}
                {button.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs leading-6 text-[var(--login-muted)]">
        ¿Eres nuevo?{' '}
        <Link
          href={registerHref}
          className="font-semibold text-[var(--login-accent)] transition hover:text-[var(--login-accent-strong)]"
        >
          Crea una cuenta
        </Link>
      </p>
    </>
  );
}
