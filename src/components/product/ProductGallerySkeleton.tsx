'use client';

export function ProductGallerySkeleton() {
  return (
    <div className="space-y-3" data-testid="product-gallery-skeleton">
      <div
        className="aspect-[4/3] w-full animate-pulse rounded-lg bg-neutral-200"
        aria-hidden="true"
      />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 w-20 animate-pulse rounded-md bg-neutral-200"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

export default ProductGallerySkeleton;
