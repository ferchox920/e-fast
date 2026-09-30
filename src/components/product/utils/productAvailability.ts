import type { Product } from '@/types/product';

export const availableVariant = (product: Product, quantity = 1) =>
  product.active
    ? product.variants?.find(
        (variant) => variant.active && variant.stock_on_hand - variant.stock_reserved >= quantity,
      )
    : undefined;

export const productAvailabilityLabel = (product: Product) =>
  !product.active ? 'Inactivo' : availableVariant(product) ? 'Disponible' : 'Agotado';
