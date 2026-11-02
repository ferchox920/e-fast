'use client';

import { use, useEffect, useMemo, useState } from 'react';
import ProductFiltersBar from '@/components/filters/ProductFiltersBar';
import ProductCardGrid from '@/components/product/ProductCardGrid';
import { useGetProductsQuery } from '@/store/api/productApi';
import { useGetCategoriesQuery } from '@/store/api/catalogApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCatalogFilters, selectCatalogFilters } from '@/store/slices/catalogSlice';
import { mapProductsToCards } from '@/components/product/utils/mapProductToCard';

const PRODUCTS_PER_PAGE = 12;

type CategoryRoutePageProps = {
  params: Promise<{
    segments: string[];
  }>;
};

const humanizeSegment = (value: string) =>
  decodeURIComponent(value)
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export default function CategoryRoutePage({ params }: CategoryRoutePageProps) {
  const dispatch = useAppDispatch();
  const catalogFilters = useAppSelector(selectCatalogFilters);

  const resolvedParams = use(params);
  const segments = resolvedParams?.segments ?? [];
  const routeCategorySlug = segments.length > 0 ? decodeURIComponent(segments[segments.length - 1]) : '';
  const { data: categoriesData } = useGetCategoriesQuery();
  const routeCategory = useMemo(
    () => (categoriesData ?? []).find((category) => category.slug === routeCategorySlug) ?? null,
    [categoriesData, routeCategorySlug],
  );
  const routeCategoryId = routeCategory ? String(routeCategory.id) : '';
  const routeSearch = useMemo(
    () => segments.map(humanizeSegment).filter(Boolean).join(' '),
    [segments],
  );
  const routeTitle = useMemo(
    () => segments.map(humanizeSegment).filter(Boolean).join(' / '),
    [segments],
  );

  const [searchInput, setSearchInput] = useState(routeSearch);
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    category: routeCategoryId,
    brand: '',
  });

  useEffect(() => {
    setSearchInput('');
    setAppliedFilters((prev) => ({
      ...prev,
      search: '',
      category: routeCategoryId,
    }));
  }, [routeCategoryId]);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetProductsQuery({
    search: appliedFilters.search || undefined,
    category: appliedFilters.category || undefined,
    brand: appliedFilters.brand || undefined,
    limit: PRODUCTS_PER_PAGE,
  });

  const products = useMemo(() => mapProductsToCards(data?.items ?? []), [data?.items]);
  const isPending = isLoading || isFetching;
  const showEmptyState = !isPending && !isError && (data?.items?.length ?? 0) === 0;

  const handleSubmit = () => {
    setAppliedFilters({
      search: searchInput.trim(),
      category: catalogFilters.categoryId ?? routeCategoryId,
      brand: catalogFilters.brandId ?? '',
    });
  };

  const handleReset = () => {
    setSearchInput('');
    dispatch(clearCatalogFilters());
    setAppliedFilters({
      search: '',
      category: routeCategoryId,
      brand: '',
    });
  };

  const handleCategoryChange = (value: string) => {
    setAppliedFilters((prev) => ({ ...prev, category: value }));
  };

  const handleBrandChange = (value: string) => {
    setAppliedFilters((prev) => ({ ...prev, brand: value }));
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Categoria: {routeTitle || 'Catalogo'}
        </h1>
        <p className="text-sm text-neutral-600">
          Mostrando productos relacionados con: {routeSearch || 'todas las categorias'}.
        </p>
      </header>

      <ProductFiltersBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSubmit={handleSubmit}
        onReset={handleReset}
        isSubmitting={isFetching}
        selectedCategory={catalogFilters.categoryId ?? ''}
        selectedBrand={catalogFilters.brandId ?? ''}
        onCategoryChange={handleCategoryChange}
        onBrandChange={handleBrandChange}
      />

      {isError ? (
        <section className="space-y-3 rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <h2 className="text-base font-semibold">No pudimos cargar los productos.</h2>
          {error && 'status' in error ? (
            <p className="text-xs text-red-500/80">Codigo: {String(error.status)}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-400 hover:text-red-700"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
            >
              Limpiar filtros
            </button>
          </div>
        </section>
      ) : isPending ? (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, index) => (
            <div
              key={`category-skeleton-${index}`}
              className="animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100 p-4"
            >
              <div className="mb-4 aspect-4/3 rounded-xl bg-neutral-200" />
              <div className="mb-2 h-4 rounded bg-neutral-200" />
              <div className="mb-2 h-4 w-2/3 rounded bg-neutral-200" />
              <div className="h-4 w-1/3 rounded bg-neutral-200" />
            </div>
          ))}
        </section>
      ) : (
        <ProductCardGrid
          products={products}
          emptyState={
            showEmptyState ? (
              <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-12 text-center text-sm text-neutral-600">
                <p className="mb-4 font-medium">
                  No encontramos productos para esta categoria.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : undefined
          }
        />
      )}
    </main>
  );
}
