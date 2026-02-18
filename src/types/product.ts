// src/types/product.ts
import type { CurrencyCode, ISODateTime, UUID, Url } from './common';
import type { PaginatedResponse, Brand, Category } from './catalog';
import type { SortOrder } from './api';

export type { Category as CategoryRead, Brand as BrandRead, PaginatedResponse } from './catalog';

export interface ProductImageCreate {
  url: Url;
  alt_text?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

export type ProductImageUpdate = Partial<ProductImageCreate>;

export interface ProductImage {
  id: UUID | string;
  product_id: UUID | string;
  url: Url;
  alt_text?: string | null;
  is_primary: boolean;
  sort_order: number;
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

export interface ProductVariantUpdate extends Partial<ProductVariantBase> {
  reorder_point?: number | null;
  reorder_qty?: number | null;
  primary_supplier_id?: UUID | string | null;
}

export interface ProductVariant extends ProductVariantBase {
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
  slug: string;
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
  tags?: string[] | null;
}

export interface ProductCreate extends Partial<Omit<ProductBase, 'title' | 'price' | 'currency'>> {
  title: string;
  price: number;
  currency: CurrencyCode | string;
  variants?: ProductVariantCreate[];
  images?: ProductImageCreate[];
}

export interface ProductUpdate extends Partial<Omit<ProductCreate, 'variants' | 'images'>> {
  variants?: ProductVariantCreate[];
  images?: ProductImageCreate[];
}

export interface Product {
  id: UUID | string;
  title: string;
  slug: string;
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
  active: boolean;
  tags?: string[] | null;
  created_at?: ISODateTime | null;
  updated_at?: ISODateTime | null;
  category?: Category | null;
  brand?: Brand | null;
  variants: ProductVariant[];
  images: ProductImage[];
  primary_image?: ProductImage | null;
  questions?: ProductQuestion[] | null;
}

export type ProductRead = Product;
export type ProductVariantRead = ProductVariant;
export type ProductImageRead = ProductImage;

export type PaginatedProducts = PaginatedResponse<Product>;

export interface ProductQuestionUser {
  id: UUID | string;
  full_name?: string | null;
}

export interface ProductQuestionAnswer {
  id: UUID | string;
  content: string;
  body: string;
  question_id?: UUID | string;
  admin_id?: UUID | string | null;
  is_visible?: boolean;
  created_at?: ISODateTime | null;
  updated_at?: ISODateTime | null;
  author?: ProductQuestionUser | null;
}

export interface ProductQuestion {
  id: UUID | string;
  product_id: UUID | string;
  user_id?: UUID | string | null;
  content: string;
  body: string;
  status?: string;
  is_visible?: boolean;
  is_blocked?: boolean;
  author?: ProductQuestionUser | null;
  created_at?: ISODateTime | null;
  updated_at?: ISODateTime | null;
  answers?: ProductQuestionAnswer[];
  answer?: ProductQuestionAnswer | null;
}

export interface ProductQuestionCreate {
  content?: string;
  body?: string;
  anonymous?: boolean;
}

export interface ProductQuestionAnswerCreate {
  content?: string;
  body?: string;
}

export interface ProductQuestionVisibilityUpdate {
  is_visible: boolean;
}

export interface ProductQuestionBlockUpdate {
  is_blocked: boolean;
  reason?: string | null;
}

export interface ProductListParams {
  search?: string;
  category?: string;
  brand?: string;
  category_id?: string;
  brand_id?: string;
  stock_status?: 'low' | 'out' | 'in' | string;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  sort_order?: SortOrder;
  page?: number;
  page_size?: number;
  /**
   * @deprecated Usa page/page_size cuando el backend proporcione paginacion basada en pagina.
   */
  limit?: number;
  /**
   * @deprecated Usa page/page_size cuando el backend proporcione paginacion basada en pagina.
   */
  offset?: number;
}
