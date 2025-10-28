'use client';

import { useEffect, useState } from 'react';
import {
  useLoginMutation,
  useRefreshMutation,
  useRequestVerifyEmailMutation,
} from '@/store/api/authApi';
import { useRegisterMutation, useLazyMeQuery, useUpdateMeMutation } from '@/store/api/usersApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setSession,
  updateAccessToken,
  setUser,
  clearUser,
  createEmptySession,
} from '@/store/slices/userSlice';

// ⛔️ Quitar este import roto:
// import { isFetchBaseQueryError } from '@reduxjs/toolkit/query';

// ✅ En su lugar, importamos SOLO el tipo y creamos un type guard local
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { UserRead, UserUpdate } from '@/types/user';

function isFetchBaseQueryError(err: unknown): err is FetchBaseQueryError {
  return typeof err === 'object' && err !== null && 'status' in err;
}

type ProfileFieldKey = keyof UserUpdate;
type ProfileFormState = Record<ProfileFieldKey, string>;

type ProfileFieldDefinition = {
  key: ProfileFieldKey;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
};

const blankProfileForm: ProfileFormState = {
  full_name: '',
  birthdate: '',
  avatar_url: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  phone: '',
};

const profileFieldDefinitions: ReadonlyArray<ProfileFieldDefinition> = [
  { key: 'full_name', label: 'Nombre completo', autoComplete: 'name' },
  { key: 'birthdate', label: 'Fecha de nacimiento', type: 'date' },
  { key: 'avatar_url', label: 'Avatar URL', type: 'url', autoComplete: 'url' },
  { key: 'address_line1', label: 'Dirección línea 1', autoComplete: 'address-line1' },
  { key: 'address_line2', label: 'Dirección línea 2', autoComplete: 'address-line2' },
  { key: 'city', label: 'Ciudad', autoComplete: 'address-level2' },
  { key: 'state', label: 'Estado / Provincia', autoComplete: 'address-level1' },
  { key: 'postal_code', label: 'Código postal', autoComplete: 'postal-code' },
  { key: 'country', label: 'País', autoComplete: 'country-name' },
  { key: 'phone', label: 'Teléfono', type: 'tel', autoComplete: 'tel' },
];

export default function UserPlayground() {
  const dispatch = useAppDispatch();
  const userState = useAppSelector((s) => s.user);
  const user = userState?.current ?? null;
  const session = userState?.session ?? createEmptySession();
  const status = userState?.status ?? (user ? 'authenticated' : 'idle');
  const token = session.accessToken;
  const refreshTok = session.refreshToken ?? null;
  const accessExpiresAt = session.expiresAt ? new Date(session.expiresAt).toISOString() : null;
  const scopes = session.scopes;

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
  const [updateProfile, { isLoading: updatingProfile, error: updateError }] = useUpdateMeMutation();

  const [profileForm, setProfileForm] = useState<ProfileFormState>(() => ({ ...blankProfileForm }));

  useEffect(() => {
    if (!user) {
      setProfileForm({ ...blankProfileForm });
      return;
    }
    setProfileForm(toProfileFormValues(user));
  }, [user]);

  const doRegister = async () => {
    try {
      await register({
        email: regEmail,
        password: regPassword,
        full_name: regName || null,
      }).unwrap();

      const res = await login({ email: regEmail, password: regPassword }).unwrap();
      dispatch(
        setSession({
          accessToken: res.access_token,
          refreshToken: res.refresh_token,
          tokenType: res.token_type,
          expiresIn: res.expires_in,
          scopes: res.scopes ?? null,
          issuedAt: Date.now(),
        }),
      );
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
      dispatch(
        setSession({
          accessToken: res.access_token,
          refreshToken: res.refresh_token,
          tokenType: res.token_type,
          expiresIn: res.expires_in,
          scopes: res.scopes ?? null,
          issuedAt: Date.now(),
        }),
      );
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
      dispatch(
        updateAccessToken({
          accessToken: res.access_token,
          tokenType: res.token_type,
          expiresIn: res.expires_in,
          scopes: res.scopes ?? null,
          issuedAt: Date.now(),
        }),
      );

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

  const doUpdateProfile = async () => {
    if (!user) return;

    try {
      const payload = prepareUpdatePayload(profileForm);
      const updated = await updateProfile(payload).unwrap();
      dispatch(setUser(updated));
      setProfileForm(toProfileFormValues(updated));
      alert('Perfil actualizado ✅');
    } catch (e) {
      handleRtkError(e, 'update-profile');
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

      {/* Perfil */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex flex-wrap items-end gap-2">
          <h3 className="font-semibold">Perfil</h3>
          <span className="text-xs text-neutral-500">
            {user
              ? 'Edita y guarda los datos del usuario autenticado.'
              : 'Inicia sesión para editar tu perfil.'}
          </span>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {profileFieldDefinitions.map((field) => (
            <label key={field.key} className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{field.label}</span>
              <input
                type={field.type ?? 'text'}
                className="border px-3 py-2 rounded"
                value={profileForm[field.key]}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                disabled={!user || updatingProfile}
              />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={doUpdateProfile}
            disabled={!user || updatingProfile}
            className="border px-3 py-2 rounded hover:bg-neutral-50 disabled:opacity-60"
          >
            {updatingProfile ? 'Actualizando…' : 'Actualizar perfil'}
          </button>
          <button
            onClick={() =>
              setProfileForm(user ? toProfileFormValues(user) : { ...blankProfileForm })
            }
            disabled={!user || updatingProfile}
            className="border px-3 py-2 rounded hover:bg-neutral-50 disabled:opacity-60"
          >
            Restablecer
          </button>
        </div>
        {updateError && (
          <pre className="text-red-600 text-xs overflow-auto">
            {JSON.stringify(updateError, null, 2)}
          </pre>
        )}
      </div>

      {/* Estado */}
      <div className="space-y-1 text-sm">
        <div>
          <span className="font-mono text-xs">status:</span> <code>{status}</code>
        </div>
        <div>
          <span className="font-mono text-xs">token_type:</span>{' '}
          <code>{session.tokenType ?? '-'}</code>
        </div>
        <div>
          <span className="font-mono text-xs">access_token:</span>{' '}
          <code className="break-all">{token ?? '-'}</code>
        </div>
        <div>
          <span className="font-mono text-xs">refresh_token:</span>{' '}
          <code className="break-all">{refreshTok ?? '-'}</code>
        </div>
        <div>
          <span className="font-mono text-xs">expires_in:</span>{' '}
          <code>{session.expiresIn ?? '-'}</code>
        </div>
        <div>
          <span className="font-mono text-xs">expires_at:</span>{' '}
          <code className="break-all">{accessExpiresAt ?? '-'}</code>
        </div>
        <div>
          <span className="font-mono text-xs">scopes:</span>{' '}
          <code className="break-words">{scopes.length ? scopes.join(', ') : '-'}</code>
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

function toProfileFormValues(source: UserRead | UserUpdate | null | undefined): ProfileFormState {
  const next: ProfileFormState = { ...blankProfileForm };
  if (!source) return next;

  for (const { key } of profileFieldDefinitions) {
    const raw = source[key];
    next[key] = typeof raw === 'string' ? raw : '';
  }

  return next;
}

function prepareUpdatePayload(form: ProfileFormState): UserUpdate {
  const payload: Partial<Record<ProfileFieldKey, string | null>> = {};

  for (const { key } of profileFieldDefinitions) {
    const rawValue = form[key];
    const value = rawValue.trim();
    const sanitized = value === '' ? null : value;
    payload[key] = sanitized;
  }

  return payload as UserUpdate;
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
