'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  useClearExposureCacheMutation,
  useLazyGetExposureQuery,
  useRefreshExposureMutation,
} from '@/store/api/exposureApi';
import type { ExposureResponse, GetExposureParams } from '@/types/exposure';

type MessageState = {
  type: 'success' | 'error';
  text: string;
} | null;

const DEFAULT_CONTEXT = 'home';
const CONTEXT_OPTIONS = [
  { value: 'home', label: 'Home' },
  { value: 'category', label: 'Categoria' },
  { value: 'related', label: 'Relacionados' },
] as const;

const formatDateTime = (value: string) => {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const toErrorMessage = (error: unknown) => {
  if (!error) return 'No se pudo completar la accion.';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
      if ('detail' in data && typeof (data as { detail?: unknown }).detail === 'string') {
        return (data as { detail: string }).detail;
      }
      if ('message' in data && typeof (data as { message?: unknown }).message === 'string') {
        return (data as { message: string }).message;
      }
    }
    if ('status' in (error as Record<string, unknown>)) {
      return `Error ${String((error as { status?: unknown }).status)} en la solicitud.`;
    }
  }
  return 'No se pudo completar la accion.';
};

export default function AdminExposurePage() {
  const [context, setContext] = useState<string>(DEFAULT_CONTEXT);
  const [userId, setUserId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [limitValue, setLimitValue] = useState('20');
  const [latest, setLatest] = useState<ExposureResponse | null>(null);
  const [message, setMessage] = useState<MessageState>(null);
  const [lastParams, setLastParams] = useState<GetExposureParams | null>(null);

  const [getExposure, getExposureState] = useLazyGetExposureQuery();
  const [refreshExposure, refreshState] = useRefreshExposureMutation();
  const [clearExposureCache, clearState] = useClearExposureCacheMutation();

  const isBusy =
    getExposureState.isFetching || refreshState.isLoading || clearState.isLoading;

  const resolvedData = useMemo(
    () => latest ?? getExposureState.data ?? null,
    [latest, getExposureState.data],
  );

  const buildParams = (): GetExposureParams => {
    const normalizedLimit = Number.parseInt(limitValue, 10);
    return {
      context: context.trim() || DEFAULT_CONTEXT,
      user_id: userId.trim() || undefined,
      category_id: categoryId.trim() || undefined,
      limit: Number.isNaN(normalizedLimit) || normalizedLimit <= 0 ? undefined : normalizedLimit,
    };
  };

  const handleFetch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const params = buildParams();
    setLastParams(params);
    try {
      const response = await getExposure(params).unwrap();
      setLatest(response);
      setMessage({ type: 'success', text: 'Exposure cargado correctamente.' });
    } catch (error) {
      setMessage({ type: 'error', text: toErrorMessage(error) });
    }
  };

  const handleRefresh = async () => {
    setMessage(null);
    const params = lastParams ?? buildParams();
    setLastParams(params);
    try {
      const response = await refreshExposure(params).unwrap();
      setLatest(response);
      setMessage({ type: 'success', text: 'Exposure refrescado correctamente.' });
    } catch (error) {
      setMessage({ type: 'error', text: toErrorMessage(error) });
    }
  };

  const handleClearCache = async () => {
    setMessage(null);
    const params = lastParams ?? buildParams();
    try {
      await clearExposureCache({
        context: params.context,
        user_id: params.user_id,
        category_id: params.category_id,
      }).unwrap();
      setMessage({ type: 'success', text: 'Cache de exposure limpiada.' });
    } catch (error) {
      setMessage({ type: 'error', text: toErrorMessage(error) });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Exposure</h1>
        <p className="text-sm text-neutral-600">
          Consulta, refresca y limpia cache de exposicion por contexto.
        </p>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleFetch} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-neutral-500">
            Contexto
            <select
              value={context}
              onChange={(event) => setContext(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700"
              disabled={isBusy}
            >
              {CONTEXT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-neutral-500">
            User ID
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Opcional"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
              disabled={isBusy}
            />
          </label>

          <label className="text-xs font-medium text-neutral-500">
            Category ID
            <input
              type="text"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              placeholder="Opcional"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
              disabled={isBusy}
            />
          </label>

          <label className="text-xs font-medium text-neutral-500">
            Limite
            <input
              type="number"
              min={1}
              value={limitValue}
              onChange={(event) => setLimitValue(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
              disabled={isBusy}
            />
          </label>

          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-3">
            <p className="text-xs text-neutral-500">
              Tip: consulta primero y luego usa refresco/limpieza con los mismos parametros.
            </p>
            <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex h-10 min-w-[120px] items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {getExposureState.isFetching ? 'Consultando...' : 'Consultar'}
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isBusy || !lastParams}
              className="inline-flex h-10 min-w-[120px] items-center justify-center rounded-lg border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 disabled:opacity-60"
            >
              {refreshState.isLoading ? 'Refrescando...' : 'Refrescar'}
            </button>
            <button
              type="button"
              onClick={handleClearCache}
              disabled={isBusy || !lastParams}
              className="inline-flex h-10 min-w-[140px] items-center justify-center rounded-lg border border-rose-300 px-4 text-sm font-semibold text-rose-700 transition hover:border-rose-400 disabled:opacity-60"
            >
              {clearState.isLoading ? 'Limpiando...' : 'Limpiar cache'}
            </button>
            </div>
          </div>
        </form>
      </section>

      {message ? (
        <section
          className={`rounded-xl border p-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {message.text}
        </section>
      ) : null}

      {!resolvedData ? (
        <section className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 shadow-sm">
          Ejecuta una consulta para ver el mix de exposure.
        </section>
      ) : (
        <>
          <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="grid gap-2 text-sm text-neutral-700 sm:grid-cols-2 lg:grid-cols-4">
              <p>
                Contexto: <span className="font-semibold text-neutral-900">{resolvedData.context}</span>
              </p>
              <p>
                User ID:{' '}
                <span className="font-semibold text-neutral-900">
                  {resolvedData.user_id ?? '-'}
                </span>
              </p>
              <p>
                Category ID:{' '}
                <span className="font-semibold text-neutral-900">
                  {resolvedData.category_id ?? '-'}
                </span>
              </p>
              <p>
                Items: <span className="font-semibold text-neutral-900">{resolvedData.mix.length}</span>
              </p>
              <p>Generado: {formatDateTime(resolvedData.generated_at)}</p>
              <p>Expira: {formatDateTime(resolvedData.expires_at)}</p>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            <header className="border-b border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700">
              Mix de exposure
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Razones</th>
                    <th className="px-4 py-3">Badges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-sm text-neutral-700">
                  {resolvedData.mix.length ? (
                    resolvedData.mix.map((item) => (
                      <tr key={String(item.product_id)}>
                        <td className="px-4 py-3 font-medium text-neutral-900">
                          {String(item.product_id)}
                        </td>
                        <td className="px-4 py-3">
                          {item.reason.length ? item.reason.join(', ') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {item.badges.length ? item.badges.join(', ') : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-sm text-neutral-500">
                        No hay productos en el mix para este contexto.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
