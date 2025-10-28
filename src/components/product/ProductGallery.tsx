import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import Image from 'next/image';

import type { ProductImageRead } from '@/types/product';

interface ProductGalleryProps {
  images: ProductImageRead[];
}

const FALLBACK_ALT = 'Imagen generica del producto';

export function ProductGallery({ images }: ProductGalleryProps) {
  const normalizedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      const orderA = a.sort_order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.sort_order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return String(a.id).localeCompare(String(b.id));
    });
  }, [images]);

  const primaryCandidate = useMemo(() => {
    const explicitPrimary = normalizedImages.find((image) => image.is_primary);
    return explicitPrimary ?? normalizedImages[0] ?? images[0];
  }, [images, normalizedImages]);

  const [activeImageId, setActiveImageId] = useState(primaryCandidate?.id);

  useEffect(() => {
    setActiveImageId(primaryCandidate?.id);
  }, [primaryCandidate?.id]);

  const activeImage = useMemo(() => {
    return normalizedImages.find((image) => image.id === activeImageId) ?? primaryCandidate ?? null;
  }, [activeImageId, normalizedImages, primaryCandidate]);

  if (!images.length) {
    return (
      <div
        className="flex aspect-4/3 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500"
        role="img"
        aria-label="Producto sin imagenes disponibles"
      >
        No hay imagenes del producto
      </div>
    );
  }

  const mainImageId = `product-gallery-main-image`;

  const handleKeyNavigation = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();

    const nextIndex =
      event.key === 'ArrowLeft'
        ? (index - 1 + normalizedImages.length) % normalizedImages.length
        : (index + 1) % normalizedImages.length;

    setActiveImageId(normalizedImages[nextIndex]?.id);

    const nextButton = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      'button[data-gallery-thumb="true"]',
    )[nextIndex];

    nextButton?.focus();
  };

  return (
    <div className="space-y-3">
      <figure className="relative aspect-4/3 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
        {activeImage ? (
          <Image
            id={mainImageId}
            key={activeImage.id}
            src={activeImage.url}
            alt={activeImage.alt_text ?? FALLBACK_ALT}
            fill
            sizes="(min-width:1024px) 640px, (min-width:640px) 560px, 100vw"
            className="object-cover"
            loading="lazy"
            data-testid="product-gallery-main-image"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-neutral-500">
            No hay imagen seleccionada
          </div>
        )}
        <figcaption className="sr-only">{activeImage?.alt_text ?? FALLBACK_ALT}</figcaption>
      </figure>

      <div
        role="listbox"
        aria-label="Imagenes del producto"
        className="flex gap-2 overflow-x-auto"
        data-testid="product-gallery-thumbnails"
      >
        {normalizedImages.map((image, index) => {
          const isActive = image.id === activeImage?.id;

          return (
            <button
              key={image.id}
              type="button"
              role="option"
              aria-selected={isActive}
              aria-controls={mainImageId}
              data-gallery-thumb="true"
              onClick={() => setActiveImageId(image.id)}
              onKeyDown={(event) => handleKeyNavigation(event, index)}
              className={`relative size-20 shrink-0 overflow-hidden rounded-md border transition focus:outline-none focus:ring-2 focus:ring-neutral-600 ${
                isActive ? 'ring-2 ring-neutral-900 border-neutral-900' : 'border-neutral-200'
              }`}
            >
              <span className="sr-only">
                {isActive ? 'Imagen seleccionada: ' : 'Seleccionar imagen: '}
                {image.alt_text ?? FALLBACK_ALT}
              </span>
              <Image
                src={image.url}
                alt={image.alt_text ?? `${FALLBACK_ALT} ${index + 1}`}
                width={80}
                height={80}
                className="object-cover"
                loading="lazy"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ProductGallery;
