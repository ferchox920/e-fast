import type { Product } from '@/types/product';
import type { ProductCardProps } from '@/components/product/ProductCard';

const ACTIVE_BADGE = 'Disponible';
const INACTIVE_BADGE = 'Inactivo';

const getPreferredVariantId = (product: Product): string | null => {
  if (!product.variants?.length) return null;

  const inStockActiveVariant = product.variants.find(
    (variant) => variant.active && (variant.stock_on_hand ?? 0) - (variant.stock_reserved ?? 0) > 0,
  );
  if (inStockActiveVariant) return String(inStockActiveVariant.id);

  const firstActiveVariant = product.variants.find((variant) => variant.active);
  if (firstActiveVariant) return String(firstActiveVariant.id);

  return String(product.variants[0].id);
};

export const mapProductToCard = (product: Product): ProductCardProps => {
  const primaryImage = product.primary_image ?? product.images?.[0] ?? null;

  return {
    product,
    badges: [product.active ? ACTIVE_BADGE : INACTIVE_BADGE],
    rating: null,
    reviewCount: null,
    defaultVariantId: getPreferredVariantId(product),
    defaultQuantity: 1,
    imageUrl: primaryImage?.url ?? null,
    imageAlt: primaryImage?.alt_text ?? null,
  };
};

export const mapProductsToCards = (products: Product[]): ProductCardProps[] =>
  products.map(mapProductToCard);
