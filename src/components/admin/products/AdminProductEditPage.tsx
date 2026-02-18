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
import Link from 'next/link';
import AdminProductImagesPanel from '@/components/product/AdminProductImagesPanel';
import {
  useGetProductBySlugQuery,
  useUpdateProductMutation,
  useUpdateVariantMutation,
} from '@/store/api/productApi';
import { useGetCategoriesQuery, useListAllBrandsAdminQuery } from '@/store/api/catalogApi';
import type {
  Product,
  ProductImageRead,
  ProductVariant,
  ProductUpdate,
  ProductVariantUpdate,
} from '@/types/product';

interface AdminProductEditPageProps {
  slug: string;
}

interface ProductFormState {
  title: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  material: string;
  care: string;
  gender: string;
  season: string;
  fit: string;
  tags: string;
  category_id: string;
  brand_id: string;
  active: boolean;
}

interface VariantFormState {
  id: string;
  sku: string;
  price_override: string;
  stock_on_hand: string;
  stock_reserved: string;
  reorder_point: string;
  reorder_qty: string;
  allow_backorder: boolean;
  allow_preorder: boolean;
  active: boolean;
}

type VariantFormsMap = Record<string, VariantFormState>;

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const numberToString = (value?: number | null, allowZero = true) => {
  if (typeof value === 'number') {
    if (!allowZero && value === 0) return '';
    return String(value);
  }
  return '';
};

const buildFormState = (product: Product): ProductFormState => ({
  title: product.title ?? '',
  slug: product.slug ?? '',
  description: product.description ?? '',
  price: String(product.price ?? 0),
  currency: String(product.currency ?? 'USD'),
  material: product.material ?? '',
  care: product.care ?? '',
  gender: product.gender ?? '',
  season: product.season ?? '',
  fit: product.fit ?? '',
  tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
  category_id: product.category_id ? String(product.category_id) : '',
  brand_id: product.brand_id ? String(product.brand_id) : '',
  active: product.active ?? false,
});

const buildVariantForms = (variants: ProductVariant[] | undefined): VariantFormsMap => {
  if (!variants?.length) return {};
  const map: VariantFormsMap = {};
  variants.forEach((variant) => {
    map[String(variant.id)] = {
      id: String(variant.id),
      sku: variant.sku ?? '',
      price_override: numberToString(variant.price_override, false),
      stock_on_hand: numberToString(variant.stock_on_hand, true),
      stock_reserved: numberToString(variant.stock_reserved, true),
      reorder_point: numberToString(variant.reorder_point, false),
      reorder_qty: numberToString(variant.reorder_qty, false),
      allow_backorder: variant.allow_backorder ?? false,
      allow_preorder: variant.allow_preorder ?? false,
      active: variant.active ?? true,
    };
  });
  return map;
};

