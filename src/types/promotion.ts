import type { ISODateTime, UUID } from './common';

export interface PromotionRead {
  id: UUID | string;
  name: string;
  description?: string | null;
  type: string;
  scope: string;
  criteria_json: Record<string, unknown>;
  benefits_json: Record<string, unknown>;
  start_at: ISODateTime;
  end_at: ISODateTime;
  status: string;
}

export interface PromotionCreateInput {
  name: string;
  description?: string | null;
  type: string;
  scope?: string | null;
  criteria?: Record<string, unknown>;
  benefits?: Record<string, unknown>;
  start_at: ISODateTime;
  end_at: ISODateTime;
}

export interface PromotionUpdateInput {
  name?: string;
  description?: string | null;
  scope?: string | null;
  criteria?: Record<string, unknown> | null;
  benefits?: Record<string, unknown> | null;
  start_at?: ISODateTime | null;
  end_at?: ISODateTime | null;
  status?: string | null;
}

export interface PromotionEligibilityResponse {
  promotion_id: UUID | string;
  eligible: boolean;
  reasons: string[];
}

export interface PromotionEligibilityParams {
  user_id?: string;
  loyalty_level?: string;
  category_id?: string;
  product_id?: string;
  order_total?: number;
}
