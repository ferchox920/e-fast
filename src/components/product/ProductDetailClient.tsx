'use client';

import { useMemo } from 'react';
import { useGetProductQuery } from '@/store/api/productApi';
import ProductGallery from './ProductGallery';
import ProductGallerySkeleton from './ProductGallerySkeleton';

interface ProductDetailClientProps {
  slug: string;
}

export function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const { data, isLoading, isFetching, isError, error, refetch } = useGetProductQuery(slug, {
    skip: !slug,
    refetchOnMountOrArgChange: true,
  });

  const isPending = isLoading || isFetching;

  const anomalyMessages = useMemo(() => {
    if (!data?.images?.length) return [] as string[];
    const primaryCount = data.images.filter((image) => image.is_primary).length;
    const messages: string[] = [];
    if (primaryCount === 0) {
      messages.push(
        'No hay imagen principal definida. Se mostrará la primera imagen ordenada como fallback.',
      );
    }
    if (primaryCount > 1) {
      messages.push(
        'Se recibieron varias imágenes principales. Se mostrará la primera según sort_order.',
      );
    }
    return messages;
  }, [data?.images]);

  const galleryContent = useMemo(() => {
    if (isPending) return <ProductGallerySkeleton />;
    if (!data) return null;
    return <ProductGallery images={data.images} />;
  }, [data, isPending]);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">Producto</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          {data?.title ?? 'Cargando producto...'}
        </h1>
      </header>

      {isError && (
        <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>
            No pudimos cargar el producto.{` `}
            {error && 'status' in error ? `Código: ${String(error.status)}` : null}
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

      {anomalyMessages.length ? (
        <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {anomalyMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}

      {galleryContent ?? (
        <div className="flex aspect-4/3 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500">
          Este producto no tiene imágenes disponibles.
        </div>
      )}

      {data && (
        <article className="space-y-4">
          {data.description && (
            <p className="text-base leading-relaxed text-neutral-700">{data.description}</p>
          )}
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-neutral-500">Precio</dt>
              <dd className="text-xl font-semibold text-neutral-900">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: data.currency ?? 'ARS',
                }).format(data.price)}
              </dd>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-neutral-500">Estado</dt>
              <dd className="text-sm text-neutral-800">
                {data.active ? 'Disponible' : 'Inactivo'}
              </dd>
            </div>
          </dl>
        </article>
      )}
    </section>
  );
}

export default ProductDetailClient;
