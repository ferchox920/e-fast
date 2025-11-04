// src/types/admin.ts
import type { CurrencyCode, ISODateTime, UUID } from './common';

export interface AdminRevenueKpi {
  value: number;
  currency: CurrencyCode | string;
  delta_percentage?: number | null;
}

export interface AdminOrdersKpi {
  value: number;
  delta_percentage?: number | null;
}

export interface AdminLoyaltyDistributionEntry {
  loyalty_level: string;
  percentage: number;
  customers?: number | null;
}

export interface AdminExposureMixEntry {
  slot: string;
  ctr: number;
  impressions?: number | null;
  clicks?: number | null;
}

export interface AdminOrderSummary {
  id: UUID | string;
  order_number: string;
  status: string;
  total: number;
  currency?: CurrencyCode | string | null;
  placed_at?: ISODateTime | null;
  customer_name?: string | null;
}

export interface AdminPendingQuestionSummary {
  id: UUID | string;
  product_id: UUID | string;
  body: string;
  product_title?: string | null;
  created_at?: ISODateTime | null;
  author_name?: string | null;
}

export interface AdminAnalyticsOverview {
  total_revenue: AdminRevenueKpi;
  orders_received: AdminOrdersKpi;
  loyalty_distribution: AdminLoyaltyDistributionEntry[];
  exposure_mix: AdminExposureMixEntry[];
  latest_orders: AdminOrderSummary[];
}
