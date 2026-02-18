'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminProductImagesPanel from '@/components/product/AdminProductImagesPanel';
import { useCreateAdminProductMutation } from '@/store/api/adminApi';
import { useGetCategoriesQuery, useListAllBrandsAdminQuery } from '@/store/api/catalogApi';
import type { ProductCreate, ProductVariantCreate } from '@/types/product';

type VariantDraft = {
  id: string;
  sku: string;
  size_label: string;
  color_name: string;
  color_hex: string;
  barcode: string;
  price_override: string;
  stock_on_hand: string;
  stock_reserved: string;
  reorder_point: string;
  reorder_qty: string;
  allow_backorder: boolean;
  allow_preorder: boolean;
  active: boolean;
};

type StatusMessage =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null;

const DEFAULT_CURRENCY = 'USD';

const asArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const items = (value as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return items as T[];
    }
  }
  return [];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const parseNumber = (value: string, fallback = 0) => {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const createVariantDraft = (): VariantDraft => ({
  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  sku: '',
  size_label: '',
  color_name: '',
  color_hex: '',
  barcode: '',
  price_override: '',
  stock_on_hand: '',
  stock_reserved: '',
  reorder_point: '',
  reorder_qty: '',
  allow_backorder: false,
  allow_preorder: false,
  active: true,
});

export default function AdminProductNewPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [variants, setVariants] = useState<VariantDraft[]>([createVariantDraft()]);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { data: brandsData, isLoading: brandsLoading } = useListAllBrandsAdminQuery();
  const [createProduct, createState] = useCreateAdminProductMutation();

  const categoryOptions = useMemo(
    () => asArray<{ id: string; name: string }>(categoriesData),
    [categoriesData],
  );
  const brandOptions = useMemo(
    () => asArray<{ id: string; name: string }>(brandsData),
    [brandsData],
  );

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched]);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    setSlug(event.target.value);
  };

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, createVariantDraft()]);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
  };

  const updateVariantField = (id: string, field: keyof VariantDraft, value: string | boolean) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === id
          ? {
              ...variant,
              [field]: value,
            }
          : variant,
      ),
    );
  };

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setSlugTouched(false);
    setDescription('');
    setPrice('');
    setCurrency(DEFAULT_CURRENCY);
    setCategoryId('');
    setBrandId('');
    setVariants([createVariantDraft()]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('El nombre del producto es obligatorio.');
      return;
    }

    const normalizedSlug = slug.trim() ? slugify(slug) : slugify(title);
    if (!normalizedSlug) {
      setFormError('No se pudo generar un slug vÃ¡lido. Verifica el nombre del producto.');
      return;
    }

    const basePrice = parseNumber(price, NaN);
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      setFormError('Ingresa un precio base vÃ¡lido mayor a cero.');
      return;
    }

    const preparedVariants: ProductVariantCreate[] | undefined =
      variants.length > 0 && variants.some((variant) => variant.sku.trim())
        ? variants
            .filter((variant) => variant.sku.trim())
            .map((variant) => {
              const overrideInput = variant.price_override.trim();
              const overrideValue = overrideInput ? Number(overrideInput) : null;
              return {
                sku: variant.sku.trim(),
                barcode: variant.barcode.trim() || undefined,
                size_label: variant.size_label.trim() || 'Talla Ãºnica',
                color_name: variant.color_name.trim() || 'Ãšnico',
                color_hex: variant.color_hex.trim() || undefined,
                stock_on_hand: parseNumber(variant.stock_on_hand, 0),
                stock_reserved: parseNumber(variant.stock_reserved, 0),
                price_override:
                  overrideValue !== null && Number.isFinite(overrideValue) ? overrideValue : null,
                active: variant.active,
                allow_backorder: variant.allow_backorder,
                allow_preorder: variant.allow_preorder,
                reorder_point: parseNumber(variant.reorder_point, 0),
                reorder_qty: parseNumber(variant.reorder_qty, 0),
              };
            })
        : undefined;

    const payload: ProductCreate = {
      title: title.trim(),
      slug: normalizedSlug,
      description: description.trim() || null,
      price: basePrice,
      currency: currency.trim() || DEFAULT_CURRENCY,
      category_id: categoryId || null,
      brand_id: brandId || null,
      variants: preparedVariants,
    };

    try {
      const created = await createProduct(payload).unwrap();
      setStatus({ type: 'success', message: 'Producto creado correctamente. Redirigiendoâ€¦' });
      setTimeout(() => {
        router.push(`/admin/products/${created.slug ?? created.id}/edit`);
      }, 600);
      resetForm();
    } catch (error) {
      console.error('createProduct', error);
      const message =
        (error as { data?: { detail?: string }; status?: unknown })?.data?.detail ??
        'Error al crear el producto. Intenta nuevamente.';
      setStatus({ type: 'error', message });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Nuevo producto</h1>
        <p className="text-sm text-neutral-600">
          Completa la informaciÃ³n necesaria para publicar un nuevo producto en el catÃ¡logo.
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

      {formError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {formError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">InformaciÃ³n bÃ¡sica</h2>
            <p className="text-sm text-neutral-500">
              Estos datos se mostrarÃ¡n en la ficha del producto y en las listas del catÃ¡logo.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Nombre</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Ej. Zapatillas deportivas"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Slug</span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugChange}
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="zapatillas-deportivas"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Precio base</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="0.00"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Moneda</span>
              <input
                type="text"
                value={currency}
                onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                className="h-10 rounded-lg border border-neutral-200 px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="USD"
              />
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-1 text-sm">
            <span className="text-neutral-600">DescripciÃ³n</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[140px] rounded-lg border border-neutral-200 px-3 py-2 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Describe el producto, sus caracterÃ­sticas y beneficios..."
            />
          </label>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">OrganizaciÃ³n</h2>
            <p className="text-sm text-neutral-500">
              Define a quÃ© categorÃ­a y marca pertenece el producto para facilitar su bÃºsqueda.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">CategorÃ­a</span>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                disabled={categoriesLoading}
              >
                <option value="">Selecciona una categorÃ­a</option>
                {categoriesLoading ? (
                  <option disabled>Cargando categorÃ­as...</option>
                ) : (
                  categoryOptions.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-neutral-600">Marca</span>
              <select
                value={brandId}
                onChange={(event) => setBrandId(event.target.value)}
                className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                disabled={brandsLoading}
              >
                <option value="">Selecciona una marca</option>
                {brandsLoading ? (
                  <option disabled>Cargando marcas...</option>
                ) : (
                  brandOptions.map((brand) => (
                    <option key={brand.id} value={String(brand.id)}>
                      {brand.name}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">ImÃ¡genes</h2>
            <p className="text-sm text-neutral-500">
              Guarda el producto primero para habilitar la gestiÃ³n de la galerÃ­a de imÃ¡genes.
            </p>
          </header>

          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
            <p>Una vez creado el producto podrÃ¡s subir imÃ¡genes desde la pantalla de ediciÃ³n.</p>
          </div>

          <div className="pointer-events-none mt-4 opacity-60">
            <AdminProductImagesPanel
              productId="new-product"
              images={[]}
              canEdit={false}
              disabledMessage="Guarda el producto para habilitar la subida de imÃ¡genes."
            />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Variantes e inventario</h2>
              <p className="text-sm text-neutral-500">
                Agrega variantes para gestionar stock especÃ­fico por talla, color u otras
                combinaciones.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddVariant}
              className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900"
            >
              AÃ±adir variante
            </button>
          </header>

          {variants.map((variant, index) => (
            <article
              key={variant.id}
              className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">
                    Variante #{index + 1}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Define el SKU y los datos de stock para esta combinaciÃ³n.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-neutral-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                      checked={variant.active}
                      onChange={() => updateVariantField(variant.id, 'active', !variant.active)}
                    />
                    Activa
                  </label>
                  {variants.length > 1 ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-600 hover:text-red-500"
                      onClick={() => handleRemoveVariant(variant.id)}
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                  SKU
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(event) => updateVariantField(variant.id, 'sku', event.target.value)}
                    className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="SKU-001"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                  Talla / Variante
                  <input
                    type="text"
                    value={variant.size_label}
                    onChange={(event) =>
                      updateVariantField(variant.id, 'size_label', event.target.value)
                    }
                    className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="M"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                  Color
                  <input
                    type="text"
                    value={variant.color_name}
                    onChange={(event) =>
                      updateVariantField(variant.id, 'color_name', event.target.value)
                    }
                    className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Azul"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                  Color HEX
                  <input
                    type="text"
                    value={variant.color_hex}
                    onChange={(event) =>
                      updateVariantField(variant.id, 'color_hex', event.target.value)
                    }
                    className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="#1D4ED8"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                  Barcode
                  <input
                    type="text"
                    value={variant.barcode}
                    onChange={(event) =>
                      updateVariantField(variant.id, 'barcode', event.target.value)
                    }
                    className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Opcional"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                  Precio especÃ­fico
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.price_override}
                    onChange={(event) =>
                      updateVariantField(variant.id, 'price_override', event.target.value)
                    }
                    className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Dejar vacÃ­o para usar precio base"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                  Stock disponible
                  <input
                    type="number"
                    min="0"
                    value={variant.stock_on_hand}
                    onChange={(event) =>
                      updateVariantField(variant.id, 'stock_on_hand', event.target.value)
                    }
                    className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="0"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                  Stock reservado
                  <input
                    type="number"
                    min="0"
                    value={variant.stock_reserved}
                    onChange={(event) =>
                      updateVariantField(variant.id, 'stock_reserved', event.target.value)
                    }
                    className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="0"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                  Punto de reorden
                  <input
                    type="number"
                    min="0"
                    value={variant.reorder_point}
                    onChange={(event) =>
                      updateVariantField(variant.id, 'reorder_point', event.target.value)
                    }
                    className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="0"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
                  Cantidad de reorden
                  <input
                    type="number"
                    min="0"
                    value={variant.reorder_qty}
                    onChange={(event) =>
                      updateVariantField(variant.id, 'reorder_qty', event.target.value)
                    }
                    className="h-9 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="0"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    checked={variant.allow_backorder}
                    onChange={() =>
                      updateVariantField(variant.id, 'allow_backorder', !variant.allow_backorder)
                    }
                  />
                  Permitir backorder
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    checked={variant.allow_preorder}
                    onChange={() =>
                      updateVariantField(variant.id, 'allow_preorder', !variant.allow_preorder)
                    }
                  />
                  Permitir preventa
                </label>
              </div>
            </article>
          ))}
        </section>

        <footer className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-lg border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
            onClick={resetForm}
            disabled={createState.isLoading}
          >
            Limpiar
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-1 disabled:opacity-60"
            disabled={createState.isLoading}
          >
            {createState.isLoading ? 'Guardando...' : 'Guardar producto'}
          </button>
        </footer>
      </form>
    </div>
  );
}
