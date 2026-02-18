'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  useListUsersQuery,
  useCreateUserAdminMutation,
  useSetUserRoleMutation,
  useSetUserActiveStatusMutation,
} from '@/store/api/adminApi';
import type { UserRead } from '@/types/user';

const PAGE_SIZE = 20;

type StatusMessage =
  | {
      type: 'success' | 'error';
      message: string;
    }
  | null;

interface NewCustomerForm {
  fullName: string;
  email: string;
  password: string;
  isSuperuser: boolean;
}

const DEFAULT_FORM_STATE: NewCustomerForm = {
  fullName: '',
  email: '',
  password: '',
  isSuperuser: false,
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
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
  if (!error) return 'Ocurrió un error inesperado.';
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
    if ('error' in (error as Record<string, unknown>)) {
      const err = (error as { error?: unknown }).error;
      if (typeof err === 'string') {
        return err;
      }
    }
    if ('status' in (error as Record<string, unknown>)) {
      const status = (error as { status?: number | string }).status;
      if (status) {
        return `Error ${status}: la operación no pudo completarse.`;
      }
    }
  }
  return 'No se pudo completar la acción solicitada.';
};

const getRoleBadgeClasses = (isSuperuser: boolean) =>
  isSuperuser ? 'bg-indigo-50 text-indigo-700' : 'bg-neutral-100 text-neutral-600';

