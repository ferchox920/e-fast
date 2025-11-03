import type { UUID } from './common';

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

export interface BrandListResponse {
  items: BrandRead[];
  total: number;
  page: number;
  page_size: number;
}
