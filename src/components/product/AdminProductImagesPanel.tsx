'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

import {
  productApi,
  useAddImageMutation,
  useSetPrimaryImageMutation,
} from '@/store/api/productApi';
import { useAppDispatch } from '@/store/hooks';
import type { ProductImageCreate, ProductImageRead } from '@/types/product';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

interface AdminProductImagesPanelProps {
  productId: string;
  slug?: string;
  images: ProductImageRead[];
  onImagesChange?: (images: ProductImageRead[]) => void;
  canEdit?: boolean;
  disabledMessage?: string;
}

type StatusMessage = {
  type: 'success' | 'error';
  message: string;
};

const FALLBACK_ALT = 'Imagen del producto';

function sendTelemetry(event: string, payload: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('telemetry', { detail: { event, payload } }));
    }
  } catch {
    // ignore telemetry errors
  } finally {
    if (typeof console !== 'undefined') {
      console.info('[telemetry]', event, payload);
    }
  }
}

function getErrorMessage(error: unknown): string {
  if (!error) return 'Error desconocido';
  if (typeof error === 'string') return error;

  if (typeof error === 'object') {
    const fetchError = error as FetchBaseQueryError & { data?: unknown };
    if ('status' in fetchError) {
      const status = fetchError.status;
      const payload = 'data' in fetchError ? fetchError.data : undefined;

      if (payload && typeof payload === 'object' && payload !== null && 'detail' in payload) {
        return `Error ${String(status)}: ${String((payload as { detail: unknown }).detail)}`;
      }
      if (payload && typeof payload === 'string') {
        return `Error ${String(status)}: ${payload}`;
      }
      return `Error ${String(status)}`;
    }
  }
  return 'No se pudo completar la accion';
}

function sortImages(images: ProductImageRead[]): ProductImageRead[] {
  return [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    const orderA = a.sort_order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sort_order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.id).localeCompare(String(b.id));
  });
}

