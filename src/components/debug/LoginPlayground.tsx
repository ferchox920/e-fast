'use client';

import { useMemo, useState } from 'react';
import LoginLayout, { type LoginTheme } from '@/components/login/LoginLayout';
import LoginHero from '@/components/login/LoginHero';
import LoginForm from '@/components/login/LoginForm';

const ERROR_MESSAGE =
  'Las credenciales no son correctas. Intenta nuevamente o recupera tu contraseña.';

export default function LoginPlayground() {
  const [email, setEmail] = useState('demo@myapp.test');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [theme, setTheme] = useState<LoginTheme>('light');

  const isSubmitDisabled = useMemo(
    () => isLoading || email.trim().length === 0 || password.trim().length === 0,
    [email, password, isLoading],
  );

  const socialButtons = useMemo(
    () => [
      { label: 'Google', onClick: () => setShowError(false) },
      { label: 'Facebook', onClick: () => setShowError(false) },
    ],
    [],
  );

  const handleSubmit = () => {
    setShowError(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1200);
  };

  return (
    <section className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Login Playground</h1>
        <p className="text-sm text-neutral-600">
          Experimenta con el flujo de inicio de sesión: estados de carga, errores y variantes de
          estilo. Usa los controles para simular escenarios frecuentes antes de implementar la
          página real.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
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
              errorMessage={showError ? ERROR_MESSAGE : null}
              isSubmitDisabled={isSubmitDisabled}
              socialButtons={socialButtons}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onRememberMeChange={setRememberMe}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
              onSubmit={handleSubmit}
            />
          }
        />

        <aside className="flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-neutral-800">Controles</h2>
            <p className="text-xs text-neutral-500">
              Ajusta el estado del formulario para validar la experiencia de usuario antes de
              conectarlo a la API real.
            </p>
          </div>

          <label className="flex items-center justify-between text-sm text-neutral-700">
            Estado de carga
            <input
              type="checkbox"
              checked={isLoading}
              onChange={(event) => setIsLoading(event.target.checked)}
              className="rounded border-neutral-300 text-indigo-500 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between text-sm text-neutral-700">
            Mostrar error de credenciales
            <input
              type="checkbox"
              checked={showError}
              onChange={(event) => setShowError(event.target.checked)}
              className="rounded border-neutral-300 text-indigo-500 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between text-sm text-neutral-700">
            Mostrar contraseña
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              className="rounded border-neutral-300 text-indigo-500 focus:ring-indigo-500"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-semibold text-neutral-800">Tema</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  theme === 'light'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                Claro
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                Oscuro
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-semibold text-neutral-800">Acciones rápidas</span>
            <div className="grid gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setShowError(false);
                  setTimeout(() => setIsLoading(false), 1500);
                }}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-left transition hover:border-neutral-300"
              >
                Simular login exitoso
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(false);
                  setShowError(true);
                  setPassword('');
                }}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-left transition hover:border-neutral-300"
              >
                Simular error de credenciales
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
