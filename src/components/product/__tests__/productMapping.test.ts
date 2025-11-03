import { mapProductToCard } from '@/components/product/utils/mapProductToCard';
import type { ProductImageRead, ProductRead, ProductVariantRead } from '@/types/product';

const baseProduct = (): ProductRead => ({
  id: 'prod-1',
  title: 'Producto Demo',
  slug: 'producto-demo',
  description: 'Descripcion breve',
  price: 120,
  currency: 'USD',
  active: true,
  category_id: null,
  brand_id: null,
  created_at: null,
  updated_at: null,
  category: null,
  brand: null,
  variants: [],
  images: [],
  primary_image: null,
});

const createVariant = (id: string): ProductVariantRead => ({
  id,
  product_id: 'prod-1',
  sku: `SKU-${id}`,
  size_label: 'M',
  color_name: 'Negro',
  stock_on_hand: 10,
  stock_reserved: 0,
  reorder_point: 1,
  reorder_qty: 1,
  allow_backorder: false,
  allow_preorder: false,
  active: true,
  barcode: null,
  price_override: null,
  color_hex: null,
  release_at: null,
  primary_supplier_id: null,
});

const createImage = (id: string, overrides: Partial<ProductImageRead> = {}): ProductImageRead => ({
  id,
  product_id: 'prod-1',
  url: `https://example.com/${id}.jpg`,
  alt_text: `Imagen ${id}`,
  is_primary: false,
  sort_order: 1,
  created_at: null,
  updated_at: null,
  ...overrides,
});

describe('mapProductToCard', () => {
  it('prefers primary image when available', () => {
    const product = {
      ...baseProduct(),
      images: [createImage('img-1')],
      primary_image: createImage('primary', { is_primary: true }),
    };

    const card = mapProductToCard(product);

    expect(card.imageUrl).toBe('https://example.com/primary.jpg');
  });

  it('falls back to first gallery image when no primary', () => {
    const product = {
      ...baseProduct(),
      images: [createImage('img-1'), createImage('img-2')],
    };

    const card = mapProductToCard(product);

    expect(card.imageUrl).toBe('https://example.com/img-1.jpg');
  });

  it('maps variant id and badges correctly', () => {
    const product = {
      ...baseProduct(),
      active: false,
      variants: [createVariant('var-1')],
    };

    const card = mapProductToCard(product);

    expect(card.defaultVariantId).toBe('var-1');
    expect(card.badges).toEqual(['Inactivo']);
  });
});