const getActiveBadgeClasses = (isActive: boolean) =>
  isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700';

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState<NewCustomerForm>(DEFAULT_FORM_STATE);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);
  const [pendingActiveId, setPendingActiveId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useListUsersQuery({ page, page_size: PAGE_SIZE });

  const [createUser, createState] = useCreateUserAdminMutation();
  const [setUserRole, setRoleState] = useSetUserRoleMutation();
  const [setActiveStatus, setActiveState] = useSetUserActiveStatusMutation();

  const customers = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? customers.length;
  const totalPages = data?.pages ?? (total > 0 ? Math.ceil(total / PAGE_SIZE) : 1);

  const isSubmitting = createState.isLoading || setRoleState.isLoading || setActiveState.isLoading;

  const stats = useMemo(() => {
    const active = customers.filter((customer) => customer.is_active).length;
    const admins = customers.filter((customer) => customer.is_superuser).length;
    return {
      active,
      inactive: customers.length - active,
      admins,
    };
  }, [customers]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    try {
      await createUser({
        full_name: formState.fullName || undefined,
        email: formState.email.trim(),
        password: formState.password,
        is_superuser: formState.isSuperuser,
      }).unwrap();
      setStatus({
        type: 'success',
        message: 'Usuario creado correctamente.',
      });
      setFormState(DEFAULT_FORM_STATE);
    } catch (err) {
      setStatus({
        type: 'error',
        message: toErrorMessage(err),
      });
    }
  };

  const handleToggleAdmin = async (user: UserRead) => {
    if (pendingRoleId) return;
    setStatus(null);
    setPendingRoleId(String(user.id));
    try {
      await setUserRole({ userId: String(user.id), makeAdmin: !user.is_superuser }).unwrap();
    } catch (err) {
      setStatus({
        type: 'error',
        message: toErrorMessage(err),
      });
    } finally {
      setPendingRoleId(null);
    }
  };

  const handleToggleActive = async (user: UserRead) => {
    if (pendingActiveId) return;
    setStatus(null);
    setPendingActiveId(String(user.id));
    try {
      await setActiveStatus({ userId: String(user.id), active: !user.is_active }).unwrap();
    } catch (err) {
      setStatus({
        type: 'error',
        message: toErrorMessage(err),
      });
    } finally {
      setPendingActiveId(null);
    }
  };

  const isEmptyState = !isLoading && !isFetching && customers.length === 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Clientes</p>
        <h1 className="text-2xl font-semibold text-neutral-900">Gestión de clientes</h1>
        <p className="text-sm text-neutral-600">
          Administra las cuentas de clientes, roles de administrador y estados activos.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Clientes cargados</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900">{total.toLocaleString('es-ES')}</p>
          <p className="text-xs text-neutral-500">Página {page} de {totalPages}</p>
        </article>
        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Activos</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.active}</p>
          <p className="text-xs text-neutral-500">{stats.inactive} inactivos</p>
        </article>
        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Administradores</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-600">{stats.admins}</p>
          <p className="text-xs text-neutral-500">Usuarios con permisos extendidos</p>
        </article>
      </section>

      {status ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {status.message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <header className="flex flex-col gap-2 border-b border-neutral-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Listado de clientes</p>
            <p className="text-xs text-neutral-500">
              Consulta información básica, roles y estado de cada cuenta.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            {isFetching ? 'Actualizando…' : null}
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
              disabled={isFetching}
            >
              Refrescar
            </button>
          </div>
        </header>

        {isError ? (
          <div className="px-6 py-4 text-sm text-rose-600">
            <p className="font-medium">No pudimos cargar la lista de clientes.</p>
            <p>{toErrorMessage(error)}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-100 text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left">Contacto</th>
                  <th scope="col" className="px-6 py-3 text-left">Rol</th>
                  <th scope="col" className="px-6 py-3 text-left">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left">Creado</th>
                  <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-sm text-neutral-500">
                      Cargando clientes…
                    </td>
                  </tr>
                ) : isEmptyState ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-sm text-neutral-500">
                      Aún no hay clientes registrados.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="text-neutral-700">
                      <td className="px-6 py-4">
                        <p className="font-semibold">
                          {customer.full_name?.trim() || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-neutral-500">ID: {customer.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p>{customer.email}</p>
                        {customer.phone ? (
                          <p className="text-xs text-neutral-500">{customer.phone}</p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeClasses(
                            customer.is_superuser,
                          )}`}
                        >
                          {customer.is_superuser ? 'Administrador' : 'Cliente'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getActiveBadgeClasses(
                            customer.is_active,
                          )}`}
                        >
                          {customer.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-neutral-500">
                          {formatDateTime(
                            (customer as { created_at?: string | null }).created_at ?? null,
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleAdmin(customer)}
                            disabled={
                              isSubmitting || pendingRoleId === String(customer.id) || pendingActiveId !== null
                            }
                            className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {pendingRoleId === String(customer.id)
                              ? 'Actualizando…'
                              : customer.is_superuser
                                ? 'Revocar admin'
                                : 'Hacer admin'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(customer)}
                            disabled={
                              isSubmitting || pendingActiveId === String(customer.id) || pendingRoleId !== null
                            }
                            className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {pendingActiveId === String(customer.id)
                              ? 'Actualizando…'
                              : customer.is_active
                                ? 'Desactivar'
                                : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isError && totalPages > 1 ? (
          <footer className="flex flex-col items-center justify-between gap-4 border-t border-neutral-100 px-6 py-4 text-sm text-neutral-600 sm:flex-row">
            <p>
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1 || isFetching}
                className="rounded-md border border-neutral-300 px-3 py-1 font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || isFetching}
                className="rounded-md border border-neutral-300 px-3 py-1 font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </footer>
        ) : null}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <header className="mb-4">
          <p className="text-sm font-semibold text-neutral-900">Crear nuevo cliente</p>
          <p className="text-xs text-neutral-500">Registra manualmente cuentas para tu equipo o clientes.</p>
        </header>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-medium text-neutral-500">
            Nombre completo
            <input
              type="text"
              value={formState.fullName}
              onChange={(event) => setFormState((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Ej. Ana Pérez"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              disabled={createState.isLoading}
            />
          </label>

          <label className="text-xs font-medium text-neutral-500">
            Email
            <input
              type="email"
              required
              value={formState.email}
              onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="cliente@ejemplo.com"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              disabled={createState.isLoading}
            />
          </label>

          <label className="text-xs font-medium text-neutral-500">
            Contraseña
            <input
              type="password"
              required
              minLength={8}
              value={formState.password}
              onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Min. 8 caracteres"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              disabled={createState.isLoading}
            />
          </label>

          <label className="mt-6 flex items-center gap-2 text-xs font-medium text-neutral-600 md:mt-9">
            <input
              type="checkbox"
              checked={formState.isSuperuser}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, isSuperuser: event.target.checked }))
              }
              className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
              disabled={createState.isLoading}
            />
            Conceder rol de administrador
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                createState.isLoading ||
                !formState.email.trim() ||
                !formState.password ||
                formState.password.length < 8
              }
            >
              {createState.isLoading ? 'Creando cliente…' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
