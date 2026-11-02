'use client';

import Link from 'next/link';

import { useGetLoyaltyProfileQuery, useListLoyaltyLevelsQuery } from '@/store/api/loyaltyApi';
import { useAppSelector } from '@/store/hooks';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

export default function LoyaltyPageClient() {
  const token = useAppSelector((state) => state.user?.session?.accessToken ?? null);
  const authStatus = useAppSelector((state) => state.user?.status ?? 'idle');
  const currentUser = useAppSelector((state) => state.user?.current ?? null);

  const isAuthenticated = Boolean(token && authStatus === 'authenticated');
  const isAdminUser =
    currentUser?.is_superuser === true ||
    ((currentUser as { role?: string | null } | null)?.role ?? null) === 'admin';

  const profileQuery = useGetLoyaltyProfileQuery(undefined, { skip: !isAuthenticated || isAdminUser });
  const levelsQuery = useListLoyaltyLevelsQuery();

  if (!isAuthenticated) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">Lealtad</h1>
        <p className="text-sm text-neutral-600">
          Inicia sesion para consultar tu nivel y progreso de puntos.
        </p>
        <div className="flex justify-center">
          <Link
            href="/login?redirect=/loyalty"
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Ir a login
          </Link>
        </div>
      </section>
    );
  }

  if (isAdminUser) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">Lealtad</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Las cuentas administradoras revisan loyalty desde analytics y promociones.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">Programa de lealtad</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Estado actual de tu perfil y niveles disponibles.
        </p>
      </header>

      <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Mi perfil</h2>
        {profileQuery.isLoading || profileQuery.isFetching ? (
          <p className="mt-4 text-sm text-neutral-500">Cargando perfil de lealtad...</p>
        ) : profileQuery.isError || !profileQuery.data ? (
          <p className="mt-4 text-sm text-rose-600">No pudimos cargar tu perfil de lealtad.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Nivel</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">
                {profileQuery.data.level}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Puntos</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">
                {profileQuery.data.points}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Actualizado</p>
              <p className="mt-2 text-sm font-medium text-neutral-900">
                {formatDate(profileQuery.data.updated_at)}
              </p>
            </div>
          </div>
        )}
      </article>

      <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Niveles disponibles</h2>
        {levelsQuery.isLoading || levelsQuery.isFetching ? (
          <p className="mt-4 text-sm text-neutral-500">Cargando niveles...</p>
        ) : levelsQuery.isError || !levelsQuery.data || levelsQuery.data.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">No hay niveles publicados.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {levelsQuery.data.map((level) => (
              <article
                key={level.level}
                className="rounded-xl border border-neutral-100 bg-neutral-50 p-4"
              >
                <h3 className="text-base font-semibold text-neutral-900">{level.level}</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Desde {level.min_points} puntos acumulados.
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-950 p-3 text-xs text-neutral-100">
                  {JSON.stringify(level.perks_json ?? {}, null, 2)}
                </pre>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