export function AdminProductImagesPanel({
  productId,
  slug,
  images,
  onImagesChange,
  canEdit = true,
  disabledMessage = 'No tienes permisos para gestionar las imagenes.',
}: AdminProductImagesPanelProps) {
  const dispatch = useAppDispatch();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [markAsPrimary, setMarkAsPrimary] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [addImage, addImageState] = useAddImageMutation();
  const [setPrimaryImage, setPrimaryImageState] = useSetPrimaryImageMutation();

  const isReadOnly = !canEdit;
  const sortedImages = useMemo(() => sortImages(images), [images]);
  const primaryCount = useMemo(
    () => sortedImages.filter((image) => image.is_primary).length,
    [sortedImages],
  );

  const anomalyMessages = useMemo(() => {
    if (!sortedImages.length) return [] as string[];
    const messages: string[] = [];
    if (primaryCount === 0) {
      messages.push(
        'No hay imagen principal definida. Se mostrara la primera imagen ordenada como fallback.',
      );
    }
    if (primaryCount > 1) {
      messages.push(
        'Hay varias imagenes marcadas como principales. Se usara la primera segun sort_order.',
      );
    }
    return messages;
  }, [primaryCount, sortedImages]);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 3500);
    return () => clearTimeout(timer);
  }, [status]);

  const resetForm = () => {
    setUrl('');
    setAltText('');
    setMarkAsPrimary(false);
    setFormError(null);
  };

  const updateCaches = (nextImages: ProductImageRead[]) => {
    if (slug) {
      dispatch(
        productApi.util.updateQueryData('getProductBySlug', slug, (draft) => {
          draft.images = nextImages;
          const primary = nextImages.find((image) => image.is_primary) ?? null;
          draft.primary_image = primary ?? null;
        }),
      );
    }
    onImagesChange?.(nextImages);
  };

  const handleAddImage = async () => {
    if (isReadOnly) {
      setStatus({ type: 'error', message: disabledMessage });
      return;
    }

    setFormError(null);

    if (!url.trim()) {
      setFormError('La URL es obligatoria');
      return;
    }

    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.protocol.startsWith('http')) {
        throw new Error('Invalid protocol');
      }
    } catch {
      setFormError('Debes ingresar una URL valida (https://...)');
      return;
    }

    const payload: ProductImageCreate = {
      url: url.trim(),
      alt_text: altText.trim() ? altText.trim() : null,
      is_primary: markAsPrimary,
    };

    try {
      const createdImage = await addImage({ productId, body: payload }).unwrap();

      const nextImages = markAsPrimary
        ? sortedImages.map((image) => ({ ...image, is_primary: image.id === createdImage.id }))
        : [...sortedImages];

      const mergedImages = markAsPrimary
        ? [
            { ...createdImage, is_primary: true },
            ...nextImages.filter((image) => image.id !== createdImage.id),
          ]
        : [...nextImages, createdImage];

      updateCaches(sortImages(mergedImages));

      setStatus({ type: 'success', message: 'Imagen agregada correctamente.' });
      sendTelemetry('image_added', { productId, imageId: createdImage.id });
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) });
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    if (isReadOnly) {
      setStatus({ type: 'error', message: disabledMessage });
      return;
    }

    try {
      const updatedProduct = await setPrimaryImage({ productId, imageId }).unwrap();
      updateCaches(sortImages(updatedProduct.images));
      setStatus({ type: 'success', message: 'Imagen principal actualizada.' });
      sendTelemetry('image_set_primary', { productId, imageId });
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) });
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Imagenes del producto</h3>
          <p className="text-sm text-neutral-500">Gestiona las imagenes publicas del producto.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isReadOnly) return;
            setIsFormOpen((value) => !value);
            resetForm();
          }}
          disabled={isReadOnly}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isFormOpen ? 'Cancelar' : 'Agregar imagen'}
        </button>
      </header>

      <p className="text-xs text-neutral-500">
        Revisa <span className="font-mono">docs/product-images.md</span> para contratos y ejemplos.
      </p>

      {anomalyMessages.length ? (
        <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {anomalyMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}

      {isReadOnly ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {disabledMessage}
        </p>
      ) : null}

      {status ? (
        <div
          role="status"
          className={`rounded-md border px-3 py-2 text-sm ${
            status.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {status.message}
        </div>
      ) : null}

      {isFormOpen ? (
        <form
          className="space-y-4 rounded-md border border-neutral-200 bg-neutral-50 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (addImageState.isLoading || isReadOnly) return;
            void handleAddImage();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-neutral-700">
              URL de la imagen *
              <input
                type="url"
                required
                disabled={isReadOnly}
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://"
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-neutral-700">
              Texto alternativo
              <input
                disabled={isReadOnly}
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="Descripcion para accesibilidad"
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={markAsPrimary}
              onChange={(event) => setMarkAsPrimary(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-600"
              disabled={isReadOnly}
            />
            Marcar como imagen principal
          </label>

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          {addImageState.error ? (
            <p className="text-sm text-red-600">{getErrorMessage(addImageState.error)}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={addImageState.isLoading || isReadOnly}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {addImageState.isLoading ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  Guardando...
                </>
              ) : (
                'Guardar imagen'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500"
            >
              Cerrar
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sortedImages.length === 0 ? (
          <div className="col-span-full flex h-40 items-center justify-center rounded-md border border-dashed border-neutral-200 text-sm text-neutral-500">
            Este producto aun no tiene imagenes.
          </div>
        ) : (
          sortedImages.map((image) => {
            const isActive = image.is_primary;

            return (
              <article
                key={image.id}
                className={`flex flex-col overflow-hidden rounded-lg border ${
                  isActive ? 'border-amber-400 shadow' : 'border-neutral-200'
                }`}
              >
                <div className="relative aspect-4/3 bg-neutral-100">
                  <Image
                    src={image.url}
                    alt={image.alt_text ?? FALLBACK_ALT}
                    fill
                    sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  {isActive ? (
                    <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-amber-400 px-2 py-1 text-xs font-semibold text-neutral-900">
                      Principal
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2 border-t border-neutral-200 p-3 text-sm">
                  <dl className="space-y-1 text-neutral-600">
                    <div className="flex justify-between gap-2">
                      <dt className="font-medium text-neutral-700">Orden</dt>
                      <dd>{image.sort_order}</dd>
                    </div>
                    {image.alt_text ? (
                      <div>
                        <dt className="font-medium text-neutral-700">Alt</dt>
                        <dd className="truncate">{image.alt_text}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <button
                    type="button"
                    onClick={() => {
                      if (isReadOnly) {
                        setStatus({ type: 'error', message: disabledMessage });
                        return;
                      }
                      void handleSetPrimary(image.id);
                    }}
                    disabled={isActive || setPrimaryImageState.isLoading || isReadOnly}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {setPrimaryImageState.isLoading && !isActive ? (
                      <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent align-middle" />
                    ) : null}
                    {isActive ? 'Ya es principal' : 'Marcar como principal'}
                  </button>
                  {setPrimaryImageState.error && !isActive ? (
                    <p className="text-xs text-red-600">
                      {getErrorMessage(setPrimaryImageState.error)}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default AdminProductImagesPanel;
