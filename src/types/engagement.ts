import type { ISODate, ISODateTime, UUID } from './common';

export type EngagementEventType = 'view' | 'click' | 'add_to_cart' | 'purchase';

export interface EventMetadata {
  context?: string | null;
  referrer?: string | null;
  device?: string | null;
  quantity?: number | null;
  order_id?: UUID | string | null;
}

export interface EventCreateInput {
  event_type: EngagementEventType;
  product_id: UUID | string;
  user_id?: UUID | string | null;
  session_id?: UUID | string | null;
  timestamp?: ISODateTime | null;
  price?: number | null;
  metadata?: EventMetadata | null;
}

export interface ProductEngagementRead {
  product_id: UUID | string;
  date: ISODate | string;
  views: number;
  clicks: number;
  carts: number;
  purchases: number;
  revenue: number;
}

export interface CustomerEngagementRead {
  customer_id: string;
  date: ISODate | string;
  views: number;
  clicks: number;
  carts: number;
  purchases: number;
  points_earned: number;
}
