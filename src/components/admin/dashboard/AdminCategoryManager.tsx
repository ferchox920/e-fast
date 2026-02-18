'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  useListAllCategoriesAdminQuery,
  useCreateCategoryAdminMutation,
  useUpdateCategoryAdminMutation,
} from '@/store/api/catalogApi';
import { useAppSelector } from '@/store/hooks';
import { selectCatalogAdminCategories, selectCatalogStatus } from '@/store/slices/catalogSlice';
import type { Category } from '@/types/catalog';

interface FormState {
  name: string;
  slug: string;
  description: string;
  active: boolean;
}

type StatusMessage =
  | {
      type: 'success' | 'error';
      message: string;
    }
  | null;

const DEFAULT_FORM_STATE: FormState = {
  name: '',
  slug: '',
  description: '',
  active: true,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const toErrorMessage = (error: unknown): string => {
  if (!error) return 'Ocurrió un error inesperado.';
  if (typeof error === 'string') return error;

  if (typeof error === 'object') {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
      if ('detail' in data && typeof (data as { detail: unknown }).detail === 'string') {
        return (data as { detail: string }).detail;
      }
      if ('message' in data && typeof (data as { message: unknown }).message === 'string') {
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
        return `Error ${status}: no se pudo procesar la categoría.`;
      }
    }
  }

  return 'No se pudo procesar la categoría.';
};

export default function AdminCategoryManager() {
  const {
    isFetching: isFetchingCategories,
    refetch,
  } = useListAllCategoriesAdminQuery();
  const [createCategory, createState] = useCreateCategoryAdminMutation();
  const [updateCategory, updateState] = useUpdateCategoryAdminMutation();

  const categories = useAppSelector(selectCatalogAdminCategories);
  const catalogStatus = useAppSelector(selectCatalogStatus);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [slugTouched, setSlugTouched] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);

  const isSubmitting = createState.isLoading || updateState.isLoading;

  const isLoadingCategories = catalogStatus.adminCategories === 'loading';
  const isErrorCategories = catalogStatus.adminCategories === 'failed';

  useEffect(() => {
    if (selectedCategory) {
      setFormState({
        name: selectedCategory.name ?? '',
        slug: selectedCategory.slug ?? '',
        description: selectedCategory.description ?? '',
        active: selectedCategory.active !== false,
      });
      setSlugTouched(true);
    } else {
      setFormState(DEFAULT_FORM_STATE);
      setSlugTouched(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (!status) return;
    const timeout = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timeout);
  }, [status]);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormState((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    setFormState((prev) => ({
      ...prev,
      slug: event.target.value,
    }));
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setFormState((prev) => ({
      ...prev,
      description: value,
    }));
  };

  const handleActiveToggle = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setFormState((prev) => ({
      ...prev,
      active: checked,
    }));
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setFormState(DEFAULT_FORM_STATE);
    setSlugTouched(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      setStatus({ type: 'error', message: 'El nombre es obligatorio.' });
      return;
    }
    const slugValue = formState.slug.trim() || slugify(trimmedName);
    const payload = {
      name: trimmedName,
      slug: slugValue,
      description: formState.description.trim() || undefined,
      active: formState.active,
    };

    try {
      if (selectedCategory) {
        await updateCategory({ categoryId: String(selectedCategory.id), body: payload }).unwrap();
        setStatus({ type: 'success', message: 'Categoría actualizada correctamente.' });
      } else {
        await createCategory(payload).unwrap();
        setStatus({ type: 'success', message: 'Categoría creada correctamente.' });
      }
      resetForm();
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) });
    }
  };

  const baseActionLabel = selectedCategory ? 'Actualizar' : 'Crear';
  const buttonLabel = isSubmitting ? 'Guardando\u2026' : `${baseActionLabel} categoría`;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Gestión de categorías
          </p>
          <p className="text-sm text-neutral-600">
            Crea y habilita categorías para organizar el catálogo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
          >
            Refrescar
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-md border border-indigo-500 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
          >
            Nueva categoría
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {isLoadingCategories ? (
            <div className="h-48 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50" />
          ) : isErrorCategories ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              Hubo un problema al cargar las categorías.
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
              Aún no hay categorías registradas.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200">
              {categories.map((category) => (
                <li key={category.id} className="flex items-start justify-between gap-3 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {category.name}
                    </p>
                    <p className="text-xs text-neutral-500">/{category.slug}</p>
                    {category.description ? (
                      <p className="mt-1 text-xs text-neutral-600">
                        {category.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        category.active !== false
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {category.active !== false ? 'Activa' : 'Inactiva'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Editar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {isFetchingCategories && !isLoadingCategories ? (
            <p className="text-xs text-neutral-400">Actualizando categorías…</p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-neutral-100 p-4 shadow-inner">
          {status ? (
            <div
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                status.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {status.message}
            </div>
          ) : null}

          {selectedCategory ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Editando «{selectedCategory.name}»
            </p>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Crear nueva categoría
            </p>
          )}

          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Nombre
            <input
              type="text"
              value={formState.name}
              onChange={handleNameChange}
              placeholder="Ej: Camperas"
              className="h-10 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              disabled={isSubmitting}
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Slug
            <input
              type="text"
              value={formState.slug}
              onChange={handleSlugChange}
              placeholder="camperas"
              className="h-10 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              disabled={isSubmitting}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Descripción
            <textarea
              rows={4}
              value={formState.description}
              onChange={handleDescriptionChange}
              placeholder="Detalles visibles para el equipo."
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              disabled={isSubmitting}
            />
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-neutral-600">
            <input
              type="checkbox"
              checked={formState.active}
              onChange={handleActiveToggle}
              className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
              disabled={isSubmitting}
            />
            Categoría activa
          </label>

          <div className="flex items-center justify-end gap-3">
            {selectedCategory ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
            ) : null}
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {buttonLabel}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
