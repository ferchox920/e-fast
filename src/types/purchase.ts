import type { ISODateTime, UUID } from './common';

export type POStatus = 'draft' | 'placed' | 'partially_received' | 'received' | 'cancelled';

export interface SupplierCreateInput {
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface SupplierRead {
  id: UUID | string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface POLineCreateInput {
  variant_id: UUID | string;
  quantity: number;
  unit_cost: number;
}

export interface POCreateInput {
  supplier_id: UUID | string;
  currency?: string;
  lines?: POLineCreateInput[];
}

export interface POLineRead {
  id: UUID | string;
  variant_id: UUID | string;
  quantity: number;
  unit_cost: number;
}

export interface PORead {
  id: UUID | string;
  supplier_id: UUID | string;
  status: POStatus;
  currency: string;
  total_amount?: number | null;
  created_at: ISODateTime;
  updated_at?: ISODateTime | null;
  lines: POLineRead[];
}

export interface POReceiveItemInput {
  line_id: UUID | string;
  quantity: number;
}

export interface POReceivePayload {
  items: POReceiveItemInput[];
  reason?: string | null;
}

export interface CreatePOFromSuggestionPayload {
  supplier_id: UUID | string;
}

export interface PurchaseOrderByIdArgs {
  poId: string;
}

export interface PurchaseOrderLineMutationArgs {
  poId: string;
  body: POLineCreateInput;
}

export interface PurchaseOrderReceiveMutationArgs {
  poId: string;
  body: POReceivePayload;
}

export interface PurchaseOrderActionArgs {
  poId: string;
}

export interface StockAlert {
  variant_id: UUID | string;
  available: number;
  reorder_point: number;
  missing: number;
}

export interface ReplenishmentLine {
  variant_id: UUID | string;
  suggested_qty: number;
  reason: string;
  last_unit_cost?: number | null;
}

export interface ReplenishmentSuggestion {
  supplier_id?: UUID | string | null;
  lines: ReplenishmentLine[];
}

export interface ListSuppliersParams {
  q?: string;
  limit?: number;
  offset?: number;
}

export interface SupplierFilterParams {
  supplier_id?: string;
}