const parseNumber = (value: string, fallback: number | null = null) => {
  const trimmed = value.trim();
  if (!trimmed.length) return fallback;
  const parsed = Number(trimmed.replace(',', '.'));
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '--';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export default function AdminProductEditPage({ slug }: AdminProductEditPageProps) {
  const [isTransitioning, startTransition] = useTransition();

  const [productData, setProductData] = useState<Product | null>(null);
  const [formState, setFormState] = useState<ProductFormState | null>(null);
  const [variantForms, setVariantForms] = useState<VariantFormsMap>({});
  const [status, setStatus] = useState<FeedbackState | null>(null);
  const [variantFeedback, setVariantFeedback] = useState<Record<string, FeedbackState | null>>({});
  const [savingVariants, setSavingVariants] = useState<Record<string, boolean>>({});

  const { data, isLoading, isFetching, isError, error, refetch } = useGetProductBySlugQuery(slug);

  const [updateProduct, updateProductResult] = useUpdateProductMutation();
  const [updateVariant] = useUpdateVariantMutation();

  const { data: categories } = useGetCategoriesQuery();
  const { data: brands } = useListAllBrandsAdminQuery();

  useEffect(() => {
    if (!data) return;
    setProductData(data);
    setFormState(buildFormState(data));
    setVariantForms(buildVariantForms(data.variants));
  }, [data]);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const handleFormChange = useCallback((field: keyof ProductFormState, value: string | boolean) => {
    setFormState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  }, []);

  const handleToggleActive = useCallback(() => {
    setFormState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        active: !prev.active,
      };
    });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productData || !formState) return;
    const payload: ProductUpdate = {
      title: formState.title.trim(),
      slug: formState.slug.trim(),
      description: formState.description.trim() || null,
      price: parseNumber(formState.price, productData.price) ?? productData.price,
      currency: formState.currency.trim() || productData.currency,
      material: formState.material.trim() || null,
      care: formState.care.trim() || null,
      gender: formState.gender.trim() || null,
      season: formState.season.trim() || null,
      fit: formState.fit.trim() || null,
      tags: formState.tags
        ? formState.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : null,
      category_id: formState.category_id || null,
      brand_id: formState.brand_id || null,
      active: formState.active,
    };

    try {
      const updated = await updateProduct({
        productId: String(productData.id),
        body: payload,
      }).unwrap();
      setProductData(updated);
      setStatus({ type: 'success', message: 'Producto actualizado correctamente.' });
      startTransition(() => {
        refetch();
      });
    } catch (mutationError) {
      console.error('updateProduct', mutationError);
      setStatus({
        type: 'error',
        message: 'No se pudo actualizar el producto. Intenta nuevamente.',
      });
    }
  };

  const handleImagesChange = useCallback((images: ProductImageRead[]) => {
    setProductData((prev) => {
      if (!prev) return prev;
      const nextPrimary = images.find((image) => image.is_primary) ?? images[0] ?? null;
      return {
        ...prev,
        images,
        primary_image: nextPrimary,
      };
    });
  }, []);

  const handleVariantInputChange = useCallback(
    (variantId: string, field: keyof VariantFormState, value: string) => {
      setVariantForms((prev) => {
        const current = prev[variantId];
        if (!current) return prev;
        return {
          ...prev,
          [variantId]: {
            ...current,
            [field]: value,
          },
        };
      });
    },
    [],
  );

  const handleVariantToggle = useCallback((variantId: string, field: keyof VariantFormState) => {
    setVariantForms((prev) => {
      const current = prev[variantId];
      if (!current) return prev;
      return {
        ...prev,
        [variantId]: {
          ...current,
          [field]: !current[field],
        },
      };
    });
  }, []);

  const handleVariantSave = useCallback(
    async (variantId: string) => {
      const form = variantForms[variantId];
      if (!form || !productData) return;

      setSavingVariants((prev) => ({ ...prev, [variantId]: true }));
      setVariantFeedback((prev) => ({ ...prev, [variantId]: null }));

      const currentVariant = productData.variants.find(
        (variant) => String(variant.id) === variantId,
      );

      const payload: ProductVariantUpdate = {
        sku: form.sku.trim() || undefined,
        price_override: parseNumber(form.price_override, undefined) ?? undefined,
        stock_on_hand:
          parseNumber(form.stock_on_hand, currentVariant?.stock_on_hand ?? 0) ?? undefined,
        stock_reserved:
          parseNumber(form.stock_reserved, currentVariant?.stock_reserved ?? 0) ?? undefined,
        reorder_point: parseNumber(form.reorder_point, undefined) ?? undefined,
        reorder_qty: parseNumber(form.reorder_qty, undefined) ?? undefined,
        allow_backorder: form.allow_backorder,
        allow_preorder: form.allow_preorder,
        active: form.active,
      };

      try {
        const updated = await updateVariant({
          variantId,
          body: payload,
        }).unwrap();

        setProductData((prev) => {
          if (!prev) return prev;
          const updatedVariants = prev.variants.map((variant) =>
            String(variant.id) === variantId ? updated : variant,
          );
          return {
            ...prev,
            variants: updatedVariants,
          };
        });

        setVariantForms((prev) => ({
          ...prev,
          [variantId]: {
            id: String(updated.id),
            sku: updated.sku ?? '',
            price_override: numberToString(updated.price_override, false),
            stock_on_hand: numberToString(updated.stock_on_hand, true),
            stock_reserved: numberToString(updated.stock_reserved, true),
            reorder_point: numberToString(updated.reorder_point, false),
            reorder_qty: numberToString(updated.reorder_qty, false),
            allow_backorder: updated.allow_backorder ?? false,
            allow_preorder: updated.allow_preorder ?? false,
            active: updated.active ?? true,
          },
        }));

        setVariantFeedback((prev) => ({
          ...prev,
          [variantId]: { type: 'success', message: 'Variante actualizada.' },
        }));
      } catch (variantError) {
        console.error('updateVariant', variantError);
        setVariantFeedback((prev) => ({
          ...prev,
          [variantId]: {
            type: 'error',
            message: 'No se pudo actualizar la variante.',
          },
        }));
      } finally {
        setSavingVariants((prev) => ({ ...prev, [variantId]: false }));
      }
    },
    [productData, updateVariant, variantForms],
  );
  const totalStock = useMemo(() => {
    if (!productData?.variants?.length) return 0;
    return productData.variants.reduce((sum, variant) => sum + (variant.stock_on_hand ?? 0), 0);
  }, [productData?.variants]);

  if (isLoading || (!productData && isFetching)) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-neutral-200" />
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="h-96 animate-pulse rounded-lg bg-neutral-100" />
          <div className="h-96 animate-pulse rounded-lg bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (isError || !productData || !formState) {
    return (
      <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        <p className="font-semibold">No pudimos cargar el producto solicitado.</p>
        {error && typeof error === 'object' && 'status' in error ? (
          <p className="text-xs text-red-500/80">
            Código: {String((error as { status?: unknown }).status)}
          </p>
        ) : null}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700"
          >
            Reintentar
          </button>
          <Link
            href="/admin/products"
            className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
          >
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wider text-neutral-500">Producto</p>
        <h1 className="text-2xl font-semibold text-neutral-900">{productData.title}</h1>
        <p className="text-sm text-neutral-600">
          Última actualización: {formatDateTime(productData.updated_at ?? productData.created_at)}
        </p>
      </header>

      {status ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {status.message}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Información general</h2>
              <p className="text-sm text-neutral-500">
                Actualiza los atributos principales visibles en la tienda.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                  checked={formState.active}
                  onChange={handleToggleActive}
                />
                Publicado
              </label>
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-1"
                disabled={updateProductResult.isLoading || isTransitioning}
              >
                {updateProductResult.isLoading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Nombre</span>
              <input
                type="text"
                value={formState.title}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleFormChange('title', event.target.value)
                }
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Slug</span>
              <input
                type="text"
                value={formState.slug}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleFormChange('slug', event.target.value)
                }
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Precio base</span>
              <input
                type="number"
                step="0.01"
                value={formState.price}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleFormChange('price', event.target.value)
                }
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Moneda</span>
              <input
                type="text"
                value={formState.currency}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleFormChange('currency', event.target.value)
                }
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-600">Descripción</span>
            <textarea
              value={formState.description}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                handleFormChange('description', event.target.value)
              }
              className="min-h-[120px] rounded-lg border border-neutral-200 px-3 py-2 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Categoría</span>
              <select
                value={formState.category_id}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  handleFormChange('category_id', event.target.value)
                }
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Sin categoría</option>
                {categories?.map((categoryOption) => (
                  <option key={categoryOption.id} value={String(categoryOption.id)}>
                    {categoryOption.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Marca</span>
              <select
                value={formState.brand_id}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  handleFormChange('brand_id', event.target.value)
                }
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Sin marca</option>
                {brands?.map((brandOption) => (
                  <option key={brandOption.id} value={String(brandOption.id)}>
                    {brandOption.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Material</span>
              <input
                type="text"
                value={formState.material}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleFormChange('material', event.target.value)
                }
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Cuidados</span>
              <input
                type="text"
                value={formState.care}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleFormChange('care', event.target.value)
                }
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Género</span>
              <input
                type="text"
                value={formState.gender}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleFormChange('gender', event.target.value)
                }
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Temporada</span>
              <input
                type="text"
                value={formState.season}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleFormChange('season', event.target.value)
                }
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Ajuste</span>
              <input
                type="text"
                value={formState.fit}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleFormChange('fit', event.target.value)
                }
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Tags (coma separada)</span>
              <input
                type="text"
                value={formState.tags}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleFormChange('tags', event.target.value)
                }
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
          </div>
        </form>

        <div className="space-y-4">
          <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Imágenes del producto</h2>
            <p className="mb-4 text-sm text-neutral-500">
              Gestiona la galería y establece la imagen principal mostrada en el catálogo.
            </p>
            <AdminProductImagesPanel
              productId={String(productData.id)}
              slug={productData.slug}
              images={productData.images ?? []}
              onImagesChange={handleImagesChange}
            />
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Resumen de inventario</h2>
            <p className="text-sm text-neutral-500">
              Stock total disponible: <span className="font-semibold">{totalStock}</span> unidades.
            </p>
            <p className="text-xs text-neutral-400">
              Actualiza los niveles de stock por variante en la sección de variantes.
            </p>
          </section>
        </div>
      </section>
      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Variantes</h2>
            <p className="text-sm text-neutral-500">
              Gestiona SKUs, precios específicos y disponibilidad por variante.
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {Object.values(variantForms).length ? (
            Object.values(variantForms).map((variantForm) => {
              const variantId = variantForm.id;
              const feedback = variantFeedback[variantId];
              const isSaving = savingVariants[variantId];

              return (
                <article
                  key={variantId}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">
                        Variante #{variantForm.sku || variantId}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        ID: {variantId} - Stock actual: {variantForm.stock_on_hand || '0'} unidades
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-neutral-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                        checked={variantForm.active}
                        onChange={() => handleVariantToggle(variantId, 'active')}
                      />
                      Activa
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                      SKU
                      <input
                        type="text"
                        value={variantForm.sku}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handleVariantInputChange(variantId, 'sku', event.target.value)
                        }
                        className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                      Precio específico
                      <input
                        type="number"
                        step="0.01"
                        value={variantForm.price_override}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handleVariantInputChange(variantId, 'price_override', event.target.value)
                        }
                        placeholder="Usar precio base"
                        className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                      Stock disponible
                      <input
                        type="number"
                        value={variantForm.stock_on_hand}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handleVariantInputChange(variantId, 'stock_on_hand', event.target.value)
                        }
                        className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                      Stock reservado
                      <input
                        type="number"
                        value={variantForm.stock_reserved}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handleVariantInputChange(variantId, 'stock_reserved', event.target.value)
                        }
                        className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                      Reorder point
                      <input
                        type="number"
                        value={variantForm.reorder_point}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handleVariantInputChange(variantId, 'reorder_point', event.target.value)
                        }
                        className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                      Reorder quantity
                      <input
                        type="number"
                        value={variantForm.reorder_qty}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handleVariantInputChange(variantId, 'reorder_qty', event.target.value)
                        }
                        className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-600">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                        checked={variantForm.allow_backorder}
                        onChange={() => handleVariantToggle(variantId, 'allow_backorder')}
                      />
                      Permitir backorder
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                        checked={variantForm.allow_preorder}
                        onChange={() => handleVariantToggle(variantId, 'allow_preorder')}
                      />
                      Permitir preventa
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleVariantSave(variantId)}
                      className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Guardando...' : 'Guardar variante'}
                    </button>
                    {feedback ? (
                      <p
                        className={`text-xs font-medium ${
                          feedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {feedback.message}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : (
            <p className="text-sm text-neutral-500">
              Este producto aún no tiene variantes registradas.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <header>
          <h2 className="text-lg font-semibold text-neutral-900">Panel de inventario</h2>
          <p className="text-sm text-neutral-500">
            Ajusta los umbrales de reabastecimiento para evitar quiebres de stock.
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3">Variante</th>
                <th className="px-4 py-3">Stock actual</th>
                <th className="px-4 py-3">Reorder point</th>
                <th className="px-4 py-3">Reorder qty</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {Object.values(variantForms).length ? (
                Object.values(variantForms).map((variantForm) => {
                  const variantId = variantForm.id;
                  const isSaving = savingVariants[variantId];
                  const feedback = variantFeedback[variantId];
                  return (
                    <tr key={`inventory-${variantId}`} className="text-neutral-700">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold">{variantForm.sku || variantId}</span>
                          <span className="text-xs text-neutral-500">ID interno: {variantId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{variantForm.stock_on_hand || '0'}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={variantForm.reorder_point}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            handleVariantInputChange(variantId, 'reorder_point', event.target.value)
                          }
                          className="h-9 w-24 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={variantForm.reorder_qty}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            handleVariantInputChange(variantId, 'reorder_qty', event.target.value)
                          }
                          className="h-9 w-24 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleVariantSave(variantId)}
                            className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900 disabled:opacity-50"
                            disabled={isSaving}
                          >
                            {isSaving ? 'Guardando...' : 'Guardar inventario'}
                          </button>
                          {feedback ? (
                            <span
                              className={`text-xs ${
                                feedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              {feedback.message}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                    No hay variantes disponibles para mostrar inventario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
