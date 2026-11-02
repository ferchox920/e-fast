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
  | 'partially_refunded'
  | 'rejected'
  | 'cancelled'
  | 'refunded';

export type ShippingStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'returned';
export type ShippingMethodCode = 'standard' | 'express';

export interface OrderLineCreateInput {
  variant_id: UUID | string;
  quantity: number;
  unit_price?: number | null;
}

export interface OrderCreateInput {
  currency?: string;
  lines?: OrderLineCreateInput[];
  shipping_method?: ShippingMethodCode;
  shipping_amount?: number | null;
  tax_amount?: number | null;
  discount_amount?: number | null;
  applied_promotions?: AppliedPromotionInput[];
  shipping_address?: ShippingAddress | null;
  notes?: string | null;
}

export interface ShippingAddress {
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string | null;
}

export interface AppliedPromotionInput {
  promotion_id?: UUID | string | null;
  code?: string | null;
}

export interface OrderFromCartInput {
  guestToken?: string | null;
  shipping_method?: ShippingMethodCode;
  applied_promotions?: AppliedPromotionInput[];
  shipping_address?: ShippingAddress | null;
  notes?: string | null;
}

export interface ShipmentCreateInput {
  carrier?: string | null;
  tracking_number?: string | null;
  shipped_at?: ISODateTime | null;
  delivered_at?: ISODateTime | null;
  address?: ShippingAddress | null;
  notes?: string | null;
}

export interface ShippingMethodRead {
  code: ShippingMethodCode;
  name: string;
  provider_code: string;
  provider_name: string;
  amount: number;
  currency: string;
  estimated_days_min: number;
  estimated_days_max: number;
  zone_code?: string | null;
  weight_grams: number;
  selected: boolean;
}

export interface CheckoutQuoteInput {
  currency?: string;
  lines: Array<Pick<OrderLineCreateInput, 'variant_id' | 'quantity'>>;
  shipping_method?: ShippingMethodCode;
  shipping_address?: ShippingAddress | null;
  applied_promotions?: AppliedPromotionInput[];
}

export interface CheckoutQuoteRead {
  currency: string;
  subtotal_amount: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  applied_promotions: AppliedPromotionInput[];
  shipping_method: ShippingMethodCode;
  shipping_methods: ShippingMethodRead[];
  shipping_zone?: string | null;
  shipping_weight_grams: number;
  tax_rate: number;
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
  refunded_amount: number;
  currency: string;
  init_point?: string | null;
  sandbox_init_point?: string | null;
  refunded_at?: ISODateTime | null;
  refund_reason?: string | null;
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
  address?: ShippingAddress | null;
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
  shipping_method?: ShippingMethodCode;
  tax_amount: number;
  total_amount: number;
  applied_promotions?: AppliedPromotionInput[];
  shipping_address?: ShippingAddress | null;
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
