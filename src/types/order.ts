import type { ISODateTime, UUID } from './common';

export type OrderStatus =
  | 'draft'
  | 'pending_payment'
  | 'paid'
  | 'fulfilled'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded';

export type ShippingStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'returned';

export interface OrderLineCreateInput {
  variant_id: UUID | string;
  quantity: number;
  unit_price?: number | null;
}

export interface OrderCreateInput {
  currency?: string;
  lines?: OrderLineCreateInput[];
  shipping_amount?: number | null;
  tax_amount?: number | null;
  discount_amount?: number | null;
  shipping_address?: Record<string, unknown> | null;
  notes?: string | null;
}

export interface ShipmentCreateInput {
  carrier?: string | null;
  tracking_number?: string | null;
  shipped_at?: ISODateTime | null;
  delivered_at?: ISODateTime | null;
  address?: Record<string, unknown> | null;
  notes?: string | null;
}

export interface OrderLineRead {
  id: UUID | string;
  variant_id: UUID | string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface PaymentRead {
  id: UUID | string;
  provider: string;
  provider_payment_id?: string | null;
  status: PaymentStatus;
  status_detail?: string | null;
  amount: number;
  currency: string;
  init_point?: string | null;
  sandbox_init_point?: string | null;
  created_at: ISODateTime;
  updated_at?: ISODateTime | null;
}

export interface ShipmentRead {
  id: UUID | string;
  status: ShippingStatus;
  carrier?: string | null;
  tracking_number?: string | null;
  shipped_at?: ISODateTime | null;
  delivered_at?: ISODateTime | null;
  address?: Record<string, unknown> | null;
  notes?: string | null;
  created_at: ISODateTime;
  updated_at?: ISODateTime | null;
}

export interface OrderRead {
  id: UUID | string;
  user_id?: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_status: ShippingStatus;
  currency: string;
  subtotal_amount: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  shipping_address?: Record<string, unknown> | null;
  notes?: string | null;
  paid_at?: ISODateTime | null;
  fulfilled_at?: ISODateTime | null;
  cancelled_at?: ISODateTime | null;
  created_at: ISODateTime;
  updated_at?: ISODateTime | null;
  lines: OrderLineRead[];
  payments: PaymentRead[];
  shipments: ShipmentRead[];
}

export interface OrderFromCartPayload {
  guest_token?: string | null;
}

export interface ListOrdersParams {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  shipping_status?: ShippingStatus;
  user_id?: string;
  limit?: number;
  offset?: number;
  page?: number;
  page_size?: number;
}
