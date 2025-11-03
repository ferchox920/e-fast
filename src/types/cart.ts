import type { UUID, ISODateTime } from '@/types/common';

export type CartStatus = 'active' | 'converted' | 'abandoned';

export interface CartItemRead {
  id: UUID | string;
  variant_id: UUID | string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: ISODateTime;
}

export interface CartRead {
  id: UUID | string;
  user_id: UUID | string | null;
  guest_token: string | null;
  status: CartStatus | string;
  currency: string;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  created_at: ISODateTime;
  updated_at: ISODateTime | null;
  items: CartItemRead[];
}

export interface CartCreatePayload {
  guestToken?: string | null;
  currency?: string;
}

export interface CartItemCreatePayload {
  variantId: string;
  quantity: number;
  guestToken?: string | null;
}

export interface CartItemUpdatePayload {
  itemId: string;
  quantity: number;
  guestToken?: string | null;
}

export interface CartItemRemovePayload {
  itemId: string;
  guestToken?: string | null;
}
