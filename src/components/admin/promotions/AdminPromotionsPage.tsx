'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  useActivateAdminPromotionMutation,
  useCreateAdminPromotionMutation,
  useDeactivateAdminPromotionMutation,
  useListAdminPromotionsQuery,
  useListUsersQuery,
} from '@/store/api/adminApi';
import { useGetCategoriesQuery } from '@/store/api/catalogApi';
import { useListLoyaltyLevelsQuery } from '@/store/api/loyaltyApi';
import { useGetProductsQuery } from '@/store/api/productApi';
import type { UserRead } from '@/types/user';

type PromotionStatusFilter = '' | 'draft' | 'active' | 'scheduled' | 'expired';
type PromotionType = 'category' | 'product' | 'customer' | 'loyalty';
type PromotionScope = 'global' | 'category' | 'product';

type StatusMessage = {
  type: 'success' | 'error';
  message: string;
} | null;

interface AdminPromotion {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  scope: string;
  criteria_json: Record<string, unknown>;
  benefits_json: Record<string, unknown>;
  start_at: string;
  end_at: string;
  status: string;
}

interface CreatePromotionFormState {
  name: string;
  description: string;
  type: PromotionType;
  scope: PromotionScope;
  startAt: string;
  endAt: string;
  discountPercent: string;
  minOrderTotal: string;
  selectedProductId: string;
  selectedCategoryId: string;
  selectedCustomerId: string;
  selectedLoyaltyLevels: string[];
  criteriaJson: string;
  benefitsJson: string;
}

const DEFAULT_FORM_STATE: CreatePromotionFormState = {
  name: '',
  description: '',
  type: 'product',
  scope: 'product',
  startAt: '',
  endAt: '',
  discountPercent: '10',
  minOrderTotal: '',
  selectedProductId: '',
  selectedCategoryId: '',
  selectedCustomerId: '',
  selectedLoyaltyLevels: [],
  criteriaJson: '{}',
  benefitsJson: '{}',
};

const STATUS_OPTIONS: Array<{ value: PromotionStatusFilter; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activa' },
  { value: 'scheduled', label: 'Programada' },
  { value: 'expired', label: 'Expirada' },
];

const TYPE_OPTIONS: Array<{ value: PromotionType; label: string }> = [
  { value: 'category', label: 'Categoria' },
  { value: 'product', label: 'Producto' },
  { value: 'customer', label: 'Cliente' },
  { value: 'loyalty', label: 'Fidelidad' },
];

const SCOPE_OPTIONS: Array<{ value: PromotionScope; label: string }> = [
  { value: 'global', label: 'General (toda la tienda)' },
  { value: 'product', label: 'Producto especifico' },
  { value: 'category', label: 'Categoria especifica' },
];

const EDITOR_OPTIONS: Array<{ value: PromotionType; title: string; help: string }> = [
  {
    value: 'product',
    title: 'Promocion por Producto',
    help: 'Aplica a uno o mas productos especificos.',
  },
  {
    value: 'category',
    title: 'Promocion por Categoria',
    help: 'Aplica a productos de una categoria.',
  },
  {
    value: 'customer',
    title: 'Promocion por Cliente',
    help: 'Aplica a clientes concretos. El alcance puede ser general, por producto o por categoria.',
  },
  {
    value: 'loyalty',
    title: 'Promocion por Fidelidad',
    help: 'Aplica por nivel de fidelidad. Separada de la segmentacion por cliente.',
  },
];

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatStatusLabel = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'active':
      return 'Activa';
    case 'scheduled':
      return 'Programada';
    case 'expired':
      return 'Expirada';
    default:
      return status;
  }
};

const toErrorMessage = (error: unknown) => {
  if (!error) return 'Ocurrio un error inesperado.';
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
  }
  return 'No se pudo completar la accion solicitada.';
};

