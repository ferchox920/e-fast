import type { ISODateTime, UUID, Url } from './common';

export interface Category {
  id: UUID | string;
  name: string;
  slug: string;
  description?: string | null;
  active: boolean;
  parent_id?: UUID | string | null;
  image_url?: Url | null;
  metadata?: Record<string, unknown> | null;
  created_at?: ISODateTime | null;
  updated_at?: ISODateTime | null;
}

export interface Brand {
  id: UUID | string;
  name: string;
  slug: string | null;
  description?: string | null;
  active: boolean;
  website_url?: Url | null;
  logo_url?: Url | null;
  country?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: ISODateTime | null;
  updated_at?: ISODateTime | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export type CategoryRead = Category;
export type BrandRead = Brand;
export type BrandListResponse = PaginatedResponse<Brand>;

export interface CategoryCreateInput {
  name: string;
  slug?: string | null;
  description?: string | null;
  active?: boolean;
}

export type CategoryUpdateInput = Partial<CategoryCreateInput>;

export interface BrandCreateInput {
  name: string;
  slug?: string | null;
  description?: string | null;
  active?: boolean;
}

export type BrandUpdateInput = Partial<BrandCreateInput>;
