'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import LoginLayout from './LoginLayout';
import LoginHero from './LoginHero';
import RegisterForm from './RegisterForm';
import { useRequestVerifyEmailMutation, useOauthConfigQuery, useOauthExchangeMutation } from '@/store/api/authApi';
import { useRegisterMutation } from '@/store/api/usersApi';

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
    throw new Error('Google OAuth solo esta disponible en el navegador.');
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
      reject(new Error('Google Identity Services no esta disponible.'));
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
          fail('Google no devolvio un token valido.');
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
        fail(`Google cancelo el prompt: ${notification.getSkippedReason?.() ?? 'desconocido'}.`);
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
      return 'Servicio temporalmente no disponible. Intenta mas tarde.';
    }

    return 'Revisa los datos e intenta nuevamente.';
  }

  return 'No pudimos procesar tu solicitud. Intenta de nuevo.';
}

export default function RegisterPageClient() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [requestVerifyEmail] = useRequestVerifyEmailMutation();
  const [oauthExchange, { isLoading: isOauthExchangeLoading }] = useOauthExchangeMutation();
  const { data: oauthConfig, isLoading: isOauthConfigLoading } = useOauthConfigQuery();

  const googleClientId = useMemo(() => {
    const providers = oauthConfig?.providers ?? [];
    const google = providers.find(
      (item) => String(item.provider).toLowerCase().trim() === 'google',
    );
    return google?.client_id ?? null;
  }, [oauthConfig]);

  const isSubmitting = isRegisterLoading || isOauthExchangeLoading || isGoogleLoading;

  const isSubmitDisabled = useMemo(() => {
    return (
      isSubmitting ||
      fullName.trim().length === 0 ||
      email.trim().length === 0 ||
      password.trim().length < 8 ||
      confirmPassword.trim().length < 8
    );
  }, [fullName, email, password, confirmPassword, isSubmitting]);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setErrorMessage('Las contrasenas no coinciden.');
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
      }).unwrap();

      try {
        await requestVerifyEmail({ email: email.trim() }).unwrap();
      } catch {
        // No bloquea el registro.
      }

      setSuccessMessage('Cuenta creada. Revisa tu email y luego inicia sesion.');
      router.replace(`/login?registered=1&email=${encodeURIComponent(email.trim())}`);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    }
  };

  const handleGoogleRegister = async () => {
    if (!googleClientId) {
      setErrorMessage('Google OAuth no esta configurado en el backend.');
      return;
    }
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsGoogleLoading(true);
      const idToken = await requestGoogleIdToken(googleClientId);
      await oauthExchange({
        provider: 'google',
        id_token: idToken,
        rememberMe,
      }).unwrap();
      router.replace('/');
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-neutral-900">Crear cuenta</h1>
        <p className="text-sm text-neutral-600">
          Registrate para gestionar pedidos, favoritos y notificaciones en tiempo real.
        </p>
      </header>

      <LoginLayout
        theme={theme}
        hero={
          <LoginHero
            title="Comienza con MyApp"
            subtitle="Crea tu cuenta en minutos y activa tu experiencia completa en la tienda."
            tips={[
              'Usa una contrasena robusta de al menos 8 caracteres.',
              'Confirma tu email para habilitar todas las funciones.',
              'Puedes ingresar con Google para acceso rapido.',
            ]}
          />
        }
        form={
          <RegisterForm
            fullName={fullName}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            rememberMe={rememberMe}
            isLoading={isSubmitting}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            errorMessage={errorMessage}
            successMessage={successMessage}
            isSubmitDisabled={isSubmitDisabled}
            socialButtons={[
              {
                label: isGoogleLoading ? 'Conectando Google...' : 'Google',
                onClick: handleGoogleRegister,
                disabled: isOauthConfigLoading || !googleClientId || isSubmitting,
              },
            ]}
            onFullNameChange={setFullName}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onRememberMeChange={setRememberMe}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
            onToggleConfirmPassword={() => setShowConfirmPassword((prev) => !prev)}
            onSubmit={handleRegister}
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