const normalizePromotion = (raw: unknown): AdminPromotion | null => {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  if (typeof data.id !== 'string') return null;
  if (typeof data.name !== 'string') return null;
  if (typeof data.type !== 'string') return null;
  if (typeof data.scope !== 'string') return null;
  if (typeof data.start_at !== 'string') return null;
  if (typeof data.end_at !== 'string') return null;
  if (typeof data.status !== 'string') return null;

  return {
    id: data.id,
    name: data.name,
    description: typeof data.description === 'string' ? data.description : null,
    type: data.type,
    scope: data.scope,
    criteria_json:
      data.criteria_json && typeof data.criteria_json === 'object'
        ? (data.criteria_json as Record<string, unknown>)
        : {},
    benefits_json:
      data.benefits_json && typeof data.benefits_json === 'object'
        ? (data.benefits_json as Record<string, unknown>)
        : {},
    start_at: data.start_at,
    end_at: data.end_at,
    status: data.status,
  };
};

const parseJsonObject = (value: string, fieldName: string): Record<string, unknown> => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '{}') return {};
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${fieldName} debe ser un objeto JSON.`);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`${fieldName}: ${error.message}`);
    }
    throw new Error(`${fieldName}: JSON invalido.`);
  }
};

const toIsoDateTime = (localValue: string) => {
  const parsed = new Date(localValue);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Fecha invalida.');
  }
  return parsed.toISOString();
};

export default function AdminPromotionsPage() {
  const [statusFilter, setStatusFilter] = useState<PromotionStatusFilter>('');
  const [formState, setFormState] = useState<CreatePromotionFormState>(DEFAULT_FORM_STATE);
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(null);
  const [pendingPromotionId, setPendingPromotionId] = useState<string | null>(null);

  const queryArgs = statusFilter ? { status_filter: statusFilter } : undefined;
  const { data, isLoading, isFetching, isError, error, refetch } = useListAdminPromotionsQuery(
    queryArgs,
  );
  const { data: productsData } = useGetProductsQuery({ page: 1, page_size: 100 });
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: usersData } = useListUsersQuery({ page: 1, page_size: 100 });
  const { data: loyaltyLevelsData } = useListLoyaltyLevelsQuery();

  const [createPromotion, createState] = useCreateAdminPromotionMutation();
  const [activatePromotion, activateState] = useActivateAdminPromotionMutation();
  const [deactivatePromotion, deactivateState] = useDeactivateAdminPromotionMutation();

  const promotions = useMemo(() => {
    const input = Array.isArray(data) ? data : [];
    return input.map(normalizePromotion).filter((item): item is AdminPromotion => item !== null);
  }, [data]);

  const productOptions = useMemo(
    () => (productsData?.items ?? []).map((product) => ({ id: String(product.id), name: product.title })),
    [productsData?.items],
  );
  const categoryOptions = useMemo(
    () =>
      (categoriesData ?? []).map((category) => ({
        id: String(category.id),
        name: category.name,
      })),
    [categoriesData],
  );

  const customerOptions = useMemo(
    () =>
      (usersData?.items ?? []).map((user: UserRead) => ({
        id: String(user.id),
        label: user.full_name?.trim() ? `${user.full_name} (${user.email})` : user.email,
      })),
    [usersData?.items],
  );

  const loyaltyOptions = useMemo(
    () =>
      Array.isArray(loyaltyLevelsData) && loyaltyLevelsData.length > 0
        ? loyaltyLevelsData.map((level) => String(level.level))
        : ['bronze', 'silver', 'gold', 'diamond'],
    [loyaltyLevelsData],
  );

  const isMutating = createState.isLoading || activateState.isLoading || deactivateState.isLoading;
  const editorType = formState.type;

  const switchEditor = (nextType: PromotionType) => {
    const nextScope: PromotionScope =
      nextType === 'product' ? 'product' : nextType === 'category' ? 'category' : 'global';
    setFormState((prev) => ({
      ...prev,
      type: nextType,
      scope: nextScope,
      selectedProductId: '',
      selectedCategoryId: '',
      selectedCustomerId: '',
      selectedLoyaltyLevels: [],
    }));
  };

  const derivedScope: PromotionScope =
    formState.type === 'product'
      ? 'product'
      : formState.type === 'category'
        ? 'category'
        : formState.scope;

  const handleScopeChange = (nextScope: PromotionScope) => {
    setFormState((prev) => ({
      ...prev,
      scope: nextScope,
      selectedProductId: nextScope === 'product' ? prev.selectedProductId : '',
      selectedCategoryId: nextScope === 'category' ? prev.selectedCategoryId : '',
    }));
  };

  const toggleLoyaltyLevel = (level: string) => {
    setFormState((prev) => {
      const exists = prev.selectedLoyaltyLevels.includes(level);
      return {
        ...prev,
        selectedLoyaltyLevels: exists
          ? prev.selectedLoyaltyLevels.filter((item) => item !== level)
          : [...prev.selectedLoyaltyLevels, level],
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);

    if (!formState.name.trim()) {
      setStatusMessage({ type: 'error', message: 'El nombre es obligatorio.' });
      return;
    }
    if (!formState.startAt || !formState.endAt) {
      setStatusMessage({ type: 'error', message: 'Debes definir inicio y fin.' });
      return;
    }
    if (derivedScope === 'product' && !formState.selectedProductId) {
      setStatusMessage({
        type: 'error',
        message: 'Selecciona un producto cuando el alcance es por producto.',
      });
      return;
    }
    if (derivedScope === 'category' && !formState.selectedCategoryId) {
      setStatusMessage({
        type: 'error',
        message: 'Selecciona una categoría cuando el alcance es por categoría.',
      });
      return;
    }
    if (formState.type === 'customer' && !formState.selectedCustomerId) {
      setStatusMessage({
        type: 'error',
        message: 'Para promociones de cliente, debes seleccionar un cliente.',
      });
      return;
    }
    if (formState.type === 'loyalty' && formState.selectedLoyaltyLevels.length === 0) {
      setStatusMessage({
        type: 'error',
        message: 'Para promociones de fidelidad, selecciona al menos un nivel.',
      });
      return;
    }

    try {
      const startAt = toIsoDateTime(formState.startAt);
      const endAt = toIsoDateTime(formState.endAt);
      if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
        throw new Error('La fecha de fin debe ser posterior al inicio.');
      }

      const discountPercent = Number(formState.discountPercent);
      if (!Number.isFinite(discountPercent) || discountPercent <= 0) {
        throw new Error('El descuento debe ser mayor a 0.');
      }

      const criteriaAdvanced = parseJsonObject(formState.criteriaJson, 'Criteria');
      const benefitsAdvanced = parseJsonObject(formState.benefitsJson, 'Benefits');

      const criteriaQuick: Record<string, unknown> = {};
      const minOrderTotal = Number(formState.minOrderTotal);
      if (formState.minOrderTotal.trim().length > 0) {
        if (!Number.isFinite(minOrderTotal) || minOrderTotal < 0) {
          throw new Error('El monto minimo debe ser un numero valido.');
        }
        criteriaQuick.min_order_total = minOrderTotal;
      }
      if (formState.selectedProductId) {
        criteriaQuick.product_ids = [formState.selectedProductId];
      }
      if (formState.selectedCategoryId) {
        criteriaQuick.category_ids = [formState.selectedCategoryId];
      }
      if (formState.type === 'customer' && formState.selectedCustomerId) {
        criteriaQuick.customer_ids = [formState.selectedCustomerId];
      }
      if (formState.type === 'loyalty' && formState.selectedLoyaltyLevels.length > 0) {
        criteriaQuick.loyalty_levels = formState.selectedLoyaltyLevels;
      }

      const benefitsQuick: Record<string, unknown> = {
        discount_percent: discountPercent,
      };

      await createPromotion({
        name: formState.name.trim(),
        description: formState.description.trim() || null,
        type: formState.type,
        scope: derivedScope,
        start_at: startAt,
        end_at: endAt,
        criteria: { ...criteriaAdvanced, ...criteriaQuick },
        benefits: { ...benefitsAdvanced, ...benefitsQuick },
      }).unwrap();

      setStatusMessage({ type: 'success', message: 'Promocion creada correctamente.' });
      setFormState(DEFAULT_FORM_STATE);
    } catch (submitError) {
      setStatusMessage({ type: 'error', message: toErrorMessage(submitError) });
    }
  };

  const handleActivate = async (promotionId: string) => {
    setStatusMessage(null);
    setPendingPromotionId(promotionId);
    try {
      await activatePromotion({ promotionId }).unwrap();
      setStatusMessage({ type: 'success', message: 'Promocion activada.' });
    } catch (actionError) {
      setStatusMessage({ type: 'error', message: toErrorMessage(actionError) });
    } finally {
      setPendingPromotionId(null);
    }
  };

  const handleDeactivate = async (promotionId: string) => {
    setStatusMessage(null);
    setPendingPromotionId(promotionId);
    try {
      await deactivatePromotion({ promotionId }).unwrap();
      setStatusMessage({ type: 'success', message: 'Promocion desactivada.' });
    } catch (actionError) {
      setStatusMessage({ type: 'error', message: toErrorMessage(actionError) });
    } finally {
      setPendingPromotionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Promociones</h1>
        <p className="text-sm text-neutral-600">
          Configura promociones por producto, cliente y fidelidad sin editar JSON manualmente.
        </p>
      </header>

      {statusMessage ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            statusMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {statusMessage.message}
        </div>
      ) : null}

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {EDITOR_OPTIONS.map((option) => {
            const selected = editorType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => switchEditor(option.value)}
                className={`rounded-lg border p-3 text-left transition ${
                  selected
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <p className="text-sm font-semibold">{option.title}</p>
                <p
                  className={`mt-1 text-xs ${
                    selected ? 'text-neutral-200' : 'text-neutral-500'
                  }`}
                >
                  {option.help}
                </p>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-medium text-neutral-500">
            Nombre
            <input
              type="text"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
              placeholder="Ej: 20% OFF Sneakers"
            />
          </label>

          <label className="text-xs font-medium text-neutral-500">
            Descripcion
            <input
              type="text"
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
              placeholder="Opcional"
            />
          </label>

          <label className="text-xs font-medium text-neutral-500">
            Tipo de promoción
            <select
              value={formState.type}
              onChange={(event) => switchEditor(event.target.value as PromotionType)}
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {formState.type === 'customer' || formState.type === 'loyalty' ? (
            <label className="text-xs font-medium text-neutral-500">
              Alcance
              <select
                value={formState.scope}
                onChange={(event) => handleScopeChange(event.target.value as PromotionScope)}
                className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
              >
                {SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Alcance</p>
              <p className="mt-1">
                Se define automáticamente según el tipo: <strong>{derivedScope}</strong>
              </p>
            </div>
          )}

          <label className="text-xs font-medium text-neutral-500">
            Descuento (%)
            <input
              type="number"
              min="1"
              max="100"
              step="0.1"
              value={formState.discountPercent}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, discountPercent: event.target.value }))
              }
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
            />
          </label>

          <label className="text-xs font-medium text-neutral-500">
            Monto minimo de orden
            <input
              type="number"
              min="0"
              step="0.01"
              value={formState.minOrderTotal}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, minOrderTotal: event.target.value }))
              }
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
              placeholder="Opcional"
            />
          </label>

          <label className="text-xs font-medium text-neutral-500">
            Inicio
            <input
              type="datetime-local"
              value={formState.startAt}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, startAt: event.target.value }))
              }
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
            />
          </label>

          <label className="text-xs font-medium text-neutral-500">
            Fin
            <input
              type="datetime-local"
              value={formState.endAt}
              onChange={(event) => setFormState((prev) => ({ ...prev, endAt: event.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
            />
          </label>

          {derivedScope === 'product' ? (
            <label className="text-xs font-medium text-neutral-500 md:col-span-2">
              Producto objetivo
              <select
                value={formState.selectedProductId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, selectedProductId: event.target.value }))
                }
                className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
              >
                <option value="">Seleccionar producto</option>
                {productOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {derivedScope === 'category' ? (
            <label className="text-xs font-medium text-neutral-500 md:col-span-2">
              Categoría objetivo
              <select
                value={formState.selectedCategoryId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, selectedCategoryId: event.target.value }))
                }
                className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
              >
                <option value="">Seleccionar categoría</option>
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {editorType === 'customer' ? (
            <label className="text-xs font-medium text-neutral-500 md:col-span-2">
              Cliente objetivo
              <select
                value={formState.selectedCustomerId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, selectedCustomerId: event.target.value }))
                }
                className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
              >
                <option value="">Seleccionar cliente</option>
                {customerOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {editorType === 'loyalty' ? (
            <fieldset className="rounded-lg border border-neutral-200 p-3 md:col-span-2">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Niveles de fidelidad objetivo
              </legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {loyaltyOptions.map((level) => {
                  const checked = formState.selectedLoyaltyLevels.includes(level);
                  return (
                    <label key={level} className="inline-flex items-center gap-2 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleLoyaltyLevel(level)}
                        className="h-4 w-4 rounded border-neutral-300 text-indigo-600"
                      />
                      {level}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          <details className="rounded-lg border border-neutral-200 p-3 md:col-span-2">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Configuracion avanzada (JSON)
            </summary>
            <div className="mt-3 grid gap-3">
              <label className="text-xs font-medium text-neutral-500">
                Criteria JSON
                <textarea
                  value={formState.criteriaJson}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, criteriaJson: event.target.value }))
                  }
                  className="mt-1 min-h-24 w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-xs text-neutral-700"
                />
              </label>
              <label className="text-xs font-medium text-neutral-500">
                Benefits JSON
                <textarea
                  value={formState.benefitsJson}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, benefitsJson: event.target.value }))
                  }
                  className="mt-1 min-h-24 w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-xs text-neutral-700"
                />
              </label>
            </div>
          </details>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createState.isLoading}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {createState.isLoading ? 'Creando...' : 'Crear promocion'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <label htmlFor="promotion-status-filter" className="text-xs font-medium text-neutral-500">
              Filtrar estado
            </label>
            <select
              id="promotion-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PromotionStatusFilter)}
              className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="h-9 rounded-lg border border-neutral-300 px-3 text-sm font-semibold text-neutral-700"
            disabled={isFetching}
          >
            Refrescar
          </button>
        </header>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Promocion</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Alcance</th>
                <th className="px-4 py-3">Descuento</th>
                <th className="px-4 py-3">Vigencia</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm text-neutral-700">
              {isError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-sm text-rose-600">
                    No pudimos cargar promociones. {toErrorMessage(error)}
                  </td>
                </tr>
              ) : null}

              {!isError && isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-sm text-neutral-500">
                    Cargando promociones...
                  </td>
                </tr>
              ) : null}

              {!isError && !isLoading && promotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-500">
                    No hay promociones para el filtro seleccionado.
                  </td>
                </tr>
              ) : null}

              {!isError &&
                !isLoading &&
                promotions.map((promo) => {
                  const isPending = isMutating && pendingPromotionId === promo.id;
                  const canActivate = promo.status !== 'active';
                  const canDeactivate = promo.status === 'active' || promo.status === 'scheduled';
                  const discount =
                    typeof promo.benefits_json.discount_percent === 'number'
                      ? `${promo.benefits_json.discount_percent}%`
                      : '-';

                  return (
                    <tr key={promo.id}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-neutral-900">{promo.name}</p>
                        <p className="text-xs text-neutral-500">
                          {promo.description || 'Sin descripcion'}
                        </p>
                      </td>
                      <td className="px-4 py-4">{promo.type}</td>
                      <td className="px-4 py-4">{promo.scope}</td>
                      <td className="px-4 py-4">{discount}</td>
                      <td className="px-4 py-4 text-xs text-neutral-600">
                        {formatDateTime(promo.start_at)} - {formatDateTime(promo.end_at)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
                          {formatStatusLabel(promo.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={!canActivate || isPending}
                            onClick={() => handleActivate(promo.id)}
                            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 disabled:opacity-40"
                          >
                            {isPending && activateState.isLoading ? '...' : 'Activar'}
                          </button>
                          <button
                            type="button"
                            disabled={!canDeactivate || isPending}
                            onClick={() => handleDeactivate(promo.id)}
                            className="rounded-md border border-rose-300 px-2.5 py-1 text-xs font-semibold text-rose-700 disabled:opacity-40"
                          >
                            {isPending && deactivateState.isLoading ? '...' : 'Desactivar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

