'use client';

import type { ChangeEvent, FormEvent } from 'react';

interface FilterOption {
  label: string;
  value: string;
}

interface ProductFiltersBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  isSubmitting?: boolean;
  selectedBrand: string;
  selectedCategory: string;
  onBrandChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  brandOptions: FilterOption[];
  categoryOptions: FilterOption[];
  brandLoading?: boolean;
  categoryLoading?: boolean;
  brandError?: string | null;
  categoryError?: string | null;
}

const controlClass =
  'rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

export default function ProductFiltersBar({
  searchValue,
  onSearchChange,
  onSubmit,
  onReset,
  isSubmitting,
  selectedBrand,
  selectedCategory,
  onBrandChange,
  onCategoryChange,
  brandOptions,
  categoryOptions,
  brandLoading,
  categoryLoading,
  brandError,
  categoryError,
}: ProductFiltersBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const handleBrandChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onBrandChange(event.target.value);
  };

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onCategoryChange(event.target.value);
  };

  return (
    <form
      className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm text-neutral-700">
          Busqueda
          <input
            type="search"
            value={searchValue}
            onChange={handleSearchChange}
            className={controlClass}
            placeholder="Buscar por nombre o descripcion"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-700 md:w-56">
          Categoria
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className={controlClass}
            disabled={categoryLoading}
          >
            <option value="">
              {categoryLoading ? 'Cargando categorias...' : 'Todas las categorias'}
            </option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {categoryError ? <span className="text-xs text-red-600">{categoryError}</span> : null}
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-700 md:w-56">
          Marca
          <select
            value={selectedBrand}
            onChange={handleBrandChange}
            className={controlClass}
            disabled={brandLoading}
          >
            <option value="">{brandLoading ? 'Cargando marcas...' : 'Todas las marcas'}</option>
            {brandOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {brandError ? <span className="text-xs text-red-600">{brandError}</span> : null}
        </label>
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <button
          type="submit"
          className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Buscando...' : 'Buscar'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}
