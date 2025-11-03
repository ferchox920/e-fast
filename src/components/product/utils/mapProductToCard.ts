import type { ProductRead } from '@/types/product';
import type { ProductCardProps } from '@/components/product/ProductCard';
import type { CurrencyCode } from '@/types/common';

const ACTIVE_BADGE = 'Disponible';
const INACTIVE_BADGE = 'Inactivo';

export const mapProductToCard = (product: ProductRead): ProductCardProps => {
  const primaryImageUrl = product.primary_image?.url ?? product.images?.[0]?.url ?? null;

  const firstVariantId =
    product.variants && product.variants.length > 0 ? String(product.variants[0].id) : null;

  return {
    id: String(product.id),
    title: product.title,
    slug: product.slug ?? String(product.id),
    price: product.price,
    currency: (product.currency ?? null) as CurrencyCode | null,
    description: product.description ?? '',
    imageUrl: primaryImageUrl,
    badges: [product.active ? ACTIVE_BADGE : INACTIVE_BADGE],
    rating: null,
    reviewCount: null,
    defaultVariantId: firstVariantId,
    defaultQuantity: 1,
  };
};

export const mapProductsToCards = (products: ProductRead[]): ProductCardProps[] =>
  products.map(mapProductToCard);
