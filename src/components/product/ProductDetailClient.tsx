'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useGetProductQuery } from '@/store/api/productApi';
import ProductGallery from './ProductGallery';
import ProductGallerySkeleton from './ProductGallerySkeleton';
import type { ProductRead } from '@/types/product';
import { useCreateOrGetCartMutation, useAddCartItemMutation } from '@/store/api/cartApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
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
  const { data, currentData, isLoading, isFetching, isError, error, refetch } = useGetProductQuery(
    slug,
    {
      skip: !slug,
      refetchOnMountOrArgChange: true,
    },
  );

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

  const decreaseQuantity = () => setQuantity((prev) => Math.max(prev - 1, 1));
  const increaseQuantity = () => setQuantity((prev) => Math.min(prev + 1, 99));
  const handleToggleFavorite = () => {
    if (!productId) return;
    dispatch(toggleWish(productId));
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
        message: getErrorMessage(err, 'No pudimos agregar el producto al carrito.'),
      });
    }
  };

  const isProcessing = ensuringCart || addingCartItem;
  const addDisabled = isProcessing || !selectedVariant;

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
                  {new Intl.NumberFormat('es-ES', {
                    style: 'currency',
                    currency: product.currency ?? 'ARS',
                  }).format(product.price)}
                </dd>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-4">
                <dt className="text-xs uppercase tracking-wide text-neutral-500">Estado</dt>
                <dd className="text-sm text-neutral-800">
                  {product.active ? 'Disponible' : 'Inactivo'}
                </dd>
              </div>
            </dl>
          </article>
        </>
      )}
    </section>
  );
}

export default ProductDetailClient;
