import type { Product } from '@/types/product';
import type { ProductCardProps } from '@/components/product/ProductCard';

const ACTIVE_BADGE = 'Disponible';
const INACTIVE_BADGE = 'Inactivo';

export const mapProductToCard = (product: Product): ProductCardProps => {
  const primaryImage = product.primary_image ?? product.images?.[0] ?? null;

  return {
    product,
    badges: [product.active ? ACTIVE_BADGE : INACTIVE_BADGE],
    rating: null,
    reviewCount: null,
    defaultVariantId:
      product.variants && product.variants.length > 0 ? String(product.variants[0].id) : null,
    defaultQuantity: 1,
    imageUrl: primaryImage?.url ?? null,
    imageAlt: primaryImage?.alt_text ?? null,
  };
};

export const mapProductsToCards = (products: Product[]): ProductCardProps[] =>
  products.map(mapProductToCard);
