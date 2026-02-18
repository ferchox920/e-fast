'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useGetProductBySlugQuery } from '@/store/api/productApi';
import ProductGallery from './ProductGallery';
import ProductGallerySkeleton from './ProductGallerySkeleton';
import ProductQuestions from './ProductQuestions';
import type { ProductRead } from '@/types/product';
import { useCreateOrGetCartMutation, useAddCartItemMutation } from '@/store/api/cartApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCartError, selectCartStatus } from '@/store/slices/cartSlice';
import { selectWishIds, toggleWish } from '@/store/slices/wishesSlice';

interface ProductDetailClientProps {
  slug: string;
  initialProduct?: ProductRead | null;
}

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
      return data.detail;
    }
  }
  return fallback;
};

export function ProductDetailClient({ slug, initialProduct }: ProductDetailClientProps) {
  const dispatch = useAppDispatch();
  const wishIds = useAppSelector(selectWishIds);
  const cartStatus = useAppSelector(selectCartStatus);
  const cartError = useAppSelector(selectCartError);
  const { data, currentData, isLoading, isFetching, isError, error, refetch } =
    useGetProductBySlugQuery(slug, {
      skip: !slug,
      refetchOnMountOrArgChange: true,
    });

  const product = data ?? currentData ?? initialProduct ?? null;
  const productIdValue = product?.id ?? initialProduct?.id ?? null;
  const productId = productIdValue ? String(productIdValue) : null;
  const isFavorite = productId ? wishIds.includes(productId) : false;

  const isPending = isLoading || isFetching;

  const anomalyMessages = useMemo(() => {
    if (!product?.images?.length) return [] as string[];
    const primaryCount = product.images.filter((image) => image.is_primary).length;
    const messages: string[] = [];
    if (primaryCount === 0) {
      messages.push(
        'No hay imagen principal definida. Se mostrara la primera imagen ordenada como fallback.',
      );
    }
    if (primaryCount > 1) {
      messages.push(
        'Se recibieron varias imagenes principales. Se mostrara la primera segun sort_order.',
      );
    }
    return messages;
  }, [product?.images]);

  const galleryContent = useMemo(() => {
    if (isPending && !product) return <ProductGallerySkeleton />;
    if (!product?.images?.length) return null;
    return <ProductGallery images={product.images} />;
  }, [isPending, product]);

  useEffect(() => {
    if (!slug) return;
    if (!product && !isLoading) {
      refetch();
    }
  }, [slug, product, isLoading, refetch]);

  const variants = useMemo(() => product?.variants ?? [], [product?.variants]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const ensuredCartRef = useRef(false);

  const [createOrGetCart, { isLoading: ensuringCart }] = useCreateOrGetCartMutation();
  const [addCartItem, { isLoading: addingCartItem }] = useAddCartItemMutation();

  useEffect(() => {
    if (variants.length > 0) {
      setSelectedVariantId(String(variants[0].id));
    } else {
      setSelectedVariantId(null);
    }
    setQuantity(1);
    setFeedback(null);
    ensuredCartRef.current = false;
  }, [variants]);

  const selectedVariant = useMemo(
    () => variants.find((variant) => String(variant.id) === selectedVariantId) ?? null,
    [variants, selectedVariantId],
  );

  useEffect(() => {
    if (!variants.length) return;
    if (selectedVariant) return;
    const fallbackVariant = variants[0] ?? null;
    if (fallbackVariant) {
      setSelectedVariantId(String(fallbackVariant.id));
    }
  }, [variants, selectedVariant]);

  const sizeOptions = useMemo(() => {
    const sizes = new Set<string>();
    variants.forEach((variant) => {
      if (variant.size_label) sizes.add(variant.size_label);
    });
    return Array.from(sizes);
  }, [variants]);

  const selectedSize = selectedVariant?.size_label ?? null;
  const selectedColor = selectedVariant?.color_name ?? null;

  const colorOptions = useMemo(() => {
    const matchingVariants = selectedSize
      ? variants.filter((variant) => variant.size_label === selectedSize)
      : variants;
    const colors = new Set<string>();
    matchingVariants.forEach((variant) => {
      if (variant.color_name) colors.add(variant.color_name);
    });
    return Array.from(colors);
  }, [variants, selectedSize]);

  const hasStructuredOptions = sizeOptions.length > 0 || colorOptions.length > 0;

  const currencyCode = (product?.currency ?? 'USD') as string;
  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [currencyCode],
  );

  const displayPrice = selectedVariant?.price_override ?? product?.price ?? 0;
  const formattedPrice = priceFormatter.format(displayPrice);
  const basePrice = product?.price ?? null;
  const variantSku = selectedVariant?.sku ?? null;
  const availableStock = selectedVariant
    ? Math.max(selectedVariant.stock_on_hand - selectedVariant.stock_reserved, 0)
    : null;

  const decreaseQuantity = () => setQuantity((prev) => Math.max(prev - 1, 1));
  const increaseQuantity = () => setQuantity((prev) => Math.min(prev + 1, 99));
  const handleToggleFavorite = () => {
    if (!productId) return;
    dispatch(toggleWish(productId));
  };

  const handleSizeChange = (value: string) => {
    if (!variants.length) return;
    if (!value) {
      const fallbackVariant = variants[0] ?? null;
      setSelectedVariantId(fallbackVariant ? String(fallbackVariant.id) : null);
      return;
    }
    const currentColor = selectedVariant?.color_name ?? null;
    const nextVariant =
      variants.find(
        (variant) =>
          variant.size_label === value &&
          (currentColor ? variant.color_name === currentColor : true),
      ) ?? variants.find((variant) => variant.size_label === value);
    setSelectedVariantId(nextVariant ? String(nextVariant.id) : null);
  };

  const handleColorChange = (value: string) => {
    if (!variants.length) return;
    if (!value) {
      const fallbackVariant =
        variants.find((variant) => variant.size_label === selectedVariant?.size_label) ??
        variants[0] ??
        null;
      setSelectedVariantId(fallbackVariant ? String(fallbackVariant.id) : null);
      return;
    }
    const currentSize = selectedVariant?.size_label ?? null;
    const nextVariant =
      variants.find(
        (variant) =>
          (currentSize ? variant.size_label === currentSize : true) && variant.color_name === value,
      ) ?? variants.find((variant) => variant.color_name === value);
    setSelectedVariantId(nextVariant ? String(nextVariant.id) : null);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      setFeedback({ type: 'error', message: 'Selecciona una variante disponible.' });
      return;
    }
    try {
      setFeedback(null);
      if (!ensuredCartRef.current) {
        await createOrGetCart({ currency: product?.currency }).unwrap();
        ensuredCartRef.current = true;
      }
      await addCartItem({
        variantId: String(selectedVariant.id),
        quantity,
      }).unwrap();
      setFeedback({ type: 'success', message: 'Producto agregado al carrito.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: cartError ?? getErrorMessage(err, 'No pudimos agregar el producto al carrito.'),
      });
    }
  };

  const isProcessing = ensuringCart || addingCartItem;
  const addDisabled = isProcessing || !selectedVariant;

  if (isPending && !product) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-neutral-500">Producto</p>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              Cargando producto...
            </h1>
          </div>
          <div className="h-10 w-36 animate-pulse rounded-full border border-neutral-200 bg-neutral-100" />
        </header>

        <ProductGallerySkeleton />

        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-200" />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-neutral-500">Producto</p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            {product?.title ?? 'Cargando producto...'}
          </h1>
        </div>
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={!productId}
          aria-pressed={isFavorite}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
            isFavorite
              ? 'border-rose-500 bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span>{isFavorite ? '\u2665' : '\u2661'}</span>
          <span>{isFavorite ? 'En tu lista de deseos' : 'Agregar a favoritos'}</span>
        </button>
      </header>

      {isError && (
        <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>
            No pudimos cargar el producto.{` `}
            {error && 'status' in error ? `Codigo: ${String(error.status)}` : null}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-red-600 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isPending && !product && !isError && (
        <div className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          <p className="font-medium text-neutral-700">No encontramos este producto.</p>
          <p className="text-xs">
            Es posible que haya sido eliminado o que el slug sea incorrecto.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center justify-center rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
            >
              Reintentar
            </button>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              Ver catalogo
            </Link>
          </div>
        </div>
      )}

      {anomalyMessages.length ? (
        <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {anomalyMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}

      {galleryContent ?? (
        <div className="flex aspect-4/3 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500">
          Este producto no tiene imagenes disponibles.
        </div>
      )}

      {product && (
        <>
          <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <header className="space-y-1">
              <h2 className="text-sm font-semibold text-neutral-900">Comprar este producto</h2>
              <p className="text-xs text-neutral-500">
                Selecciona una variante disponible y ajusta la cantidad.
              </p>
            </header>

            {variants.length > 0 ? (
              <>
                {hasStructuredOptions ? (
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    {sizeOptions.length > 0 && (
                      <label className="flex flex-col gap-2 text-sm text-neutral-700 md:w-48">
                        Talla
                        <select
                          value={selectedSize ?? ''}
                          onChange={(event) => handleSizeChange(event.target.value)}
                          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        >
                          {sizeOptions.length > 1 ? (
                            <option value="">Selecciona una talla</option>
                          ) : null}
                          {sizeOptions.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {colorOptions.length > 0 && (
                      <label className="flex flex-col gap-2 text-sm text-neutral-700 md:w-48">
                        Color
                        <select
                          value={selectedColor ?? ''}
                          onChange={(event) => handleColorChange(event.target.value)}
                          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        >
                          {colorOptions.length > 1 ? (
                            <option value="">Selecciona un color</option>
                          ) : null}
                          {colorOptions.map((color) => (
                            <option key={color} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col gap-2 text-sm text-neutral-700">
                    Variante
                    <select
                      value={selectedVariantId ?? ''}
                      onChange={(event) => setSelectedVariantId(event.target.value)}
                      className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      {variants.map((variant) => (
                        <option key={variant.id} value={String(variant.id)}>
                          {`${variant.size_label} - ${variant.color_name}`}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="grid gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-700 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-400">Precio</p>
                    <p className="text-base font-semibold text-neutral-900">{formattedPrice}</p>
                    {selectedVariant?.price_override && basePrice !== null ? (
                      <span className="text-xs text-neutral-500">
                        Precio base: {priceFormatter.format(basePrice)}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-400">SKU</p>
                    <p className="font-medium text-neutral-800">{variantSku ?? 'No disponible'}</p>
                    {selectedVariant?.barcode ? (
                      <span className="text-xs text-neutral-500">
                        Barcode: {selectedVariant.barcode}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-400">Stock</p>
                    <p className="font-medium text-neutral-800">
                      {availableStock !== null ? `${availableStock} unidades` : 'Sin datos'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <span>Cantidad</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100"
                      aria-label="Disminuir cantidad"
                    >
                      -
                    </button>
                    <span className="min-w-[2.5rem] text-center font-semibold">{quantity}</span>
                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100"
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addDisabled}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? 'Agregando...' : 'Agregar al carrito'}
                </button>

                {feedback && (
                  <p
                    className={`text-xs ${
                      feedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {feedback.message}
                  </p>
                )}
                {!feedback && cartStatus === 'failed' && cartError ? (
                  <p className="text-xs text-red-600">{cartError}</p>
                ) : null}
              </>
            ) : (
              <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                Actualmente no hay variantes disponibles para la venta.
              </p>
            )}
          </section>

          <article className="space-y-4">
            {product.description && (
              <p className="text-base leading-relaxed text-neutral-700">{product.description}</p>
            )}
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-neutral-200 bg-white p-4">
                <dt className="text-xs uppercase tracking-wide text-neutral-500">Precio</dt>
                <dd className="text-xl font-semibold text-neutral-900">
                  {priceFormatter.format(product.price)}
                </dd>
                {selectedVariant?.price_override ? (
                  <p className="mt-1 text-xs text-neutral-500">Precio variante: {formattedPrice}</p>
                ) : null}
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-4">
                <dt className="text-xs uppercase tracking-wide text-neutral-500">Estado</dt>
                <dd className="text-sm text-neutral-800">
                  {product.active ? 'Disponible' : 'Inactivo'}
                </dd>
              </div>
            </dl>
          </article>

          {productId ? <ProductQuestions productId={productId} /> : null}
        </>
      )}
    </section>
  );
}

export default ProductDetailClient;
