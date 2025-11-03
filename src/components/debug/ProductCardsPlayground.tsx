'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductCardGrid from '@/components/product/ProductCardGrid';
import ProductDescriptionCard from '@/components/product/ProductDescriptionCard';
import type { ProductCardProps } from '@/components/product/ProductCard';
import ProductFiltersBar from '@/components/filters/ProductFiltersBar';
import { productApi, useListProductsQuery } from '@/store/api/productApi';
import { useListBrandsQuery, useListCategoriesQuery } from '@/store/api/catalogApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAll as clearAllWishes, selectWishIds, toggleWish } from '@/store/slices/wishesSlice';
import { mapProductsToCards } from '@/components/product/utils/mapProductToCard';

const PRODUCTS_PER_PAGE = 12;

export default function ProductCardsPlayground() {
  const [search, setSearch] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [alternateTheme, setAlternateTheme] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const prefetchProduct = productApi.usePrefetch('getProduct');
  const dispatch = useAppDispatch();
  const wishIds = useAppSelector(selectWishIds);

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useListCategoriesQuery();

  const {
    data: brandsData,
    isLoading: brandsLoading,
    isError: brandsError,
  } = useListBrandsQuery({ page_size: 100 });

  const { data, isLoading, isFetching, error, refetch } = useListProductsQuery({
    limit: PRODUCTS_PER_PAGE,
    offset: (page - 1) * PRODUCTS_PER_PAGE,
    search: search || undefined,
    category: selectedCategory || undefined,
    brand: selectedBrand || undefined,
  });

  const categoryOptions = useMemo(() => {
    if (!categoriesData?.length) return [];
    return categoriesData
      .filter((category) => category.active)
      .map((category) => ({
        value: String(category.id),
        label: category.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categoriesData]);

  const brandOptions = useMemo(() => {
    if (!brandsData?.items?.length) return [];
    return brandsData.items
      .filter((brand) => brand.active)
      .map((brand) => ({
        value: String(brand.id),
        label: brand.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [brandsData]);

  const categoryErrorMessage = categoriesError ? 'No pudimos cargar las categorias.' : null;
  const brandErrorMessage = brandsError ? 'No pudimos cargar las marcas.' : null;
  const showEmptyState = !isLoading && !isFetching && !error && (data?.items?.length ?? 0) === 0;

  const handleResetFilters = () => {
    setPendingSearch('');
    setSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    dispatch(clearAllWishes());
    setPage(1);
    setSelectedProductId(null);
  };

  const emptyStateContent = (
    <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-12 text-center text-sm text-neutral-600">
      <p className="mb-4 font-medium">No encontramos productos con los filtros actuales.</p>
      <button
        type="button"
        onClick={handleResetFilters}
        className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
      >
        Limpiar filtros
      </button>
    </div>
  );

  const products: ProductCardProps[] = useMemo(() => {
    if (!data?.items) return [];
    return mapProductsToCards(data.items).map((card) => ({
      ...card,
      isFavorite: wishIds.includes(card.id),
    }));
  }, [data?.items, wishIds]);

  useEffect(() => {
    if (!products.length) {
      setSelectedProductId(null);
      return;
    }
    setSelectedProductId((prev) => {
      if (prev && products.some((product) => product.id === prev)) {
        return prev;
      }
      return products[0]?.id ?? null;
    });
  }, [products]);

  const selectedProduct = useMemo(() => {
    if (!products.length) return null;
    return products.find((product) => product.id === selectedProductId) ?? products[0];
  }, [products, selectedProductId]);

  useEffect(() => {
    if (data?.pages && page > data.pages && data.pages > 0) {
      setPage(data.pages);
    }
  }, [data?.pages, page]);

  const toggleFavorite = (id: string) => {
    dispatch(toggleWish(id));
  };

  useEffect(() => {
    if (selectedProduct?.slug) {
      prefetchProduct(selectedProduct.slug, { force: false });
    }
  }, [prefetchProduct, selectedProduct?.slug]);

  return (
    <section className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Product Card Playground</h1>
        <p className="text-sm text-neutral-600">
          Visualiza las tarjetas en modo listado y en vista descriptiva, ajusta el tema, destacadas
          y simula favoritos.
        </p>
      </header>

      <ProductFiltersBar
        searchValue={pendingSearch}
        onSearchChange={setPendingSearch}
        onSubmit={() => {
          setSearch(pendingSearch.trim());
          setPage(1);
        }}
        onReset={handleResetFilters}
        isSubmitting={isFetching}
        selectedCategory={selectedCategory}
        selectedBrand={selectedBrand}
        onCategoryChange={(value) => {
          setSelectedCategory(value);
          setPage(1);
        }}
        onBrandChange={(value) => {
          setSelectedBrand(value);
          setPage(1);
        }}
        categoryOptions={categoryOptions}
        brandOptions={brandOptions}
        categoryLoading={categoriesLoading}
        brandLoading={brandsLoading}
        categoryError={categoryErrorMessage}
        brandError={brandErrorMessage}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section
            className={`rounded-3xl border border-neutral-200 p-6 shadow-sm ${
              alternateTheme ? 'bg-neutral-900 text-neutral-50' : 'bg-white text-neutral-900'
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Listado de productos</h2>
              <span className="text-xs text-neutral-500">
                {isFetching ? 'Actualizando...' : `${data?.total ?? 0} items encontrados`}
              </span>
            </div>
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <p className="font-semibold">No pudimos cargar los productos.</p>
                <p className="mt-1 text-xs text-red-500/80">
                  Verifica tu conexion o intenta nuevamente mas tarde.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-400 hover:text-red-700"
                  >
                    Reintentar
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100 p-4"
                  >
                    <div className="mb-4 aspect-[4/3] rounded-xl bg-neutral-200" />
                    <div className="mb-2 h-4 rounded bg-neutral-200" />
                    <div className="mb-2 h-4 w-2/3 rounded bg-neutral-200" />
                    <div className="h-4 w-1/3 rounded bg-neutral-200" />
                  </div>
                ))}
              </div>
            ) : (
              <ProductCardGrid
                products={products.map((product) => ({
                  ...product,
                  onToggleFavorite: toggleFavorite,
                  footerSlot: (
                    <button
                      type="button"
                      onMouseEnter={() => {
                        if (product.slug) prefetchProduct(product.slug, { force: false });
                      }}
                      onFocus={() => {
                        if (product.slug) prefetchProduct(product.slug, { force: false });
                      }}
                      onClick={() => {
                        setSelectedProductId(product.id);
                        if (product.slug) prefetchProduct(product.slug, { force: false });
                      }}
                      className="mt-2 inline-flex items-center justify-center rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
                    >
                      Ver en detalle
                    </button>
                  ),
                }))}
                emptyState={showEmptyState ? emptyStateContent : undefined}
              />
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-neutral-500">
                Pagina {data?.page ?? 0} de {data?.pages ?? 0}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={(data?.page ?? 1) <= 1}
                  className="rounded-full border border-neutral-200 px-3 py-1.5 transition hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (data?.pages) setPage((prev) => Math.min(prev + 1, data.pages));
                  }}
                  disabled={!data?.pages || (data?.page ?? 0) >= (data?.pages ?? 0)}
                  className="rounded-full border border-neutral-200 px-3 py-1.5 transition hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>

          {selectedProduct && (
            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900">Descripcion destacada</h2>
                <span className="text-xs text-neutral-500">Mostrando: {selectedProduct.title}</span>
              </div>
              <ProductDescriptionCard
                {...selectedProduct}
                onToggleFavorite={toggleFavorite}
                highlights={
                  showHighlights
                    ? [
                        'Material premium certificado',
                        'Envio gratis desde 50 EUR',
                        'Devoluciones extendidas 60 dias',
                      ]
                    : undefined
                }
                stockMessage="Disponible. Entrega inmediata."
                shippingEstimate="Llega entre 24-48h con envio estandar."
                actionSlot={
                  <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-500">
                    <span>Tips UX:</span>
                    <span>- Ofrece variantes visibles.</span>
                    <span>- Refuerza beneficios principales.</span>
                    <span>- Incluye CTAs secundarios relevantes.</span>
                  </div>
                }
              />
            </section>
          )}
        </div>

        <aside className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900">Controles</h2>
          <div className="mt-3 space-y-3 text-sm text-neutral-700">
            <label className="flex items-center justify-between">
              Tema oscuro listado
              <input
                type="checkbox"
                checked={alternateTheme}
                onChange={(event) => setAlternateTheme(event.target.checked)}
                className="rounded border-neutral-300 text-indigo-500 focus:ring-indigo-500"
              />
            </label>
            <label className="flex items-center justify-between">
              Mostrar destacados en detalle
              <input
                type="checkbox"
                checked={showHighlights}
                onChange={(event) => setShowHighlights(event.target.checked)}
                className="rounded border-neutral-300 text-indigo-500 focus:ring-indigo-500"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-2 text-sm">
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-left transition hover:border-neutral-300"
            >
              Restaurar filtros
            </button>
            <button
              type="button"
              onClick={() => dispatch(clearAllWishes())}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-left transition hover:border-neutral-300"
            >
              Limpiar favoritos
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
