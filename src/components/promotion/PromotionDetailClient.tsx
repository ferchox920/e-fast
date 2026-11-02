'use client';

import Link from 'next/link';

import { useCheckPromotionEligibilityQuery, useGetPromotionByIdQuery } from '@/store/api/promotionsApi';
import { useGetLoyaltyProfileQuery } from '@/store/api/loyaltyApi';
import { useAppSelector } from '@/store/hooks';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatJson = (value: Record<string, unknown>) => JSON.stringify(value, null, 2);

export default function PromotionDetailClient({ promotionId }: { promotionId: string }) {
  const token = useAppSelector((state) => state.user.session.accessToken);
  const authStatus = useAppSelector((state) => state.user.status);
  const currentUser = useAppSelector((state) => state.user.current);

  const isAuthenticated = Boolean(token) && authStatus === 'authenticated';
  const isAdminUser =
    currentUser?.is_superuser === true ||
    ((currentUser as { role?: string | null } | null)?.role ?? null) === 'admin';

  const promotionQuery = useGetPromotionByIdQuery({ promotionId });
  const loyaltyQuery = useGetLoyaltyProfileQuery(undefined, {
    skip: !isAuthenticated || isAdminUser,
  });

  const eligibilityQuery = useCheckPromotionEligibilityQuery(
    {
      promotionId,
      params: {
        user_id: currentUser ? String(currentUser.id) : undefined,
        loyalty_level: loyaltyQuery.data?.level,
      },
    },
    { skip: !isAuthenticated || isAdminUser },
  );

  if (promotionQuery.isLoading || promotionQuery.isFetching) {
    return (
      <section className="mx-auto max-w-4xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-500">Cargando promocion...</p>
      </section>
    );
  }

  if (promotionQuery.isError || !promotionQuery.data) {
    return (
      <section className="mx-auto max-w-4xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        <p className="font-medium">No pudimos cargar esta promocion.</p>
        <Link href="/promotions" className="mt-3 inline-flex text-xs font-semibold text-rose-700">
          Volver a promociones
        </Link>
      </section>
    );
  }

  const promotion = promotionQuery.data;

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
          Promocion activa
        </p>
        <h1 className="text-3xl font-semibold text-neutral-900">{promotion.name}</h1>
        <p className="text-sm text-neutral-600">
          {promotion.description ?? 'Sin descripcion adicional.'}
        </p>
        <div className="grid gap-2 text-xs text-neutral-500 sm:grid-cols-2">
          <p>Tipo: {promotion.type}</p>
          <p>Alcance: {promotion.scope}</p>
          <p>Inicio: {formatDate(promotion.start_at)}</p>
          <p>Fin: {formatDate(promotion.end_at)}</p>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900">Beneficios</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-neutral-950 p-4 text-xs text-neutral-100">
            {formatJson(promotion.benefits_json)}
          </pre>
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900">Criterios</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-neutral-950 p-4 text-xs text-neutral-100">
            {formatJson(promotion.criteria_json)}
          </pre>
        </article>
      </section>

      <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-900">Elegibilidad</h2>
        {!isAuthenticated ? (
          <p className="mt-3 text-sm text-neutral-600">
            Inicia sesion para verificar si aplicas a esta promocion.
          </p>
        ) : isAdminUser ? (
          <p className="mt-3 text-sm text-neutral-600">
            Las cuentas administradoras no usan la evaluacion publica de promociones.
          </p>
        ) : eligibilityQuery.isLoading || eligibilityQuery.isFetching ? (
          <p className="mt-3 text-sm text-neutral-500">Verificando elegibilidad...</p>
        ) : eligibilityQuery.isError || !eligibilityQuery.data ? (
          <p className="mt-3 text-sm text-rose-600">
            No pudimos verificar tu elegibilidad para esta promocion.
          </p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <p
              className={
                eligibilityQuery.data.eligible ? 'font-medium text-emerald-600' : 'font-medium text-amber-600'
              }
            >
              {eligibilityQuery.data.eligible
                ? 'Tu cuenta cumple las condiciones de esta promocion.'
                : 'Tu cuenta todavia no cumple las condiciones de esta promocion.'}
            </p>
            {eligibilityQuery.data.reasons.length ? (
              <ul className="list-disc pl-5 text-neutral-600">
                {eligibilityQuery.data.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </article>
    </section>
  );
}
