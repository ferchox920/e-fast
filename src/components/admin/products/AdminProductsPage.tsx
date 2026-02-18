'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from 'next/navigation';
import { useGetProductsQuery } from '@/store/api/productApi';
import { useGetCategoriesQuery, useListAllBrandsAdminQuery } from '@/store/api/catalogApi';
import type { ProductVariant } from '@/types/product';
import type { Brand, Category } from '@/types/catalog';

const PAGE_SIZE = 20;

interface SelectionState {
  [productId: string]: boolean;
}

const formatCurrency = (value: number, currency?: string | null) => {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency ?? 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency ?? ''}`.trim();
  }
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);

const getPrimaryVariant = (variants: ProductVariant[]): ProductVariant | null => {
  if (!variants?.length) return null;
  const activeVariants = variants.filter((variant) => variant.active !== false);
  const sorted = (activeVariants.length ? activeVariants : variants).sort((a, b) => {
    if (a.price_override && !b.price_override) return -1;
    if (!a.price_override && b.price_override) return 1;
    return String(a.id).localeCompare(String(b.id));
  });
  return sorted[0] ?? null;
};

const computeStock = (variants: ProductVariant[]): number =>
  variants.reduce((total, variant) => total + (variant.stock_on_hand ?? 0), 0);

const buildQueryParams = (params: ReadonlyURLSearchParams | null) => {
  const search = params?.get('q') ?? '';
  const category = params?.get('category') ?? '';
  const brand = params?.get('brand') ?? '';
  const stock = params?.get('stock') ?? '';
  const pageParam = params?.get('page') ?? '1';
  const parsedPage = Number.parseInt(pageParam, 10);
  const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

  return {
    search,
    category,
    brand,
    stock,
    page,
  };
};

export default function AdminProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isTransitioning, startTransition] = useTransition();

  const [selection, setSelection] = useState<SelectionState>({});
  const [searchInput, setSearchInput] = useState('');

  const { search, category, brand, stock, page } = useMemo(
    () => buildQueryParams(searchParams),
    [searchParams],
  );

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateQuery = useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      if (!params.has('page')) {
        params.set('page', '1');
      }
      if (changes.page) {
        params.set('page', changes.page);
      }
      const queryString = params.toString();
      const target = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(target, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const { data, isLoading, isFetching, isError, error } = useGetProductsQuery({
    search: search || undefined,
    category_id: category || undefined,
    brand_id: brand || undefined,
    stock_status: stock || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: brandsData } = useListAllBrandsAdminQuery();

  const categoryOptions = useMemo<Category[]>(() => categoriesData ?? [], [categoriesData]);
  const brandOptions = useMemo<Brand[]>(() => brandsData ?? [], [brandsData]);

  const products = useMemo(() => data?.items ?? [], [data?.items]);
  const totalPages = data?.pages ?? 1;
  const totalItems = data?.total ?? products.length;

  const isBusy = isLoading || isFetching || isTransitioning;

  useEffect(() => {
    if (!products.length) {
      setSelection({});
      return;
    }
    setSelection((prev) => {
      const next: SelectionState = {};
      products.forEach((product) => {
        if (prev[product.id]) {
          next[product.id] = true;
        }
      });
      return next;
    });
  }, [products]);

  const visibleSelectionCount = useMemo(
    () => Object.values(selection).filter(Boolean).length,
    [selection],
  );

  const isAllSelected = useMemo(() => {
    if (!products.length) return false;
    return products.every((product) => selection[product.id]);
  }, [products, selection]);

  const toggleSelectAll = () => {
    if (!products.length) return;
    setSelection(() => {
      const next: SelectionState = {};
      if (!isAllSelected) {
        products.forEach((product) => {
          next[product.id] = true;
        });
      }
      return next;
    });
  };

  const toggleSelection = (productId: string) => {
    setSelection((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => {
      updateQuery({ q: searchInput.trim(), page: '1' });
    });
  };

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    startTransition(() => {
      updateQuery({ category: value || null, page: '1' });
    });
  };

  const handleBrandChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    startTransition(() => {
      updateQuery({ brand: value || null, page: '1' });
    });
  };

  const handleStockToggle = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    startTransition(() => {
      updateQuery({ stock: checked ? 'low' : null, page: '1' });
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      updateQuery({ q: null, category: null, brand: null, stock: null, page: '1' });
    });
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    startTransition(() => {
      updateQuery({ page: String(nextPage) });
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Gestión de productos</h1>
        <p className="text-sm text-neutral-600">
          Administra el catálogo, revisa existencias y mantén la información actualizada.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-1 min-w-[220px] items-center gap-2"
        >
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre o SKU…"
            className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
            disabled={isBusy}
          >
            Buscar
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="category-filter" className="text-xs font-medium text-neutral-500">
              Categoría
            </label>
            <select
              id="category-filter"
              className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={category}
              onChange={handleCategoryChange}
              disabled={isBusy && !categoryOptions.length}
            >
              <option value="">Todas</option>
              {categoryOptions.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="brand-filter" className="text-xs font-medium text-neutral-500">
              Marca
            </label>
            <select
              id="brand-filter"
              className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={brand}
              onChange={handleBrandChange}
              disabled={isBusy && !brandOptions.length}
            >
              <option value="">Todas</option>
              {brandOptions.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <label className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
              checked={stock === 'low'}
              onChange={handleStockToggle}
              disabled={isBusy}
            />
            Stock bajo
          </label>

          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex h-10 items-center rounded-lg border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            disabled={!search && !category && !brand && stock !== 'low'}
          >
            Limpiar filtros
          </button>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex h-10 items-center rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-1"
        >
          Crear producto
        </Link>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-neutral-600">
            <span>
              Mostrando {products.length} de {totalItems} productos
            </span>
            {isBusy ? <span className="text-xs text-neutral-400">Actualizando…</span> : null}
          </div>
          {visibleSelectionCount > 0 ? (
            <p className="text-xs font-semibold text-indigo-600">
              {visibleSelectionCount} seleccionado{visibleSelectionCount > 1 ? 's' : ''}
            </p>
          ) : null}
        </header>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    aria-label="Seleccionar todos los productos visibles"
                  />
                </th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">SKU principal</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {isError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-sm text-red-600">
                    No pudimos cargar los productos.{' '}
                    {error && typeof error === 'object' && 'status' in error
                      ? `Código ${String((error as { status?: unknown }).status)}`
                      : 'Reintenta en unos segundos.'}
                  </td>
                </tr>
              ) : null}

              {!isError && isBusy && !products.length ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse text-sm text-neutral-400">
                    <td className="px-4 py-4">
                      <div className="h-4 w-4 rounded bg-neutral-200" />
                    </td>
                    <td className="flex items-center gap-3 px-4 py-4">
                      <div className="h-12 w-12 rounded-lg bg-neutral-200" />
                      <div className="space-y-2">
                        <div className="h-3 w-32 rounded bg-neutral-200" />
                        <div className="h-3 w-20 rounded bg-neutral-200" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-16 rounded bg-neutral-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-12 rounded bg-neutral-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-10 rounded bg-neutral-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-20 rounded bg-neutral-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-16 rounded bg-neutral-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="ml-auto h-3 w-12 rounded bg-neutral-200" />
                    </td>
                  </tr>
                ))
              ) : !isError && products.length ? (
                products.map((product) => {
                  const primaryVariant = getPrimaryVariant(product.variants ?? []);
                  const totalStock = computeStock(product.variants ?? []);
                  const statusLabel = product.active ? 'Publicado' : 'Borrador';
                  const statusClasses = product.active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-neutral-200 text-neutral-700';
                  const thumbnail = product.primary_image?.url ?? product.images?.[0]?.url ?? null;

                  return (
                    <tr
                      key={product.id}
                      className="text-sm text-neutral-700 transition hover:bg-neutral-50"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                          checked={!!selection[product.id]}
                          onChange={() => toggleSelection(product.id)}
                          aria-label={`Seleccionar ${product.title}`}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                            {thumbnail ? (
                              <Image
                                src={thumbnail}
                                alt={product.primary_image?.alt_text ?? product.title}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-[180px]">
                            <p className="font-semibold text-neutral-900 line-clamp-1">
                              {product.title}
                            </p>
                            <p className="text-xs text-neutral-500">Slug: {product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-600">
                          {primaryVariant?.sku ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-neutral-700">
                          {formatCurrency(
                            primaryVariant?.price_override ?? product.price,
                            product.currency,
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            totalStock < 5
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {formatNumber(totalStock)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-600">
                          {product.category?.name ?? 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClasses}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <Link
                            href={`/admin/products/${product.slug ?? product.id}/edit`}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                          >
                            Editar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-neutral-500">
                    {search || category || brand || stock === 'low'
                      ? 'No se encontraron productos con los filtros aplicados.'
                      : 'Aún no hay productos disponibles. Crea tu primer producto para comenzar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 text-sm text-neutral-600">
          <div>
            Página {page} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-3 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-800 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-3 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-800 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
