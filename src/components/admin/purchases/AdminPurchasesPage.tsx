'use client';

import { useMemo, useState, type FormEvent } from 'react';

import {
  useCreatePurchaseOrderFromSuggestionsMutation,
  useCreateSupplierMutation,
  useGetReplenishmentAlertsQuery,
  useGetReplenishmentSuggestionsQuery,
  useListSuppliersQuery,
} from '@/store/api/purchasesApi';

type StatusMessage =
  | {
      type: 'success' | 'error';
      text: string;
    }
  | null;

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
  return 'No se pudo completar la accion.';
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value);

const formatCurrency = (value: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
};

const SectionState = ({
  isLoading,
  isError,
  empty,
  loadingText,
  emptyText,
  errorText,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  empty: boolean;
  loadingText: string;
  emptyText: string;
  errorText: string;
  children: React.ReactNode;
}) => {
  if (isLoading) return <p className="text-sm text-neutral-500">{loadingText}</p>;
  if (isError) return <p className="text-sm text-rose-600">{errorText}</p>;
  if (empty) return <p className="text-sm text-neutral-500">{emptyText}</p>;
  return <>{children}</>;
};

export default function AdminPurchasesPage() {
  const [supplierFilter, setSupplierFilter] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(null);

  const listSuppliersQuery = useListSuppliersQuery({ limit: 100, offset: 0 });
  const alertsQuery = useGetReplenishmentAlertsQuery(
    supplierFilter ? { supplier_id: supplierFilter } : undefined,
  );
  const suggestionsQuery = useGetReplenishmentSuggestionsQuery(
    supplierFilter ? { supplier_id: supplierFilter } : undefined,
  );

  const [createSupplier, createSupplierState] = useCreateSupplierMutation();
  const [createPOFromSuggestions, createPOState] = useCreatePurchaseOrderFromSuggestionsMutation();

  const suppliers = listSuppliersQuery.data ?? [];
  const alerts = alertsQuery.data ?? [];
  const suggestionLines = suggestionsQuery.data?.lines ?? [];

  const selectedSupplierName = useMemo(
    () => suppliers.find((supplier) => String(supplier.id) === supplierFilter)?.name ?? null,
    [supplierFilter, suppliers],
  );

  const handleCreateSupplier = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);

    if (!supplierName.trim()) {
      setStatusMessage({ type: 'error', text: 'El nombre del proveedor es obligatorio.' });
      return;
    }

    try {
      const created = await createSupplier({
        name: supplierName.trim(),
        email: supplierEmail.trim() || null,
        phone: supplierPhone.trim() || null,
      }).unwrap();
      setSupplierName('');
      setSupplierEmail('');
      setSupplierPhone('');
      setStatusMessage({
        type: 'success',
        text: `Proveedor creado: ${created.name}.`,
      });
    } catch (error) {
      setStatusMessage({ type: 'error', text: toErrorMessage(error) });
    }
  };

  const handleCreatePO = async () => {
    setStatusMessage(null);
    if (!supplierFilter) {
      setStatusMessage({
        type: 'error',
        text: 'Selecciona un proveedor para generar una orden de compra.',
      });
      return;
    }

    try {
      const po = await createPOFromSuggestions({ supplier_id: supplierFilter }).unwrap();
      setStatusMessage({
        type: 'success',
        text: `Orden de compra generada: ${String(po.id)}.`,
      });
    } catch (error) {
      setStatusMessage({ type: 'error', text: toErrorMessage(error) });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Compras y abastecimiento</h1>
        <p className="text-sm text-neutral-600">
          Gestiona proveedores y monitorea sugerencias de reposicion desde un modulo dedicado.
        </p>
      </header>

      {statusMessage ? (
        <section
          className={`rounded-xl border px-4 py-3 text-sm ${
            statusMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {statusMessage.text}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <header className="mb-4">
            <h2 className="text-sm font-semibold text-neutral-900">Alta de proveedor</h2>
            <p className="text-xs text-neutral-500">
              Crea un proveedor para usarlo en futuras ordenes de compra.
            </p>
          </header>

          <form onSubmit={handleCreateSupplier} className="space-y-3">
            <label className="block text-xs font-medium text-neutral-500">
              Nombre
              <input
                type="text"
                value={supplierName}
                onChange={(event) => setSupplierName(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
                placeholder="Proveedor"
              />
            </label>

            <label className="block text-xs font-medium text-neutral-500">
              Email
              <input
                type="email"
                value={supplierEmail}
                onChange={(event) => setSupplierEmail(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
                placeholder="Opcional"
              />
            </label>

            <label className="block text-xs font-medium text-neutral-500">
              Telefono
              <input
                type="text"
                value={supplierPhone}
                onChange={(event) => setSupplierPhone(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700"
                placeholder="Opcional"
              />
            </label>

            <button
              type="submit"
              disabled={createSupplierState.isLoading}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {createSupplierState.isLoading ? 'Creando...' : 'Crear proveedor'}
            </button>
          </form>
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Proveedores</h2>
              <p className="text-xs text-neutral-500">
                Usa el selector para filtrar alertas y sugerencias de reposicion.
              </p>
            </div>

            <label className="text-xs font-medium text-neutral-500">
              Filtrar por proveedor
              <select
                value={supplierFilter}
                onChange={(event) => setSupplierFilter(event.target.value)}
                className="mt-1 h-10 min-w-56 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700"
              >
                <option value="">Todos los proveedores</option>
                {suppliers.map((supplier) => (
                  <option key={String(supplier.id)} value={String(supplier.id)}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
          </header>

          <SectionState
            isLoading={listSuppliersQuery.isLoading || listSuppliersQuery.isFetching}
            isError={listSuppliersQuery.isError}
            empty={suppliers.length === 0}
            loadingText="Cargando proveedores..."
            emptyText="No hay proveedores cargados."
            errorText="No pudimos cargar proveedores."
          >
            <ul className="space-y-2 text-sm">
              {suppliers.slice(0, 8).map((supplier) => (
                <li
                  key={String(supplier.id)}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{supplier.name}</p>
                    <p className="text-xs text-neutral-500">
                      {supplier.email ?? 'Sin email'} | {supplier.phone ?? 'Sin telefono'}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400">{String(supplier.id)}</span>
                </li>
              ))}
            </ul>
          </SectionState>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <header className="mb-4">
            <h2 className="text-sm font-semibold text-neutral-900">Alertas de reposicion</h2>
            <p className="text-xs text-neutral-500">
              {selectedSupplierName
                ? `Filtradas para ${selectedSupplierName}.`
                : 'Mostrando alertas para todos los proveedores.'}
            </p>
          </header>

          <SectionState
            isLoading={alertsQuery.isLoading || alertsQuery.isFetching}
            isError={alertsQuery.isError}
            empty={alerts.length === 0}
            loadingText="Calculando alertas..."
            emptyText="No hay alertas de reposicion para este filtro."
            errorText="No pudimos cargar las alertas de reposicion."
          >
            <ul className="space-y-2 text-sm">
              {alerts.slice(0, 8).map((alert) => (
                <li
                  key={String(alert.variant_id)}
                  className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-amber-900">
                      Variante {String(alert.variant_id)}
                    </p>
                    <p className="text-xs text-amber-800">
                      Disponible: {formatNumber(alert.available)} | Faltante:{' '}
                      {formatNumber(alert.missing)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-amber-900">
                    RP: {formatNumber(alert.reorder_point)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionState>
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <header className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Sugerencias de compra</h2>
              <p className="text-xs text-neutral-500">
                {selectedSupplierName
                  ? `Preparadas para ${selectedSupplierName}.`
                  : 'Selecciona un proveedor para generar una orden de compra.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreatePO}
              disabled={!supplierFilter || suggestionLines.length === 0 || createPOState.isLoading}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 disabled:opacity-40"
            >
              {createPOState.isLoading ? 'Generando...' : 'Crear OC desde sugerencias'}
            </button>
          </header>

          <SectionState
            isLoading={suggestionsQuery.isLoading || suggestionsQuery.isFetching}
            isError={suggestionsQuery.isError}
            empty={suggestionLines.length === 0}
            loadingText="Calculando sugerencias..."
            emptyText="No hay sugerencias disponibles para este filtro."
            errorText="No pudimos cargar las sugerencias de reposicion."
          >
            <ul className="space-y-2 text-sm">
              {suggestionLines.slice(0, 8).map((line) => (
                <li
                  key={String(line.variant_id)}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      Variante {String(line.variant_id)}
                    </p>
                    <p className="text-xs text-neutral-500">{line.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">
                      {formatNumber(line.suggested_qty)} u.
                    </p>
                    <p className="text-xs text-neutral-500">
                      {typeof line.last_unit_cost === 'number'
                        ? formatCurrency(line.last_unit_cost)
                        : 'Sin costo'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionState>
        </article>
      </section>
    </div>
  );
}
