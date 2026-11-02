'use client';

import { useListWishesQuery } from '@/store/api/wishesApi';
import { useAppSelector } from '@/store/hooks';
import WishlistProductCard from '@/components/account/WishlistProductCard';
import Link from 'next/link';

export default function WishlistPageClient() {
  const token = useAppSelector((state) => state.user?.session?.accessToken ?? null);
  const authStatus = useAppSelector((state) => state.user?.status ?? 'idle');
  const currentUser = useAppSelector((state) => state.user?.current ?? null);
  const isAuthenticated = Boolean(token && authStatus === 'authenticated');
  const isAdminUser =
    currentUser?.is_superuser === true ||
    ((currentUser as { role?: string | null } | null)?.role ?? null) === 'admin';

  const wishesQuery = useListWishesQuery(undefined, { skip: !isAuthenticated || isAdminUser });

  if (!isAuthenticated) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">Lista de deseos</h1>
        <p className="text-sm text-neutral-600">
          Inicia sesion para ver y gestionar tus productos guardados.
        </p>
        <div className="flex justify-center">
          <Link
            href="/login?redirect=/lista-deseos"
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
        <h1 className="text-2xl font-semibold text-neutral-900">Lista de deseos</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Las cuentas administradoras no usan wishlist publica.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">Lista de deseos</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Productos guardados para seguirlos o comprarlos mas adelante.
        </p>
      </header>

      {wishesQuery.isLoading || wishesQuery.isFetching ? (
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Cargando favoritos...</p>
        </article>
      ) : wishesQuery.isError ? (
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          No pudimos cargar tu wishlist.
        </article>
      ) : !wishesQuery.data || wishesQuery.data.length === 0 ? (
        <article className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          No tienes productos guardados en este momento.
        </article>
      ) : (
        <ul className="space-y-4">
          {wishesQuery.data.map((wish) => (
            <WishlistProductCard key={String(wish.id)} wish={wish} />
          ))}
        </ul>
      )}
    </section>
  );
}
