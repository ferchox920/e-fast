import type { Product } from '@/types/product';
import type { ProductCardProps } from '@/components/product/ProductCard';
import { availableVariant, productAvailabilityLabel } from './productAvailability';

export const mapProductToCard = (product: Product): ProductCardProps => {
  const primaryImage = product.primary_image ?? product.images?.[0] ?? null;

  return {
    product,
    badges: [productAvailabilityLabel(product)],
    rating: null,
    reviewCount: null,
    defaultVariantId: availableVariant(product)?.id ? String(availableVariant(product)?.id) : null,
    defaultQuantity: 1,
    imageUrl: primaryImage?.url ?? null,
    imageAlt: primaryImage?.alt_text ?? null,
  };
};

export const mapProductsToCards = (products: Product[]): ProductCardProps[] =>
  products.map(mapProductToCard);
