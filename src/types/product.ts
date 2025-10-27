// src/types/product.ts
import type { CurrencyCode, ISODateTime, UUID, Url } from './common';

export interface CategoryRead {
  id: UUID | string;
  name: string;
  slug: string;
  description?: string | null;
  active: boolean;
}

export interface BrandRead {
  id: UUID | string;
  name: string;
  slug: string;
  description?: string | null;
  active: boolean;
}

export interface ProductImageCreate {
  url: Url;
  alt_text?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

export interface ProductImageRead extends ProductImageCreate {
  id: UUID | string;
  product_id: UUID | string;
  created_at?: ISODateTime | null;
  updated_at?: ISODateTime | null;
}

export interface ProductVariantBase {
  sku: string;
  barcode?: string | null;
  size_label: string;
  color_name: string;
  color_hex?: string | null;
  stock_on_hand: number;
  stock_reserved: number;
  price_override?: number | null;
  active: boolean;
  allow_backorder: boolean;
  allow_preorder: boolean;
  release_at?: ISODateTime | null;
}

export interface ProductVariantCreate extends ProductVariantBase {
  reorder_point: number;
  reorder_qty: number;
  primary_supplier_id?: UUID | string | null;
}

export interface ProductVariantUpdate {
  size_label?: string | null;
  color_name?: string | null;
  color_hex?: string | null;
  stock_on_hand?: number | null;
  stock_reserved?: number | null;
  price_override?: number | null;
  barcode?: string | null;
  active?: boolean | null;
  allow_backorder?: boolean | null;
  allow_preorder?: boolean | null;
  release_at?: ISODateTime | null;
  reorder_point?: number | null;
  reorder_qty?: number | null;
  primary_supplier_id?: UUID | string | null;
}

export interface ProductVariantRead extends ProductVariantBase {
  id: UUID | string;
  product_id: UUID | string;
  reorder_point: number;
  reorder_qty: number;
  primary_supplier_id?: UUID | string | null;
  created_at?: ISODateTime | null;
  updated_at?: ISODateTime | null;
}

export interface ProductBase {
  title: string;
  slug?: string | null;
  description?: string | null;
  material?: string | null;
  care?: string | null;
  gender?: string | null;
  season?: string | null;
  fit?: string | null;
  price: number;
  currency: CurrencyCode | string;
  category_id?: UUID | string | null;
  brand_id?: UUID | string | null;
  active?: boolean;
}

export interface ProductCreate extends ProductBase {
  variants?: ProductVariantCreate[];
  images?: ProductImageCreate[];
}

export type ProductUpdate = Partial<ProductBase>;

export interface ProductRead extends ProductBase {
  id: UUID | string;
  category_id?: UUID | string | null;
  brand_id?: UUID | string | null;
  created_at?: ISODateTime | null;
  updated_at?: ISODateTime | null;
  category?: CategoryRead | null;
  brand?: BrandRead | null;
  variants: ProductVariantRead[];
  images: ProductImageRead[];
  primary_image?: ProductImageRead | null;
}

export interface PaginatedProducts {
  items: ProductRead[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface ProductListParams {
  search?: string;
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  limit?: number;
  offset?: number;
}
