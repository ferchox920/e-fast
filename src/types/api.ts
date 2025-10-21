// src/types/api.ts
import type { UUID } from './common';

export interface ApiError {
  code: string | number;
  message: string;
  details?: unknown;
  trace_id?: UUID | string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: ApiError;
}

/** Paginación genérica */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

/** Parámetros genéricos de listado */
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export type SortOrder = 'asc' | 'desc';

export interface ListParamsBase extends PaginationParams {
  search?: string;
  sort_by?: string;
  sort_order?: SortOrder;
}
