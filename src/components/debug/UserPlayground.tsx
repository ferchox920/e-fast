'use client';

import { useState } from 'react';
import {
  useLoginMutation,
  useRefreshMutation,
  useRequestVerifyEmailMutation,
} from '@/store/api/authApi';
import { useRegisterMutation, useLazyMeQuery } from '@/store/api/usersApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setToken, setRefreshToken, setUser, clearUser } from '@/store/slices/userSlice';

// ⛔️ Quitar este import roto:
// import { isFetchBaseQueryError } from '@reduxjs/toolkit/query';

// ✅ En su lugar, importamos SOLO el tipo y creamos un type guard local
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

function isFetchBaseQueryError(err: unknown): err is FetchBaseQueryError {
  return typeof err === 'object' && err !== null && 'status' in err;
}

export default function UserPlayground() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.user.current);
  const token = useAppSelector((s) => s.user.token);
  const refreshTok = useAppSelector((s) => s.user.refresh_token ?? null);

  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [register, { isLoading: registering, error: registerError }] = useRegisterMutation();
  const [login, { isLoading: loggingIn, error: loginError }] = useLoginMutation();
  const [refresh, { isLoading: refreshing, error: refreshError }] = useRefreshMutation();
  const [requestVerify, { isLoading: requesting, error: verifyError }] =
    useRequestVerifyEmailMutation();

  // Lazy query para /users/me
  const [fetchMe, { isFetching: fetchingMe }] = useLazyMeQuery();

  const doRegister = async () => {
    try {
      await register({
        email: regEmail,
        password: regPassword,
        full_name: regName || null,
      }).unwrap();

      const res = await login({ email: regEmail, password: regPassword }).unwrap();
      dispatch(setToken(res.access_token));
      dispatch(setRefreshToken(res.refresh_token));
      dispatch(setUser(res.user));

      const me = await fetchMe().unwrap();
      dispatch(setUser(me));

      alert('Usuario creado y logueado ✅');
    } catch (e) {
      handleRtkError(e, 'register/login');
    }
  };

  const doLogin = async () => {
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setToken(res.access_token));
      dispatch(setRefreshToken(res.refresh_token));
      dispatch(setUser(res.user));

      const me = await fetchMe().unwrap();
      dispatch(setUser(me));
    } catch (e) {
      handleRtkError(e, 'login/fetchMe');
    }
  };

  const doRefresh = async () => {
    if (!refreshTok) return;
    try {
      const res = await refresh({ refresh_token: refreshTok }).unwrap();
      dispatch(setToken(res.access_token));

      const me = await fetchMe().unwrap();
      dispatch(setUser(me));
    } catch (e) {
      handleRtkError(e, 'refresh/fetchMe');
    }
  };

  const doRequestVerify = async () => {
    try {
      await requestVerify({ email: user?.email ?? email ?? '' }).unwrap();
      alert('Solicitud de verificación enviada (si el email existe).');
    } catch (e) {
      handleRtkError(e, 'request-verify');
    }
  };

  const doLogout = () => dispatch(clearUser());

  return (
    <section className="space-y-6 border rounded-xl p-4">
      <h2 className="text-xl font-semibold">User Playground</h2>

      {/* Registro */}
      <div className="space-y-2">
        <h3 className="font-semibold">Registro</h3>
        <div className="grid gap-2 sm:grid-cols-4">
          <input
            className="border px-3 py-2 rounded"
            placeholder="nombre (opcional)"
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded"
            placeholder="email"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="border px-3 py-2 rounded"
            placeholder="password"
            type="password"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            autoComplete="new-password"
          />
          <button
            onClick={doRegister}
            disabled={registering}
            className="border px-3 py-2 rounded hover:bg-neutral-50"
          >
            {registering ? 'Creando…' : 'Crear + Login'}
          </button>
        </div>
        {registerError && (
          <pre className="text-red-600 text-xs overflow-auto">
            {JSON.stringify(registerError, null, 2)}
          </pre>
        )}
      </div>

      {/* Login */}
      <div className="space-y-2">
        <h3 className="font-semibold">Login</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            className="border px-3 py-2 rounded"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <input
            className="border px-3 py-2 rounded"
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            onClick={doLogin}
            disabled={loggingIn || fetchingMe}
            className="border px-3 py-2 rounded hover:bg-neutral-50"
          >
            {loggingIn || fetchingMe ? 'Entrando…' : 'Login'}
          </button>
        </div>
        {loginError && (
          <pre className="text-red-600 text-xs overflow-auto">
            {JSON.stringify(loginError, null, 2)}
          </pre>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={doRefresh}
          disabled={!refreshTok || refreshing || fetchingMe}
          className="border px-3 py-2 rounded"
        >
          {refreshing || fetchingMe ? 'Refrescando…' : 'Refresh access token'}
        </button>
        <button
          onClick={doRequestVerify}
          disabled={requesting}
          className="border px-3 py-2 rounded"
        >
          {requesting ? 'Enviando…' : 'Request verify email'}
        </button>
        <button onClick={doLogout} className="border px-3 py-2 rounded">
          Logout
        </button>
      </div>

      {/* Estado */}
      <div className="space-y-1 text-sm">
        <div>
          <span className="font-mono text-xs">access_token:</span>{' '}
          <code className="break-all">{token ?? '-'}</code>
        </div>
        <div>
          <span className="font-mono text-xs">refresh_token:</span>{' '}
          <code className="break-all">{refreshTok ?? '-'}</code>
        </div>
      </div>

      <div className="border-t pt-3">
        <h3 className="font-semibold mb-2">User</h3>
        <pre className="text-xs overflow-auto">{JSON.stringify(user ?? null, null, 2)}</pre>
      </div>

      {(refreshError || verifyError) && (
        <pre className="text-red-600 text-xs overflow-auto">
          {JSON.stringify(refreshError ?? verifyError, null, 2)}
        </pre>
      )}
    </section>
  );
}

function handleRtkError(e: unknown, where: string) {
  if (isFetchBaseQueryError(e)) {
    const status = 'status' in e ? e.status : 'unknown';
    const data = 'data' in e ? (e as FetchBaseQueryError & { data?: unknown }).data : null;
    console.warn(`RTKQ error @ ${where}`, { status, data });
    alert(`Error ${String(status)}: ${JSON.stringify(data)}`);
  } else {
    console.warn(`Unknown error @ ${where}`, e);
    alert('Error inesperado. Ver consola.');
  }
}
