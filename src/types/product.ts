// src/types/product.ts
import type { CurrencyCode, ISODateTime, UUID, Url } from './common';
import type { Paginated } from './api';

export interface ProductBase {
  slug: string;
  title: string;
  description?: string | null;
  price: number;
  currency: CurrencyCode;
  category_id?: UUID | string | null;
  brand_id?: UUID | string | null;
  is_active?: boolean;
}

export interface ProductCreate extends Omit<ProductBase, 'slug'> {
  slug?: string;
}

export type ProductUpdate = Partial<ProductBase>;

export interface ProductImageRead {
  id: UUID | string;
  product_id: UUID | string;
  url: Url;
  alt_text?: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at?: ISODateTime | null;
  updated_at?: ISODateTime | null;
}

export interface ProductImageCreate {
  url: Url;
  alt_text?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

export interface ProductVariantBase {
  sku: string;
  title?: string | null;
  price: number;
  currency: CurrencyCode;
  stock_quantity?: number | null;
  attributes?: Record<string, string | number | boolean | null>;
}

export interface ProductVariantCreate extends ProductVariantBase {
  barcode?: string | null;
  weight_grams?: number | null;
}

export type ProductVariantUpdate = Partial<ProductVariantBase> & {
  barcode?: string | null;
  weight_grams?: number | null;
};

export interface ProductVariantRead extends ProductVariantBase {
  id: UUID | string;
  product_id: UUID | string;
  barcode?: string | null;
  weight_grams?: number | null;
  created_at?: ISODateTime | null;
  updated_at?: ISODateTime | null;
}

export interface ProductRead extends ProductBase {
  id: UUID | string;
  created_at?: ISODateTime | null;
  updated_at?: ISODateTime | null;
  images: ProductImageRead[];
  variants?: ProductVariantRead[];
  primary_image?: ProductImageRead | null;
}

export type PaginatedProducts = Paginated<ProductRead>;

export interface ProductListParams {
  search?: string;
  category_id?: string;
  brand_id?: string;
  min_price?: number;
  max_price?: number;
  limit?: number;
  offset?: number;
}
