'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import LoginLayout from './LoginLayout';
import LoginHero from './LoginHero';
import LoginForm from './LoginForm';
import {
  useLoginMutation,
  useOauthConfigQuery,
  useOauthExchangeMutation,
} from '@/store/api/authApi';
import { useMergeGuestCartMutation } from '@/store/api/cartApi';
import { clearGuestToken, getGuestToken } from '@/lib/guestToken';

type GoogleCredentialResponse = {
  credential?: string;
};

type GooglePromptNotification = {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

const loadGoogleIdentityScript = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    throw new Error('Google OAuth solo está disponible en el navegador.');
  }
  if (window.google?.accounts?.id) {
    return;
  }
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services.'));
      document.head.appendChild(script);
    });
  }
  await googleScriptPromise;
};

const requestGoogleIdToken = async (clientId: string): Promise<string> => {
  await loadGoogleIdentityScript();

  return new Promise<string>((resolve, reject) => {
    const googleId = window.google?.accounts?.id;
    if (!googleId) {
      reject(new Error('Google Identity Services no está disponible.'));
      return;
    }

    let settled = false;
    const timeout = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('No se pudo completar el login con Google.'));
      }
    }, 15000);

    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error(message));
    };

    googleId.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => {
        if (settled) return;
        const token = response?.credential?.trim();
        if (!token) {
          fail('Google no devolvió un token válido.');
          return;
        }
        settled = true;
        clearTimeout(timeout);
        resolve(token);
      },
    });

    googleId.prompt((notification?: GooglePromptNotification) => {
      if (!notification || settled) return;
      if (notification.isNotDisplayed?.()) {
        fail(
          `Google no pudo mostrar el prompt: ${notification.getNotDisplayedReason?.() ?? 'desconocido'}.`,
        );
        return;
      }
      if (notification.isSkippedMoment?.()) {
        fail(`Google canceló el prompt: ${notification.getSkippedReason?.() ?? 'desconocido'}.`);
      }
    });
  });
};

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [login, { isLoading }] = useLoginMutation();
  const [oauthExchange, { isLoading: isOauthExchangeLoading }] = useOauthExchangeMutation();
  const [mergeGuestCart, { isLoading: isMergingGuestCart }] = useMergeGuestCartMutation();
  const { data: oauthConfig, isLoading: isOauthConfigLoading } = useOauthConfigQuery();

  const googleClientId = useMemo(() => {
    const providers = oauthConfig?.providers ?? [];
    const google = providers.find(
      (item) => String(item.provider).toLowerCase().trim() === 'google',
    );
    return google?.client_id ?? null;
  }, [oauthConfig]);

  const isSubmitting = isLoading || isOauthExchangeLoading || isGoogleLoading || isMergingGuestCart;

  const isSubmitDisabled = useMemo(
    () => isSubmitting || email.trim().length === 0 || password.trim().length === 0,
    [email, password, isSubmitting],
  );

  const redirectByRole = (user: { is_superuser?: boolean; role?: string | null } | null) => {
    const isAdminUser = user?.is_superuser === true || (user?.role ?? null) === 'admin';

    const requestedRedirect = searchParams?.get('redirect') ?? null;
    const normalizedRedirect =
      requestedRedirect && requestedRedirect.startsWith('/') ? requestedRedirect : null;

    const safeRedirect =
      normalizedRedirect && !isAdminUser && normalizedRedirect.startsWith('/admin')
        ? null
        : normalizedRedirect;

    const fallbackRoute = isAdminUser ? '/admin/dashboard' : '/';
    router.replace(safeRedirect ?? fallbackRoute);
  };

  const mergeGuestCartIfNeeded = async (isAdminUser: boolean) => {
    if (isAdminUser) return;
    const guestToken = getGuestToken();
    if (!guestToken) return;

    try {
      await mergeGuestCart({ guestToken }).unwrap();
      clearGuestToken();
    } catch {
      // El login no debe fallar si el carrito invitado ya expiro o fue convertido.
    }
  };

  const handleSubmit = async () => {
    try {
      setErrorMessage(null);
      const result = await login({ email: email.trim(), password, rememberMe }).unwrap();
      const user = (result.user as { is_superuser?: boolean; role?: string | null }) ?? null;
      const isAdminUser = user?.is_superuser === true || (user?.role ?? null) === 'admin';
      await mergeGuestCartIfNeeded(isAdminUser);
      redirectByRole(user);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleClientId) {
      setErrorMessage('Google OAuth no está configurado en el backend.');
      return;
    }

    try {
      setErrorMessage(null);
      setIsGoogleLoading(true);
      const idToken = await requestGoogleIdToken(googleClientId);
      const result = await oauthExchange({
        provider: 'google',
        id_token: idToken,
        rememberMe,
      }).unwrap();
      const user = (result.user as { is_superuser?: boolean; role?: string | null }) ?? null;
      const isAdminUser = user?.is_superuser === true || (user?.role ?? null) === 'admin';
      await mergeGuestCartIfNeeded(isAdminUser);
      redirectByRole(user);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="login-shell relative -mx-4 overflow-hidden bg-[var(--login-bg)] px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,rgba(200,135,77,0.24),transparent_52%),radial-gradient(circle_at_top_right,rgba(20,99,86,0.18),transparent_48%)]" />
      <div className="absolute inset-x-0 bottom-0 h-80 bg-[radial-gradient(circle_at_bottom_left,rgba(20,99,86,0.12),transparent_56%)]" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 [font-family:var(--font-sora)]">
        <header className="max-w-2xl space-y-4 py-4">
          <span className="inline-flex w-fit items-center rounded-full border border-[color:var(--login-line)] bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--login-accent)]">
            Acceso seguro
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl leading-tight font-semibold text-[var(--login-ink)] sm:text-5xl [font-family:var(--font-fraunces)]">
              Vuelve a tu cuenta y retoma tu compra sin fricción.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-[var(--login-muted)] sm:text-base">
              Diseñamos este acceso para sentirse más claro, más confiable y más alineado con una
              experiencia de producto real.
            </p>
          </div>
        </header>

        <LoginLayout
          hero={<LoginHero />}
          form={
            <LoginForm
              email={email}
              password={password}
              rememberMe={rememberMe}
              isLoading={isSubmitting}
              showPassword={showPassword}
              errorMessage={errorMessage}
              isSubmitDisabled={isSubmitDisabled}
              socialButtons={[
                {
                  label: isGoogleLoading ? 'Conectando con Google...' : 'Continuar con Google',
                  onClick: handleGoogleLogin,
                  disabled: isOauthConfigLoading || !googleClientId || isSubmitting,
                  icon: (
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--login-accent-soft)] text-sm font-bold text-[var(--login-accent)]">
                      G
                    </span>
                  ),
                },
              ]}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onRememberMeChange={setRememberMe}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
              onSubmit={handleSubmit}
            />
          }
        />

        <aside className="flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--login-muted)]">
          <span className="rounded-full border border-[color:var(--login-line)] bg-white/70 px-4 py-2">
            Historial siempre disponible
          </span>
          <span className="rounded-full border border-[color:var(--login-line)] bg-white/70 px-4 py-2">
            Recuperación inmediata
          </span>
          <span className="rounded-full border border-[color:var(--login-line)] bg-white/70 px-4 py-2">
            Seguimiento en tiempo real
          </span>
        </aside>
      </div>
    </div>
  );
}
