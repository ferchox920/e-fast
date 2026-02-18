'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  useCreateBrandAdminMutation,
  useListAllBrandsAdminQuery,
  useUpdateBrandAdminMutation,
} from '@/store/api/catalogApi';
import { useAppSelector } from '@/store/hooks';
import { selectCatalogAdminBrands, selectCatalogStatus } from '@/store/slices/catalogSlice';
import type { Brand } from '@/types/catalog';

interface FormState {
  name: string;
  slug: string;
  description: string;
  active: boolean;
}

type StatusMessage = {
  type: 'success' | 'error';
  message: string;
} | null;

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
  if (!error) return 'Unexpected error.';
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
        return `Error ${status}: request failed.`;
      }
    }
  }

  return 'Could not process brand.';
};

export default function AdminBrandManager() {
  const { isFetching: isFetchingBrands, refetch } = useListAllBrandsAdminQuery();
  const [createBrand, createState] = useCreateBrandAdminMutation();
  const [updateBrand, updateState] = useUpdateBrandAdminMutation();

  const brands = useAppSelector(selectCatalogAdminBrands);
  const catalogStatus = useAppSelector(selectCatalogStatus);

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [slugTouched, setSlugTouched] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);

  const isSubmitting = createState.isLoading || updateState.isLoading;
  const isLoadingBrands = catalogStatus.adminBrands === 'loading';
  const isErrorBrands = catalogStatus.adminBrands === 'failed';

  useEffect(() => {
    if (selectedBrand) {
      setFormState({
        name: selectedBrand.name ?? '',
        slug: selectedBrand.slug ?? '',
        description: selectedBrand.description ?? '',
        active: selectedBrand.active !== false,
      });
      setSlugTouched(true);
    } else {
      setFormState(DEFAULT_FORM_STATE);
      setSlugTouched(false);
    }
  }, [selectedBrand]);

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
    setSelectedBrand(null);
    setFormState(DEFAULT_FORM_STATE);
    setSlugTouched(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      setStatus({ type: 'error', message: 'Name is required.' });
      return;
    }

    const payload = {
      name: trimmedName,
      slug: formState.slug.trim() || slugify(trimmedName),
      description: formState.description.trim() || undefined,
      active: formState.active,
    };

    try {
      if (selectedBrand) {
        await updateBrand({ brandId: String(selectedBrand.id), body: payload }).unwrap();
        setStatus({ type: 'success', message: 'Brand updated.' });
      } else {
        await createBrand(payload).unwrap();
        setStatus({ type: 'success', message: 'Brand created.' });
      }
      resetForm();
    } catch (error) {
      setStatus({ type: 'error', message: toErrorMessage(error) });
    }
  };

  const baseActionLabel = selectedBrand ? 'Update' : 'Create';
  const buttonLabel = isSubmitting ? 'Saving...' : `${baseActionLabel} brand`;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Brand management
          </p>
          <p className="text-sm text-neutral-600">Create and maintain catalog brands.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-md border border-indigo-500 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
          >
            New brand
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {isLoadingBrands ? (
            <div className="h-48 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50" />
          ) : isErrorBrands ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              Could not load brands.
            </div>
          ) : brands.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
              No brands found.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200">
              {brands.map((brand) => (
                <li
                  key={brand.id}
                  className="flex items-start justify-between gap-3 bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">{brand.name}</p>
                    <p className="text-xs text-neutral-500">/{brand.slug ?? 'no-slug'}</p>
                    {brand.description ? (
                      <p className="mt-1 text-xs text-neutral-600">{brand.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        brand.active !== false
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {brand.active !== false ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedBrand(brand)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {isFetchingBrands && !isLoadingBrands ? (
            <p className="text-xs text-neutral-400">Refreshing brands...</p>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-neutral-100 p-4 shadow-inner"
        >
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

          {selectedBrand ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Editing &quot;{selectedBrand.name}&quot;
            </p>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Create new brand
            </p>
          )}

          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Name
            <input
              type="text"
              value={formState.name}
              onChange={handleNameChange}
              placeholder="Example: Nike"
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
              placeholder="nike"
              className="h-10 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              disabled={isSubmitting}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Description
            <textarea
              rows={4}
              value={formState.description}
              onChange={handleDescriptionChange}
              placeholder="Internal description."
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
            Active brand
          </label>

          <div className="flex items-center justify-end gap-3">
            {selectedBrand ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                disabled={isSubmitting}
              >
                Cancel
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
