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

export interface AdminAnalyticsPeriod {
  start?: ISODateTime | null;
  end?: ISODateTime | null;
}

export interface AdminAnalyticsOverview {
  total_revenue: AdminRevenueKpi;
  orders_received: AdminOrdersKpi;
  loyalty_distribution: AdminLoyaltyDistributionEntry[];
  exposure_mix: AdminExposureMixEntry[];
  latest_orders: AdminOrderSummary[];
  period?: AdminAnalyticsPeriod | null;
}

export interface AdminSalesSummary {
  total_revenue: number;
  total_units_sold: number;
  total_sales_transactions: number;
}

export interface AdminTopSeller {
  product_id: UUID | string;
  product_title: string;
  sku: string;
  units_sold: number;
  estimated_revenue: number;
}

export interface AdminInventoryItemSummary {
  variant_id: UUID | string;
  sku: string;
  product_title: string;
  stock_on_hand: number;
  last_unit_cost?: number | null;
  estimated_value: number;
}

export interface AdminEngagementTotals {
  views: number;
  clicks: number;
  carts: number;
  purchases: number;
  revenue: number;
  conversion_rate: number;
  cart_rate: number;
}

export interface AdminEngagementPoint {
  date: ISODateTime | string;
  views: number;
  clicks: number;
  carts: number;
  purchases: number;
  revenue: number;
}

export interface AdminStockAlertSummary {
  variant_id: UUID | string;
  sku?: string | null;
  product_title?: string | null;
  available: number;
  reorder_point: number;
  missing: number;
}

export interface AdminPromotionSummary {
  id: UUID | string;
  name: string;
  scope?: string | null;
  status?: string | null;
  starts_at?: ISODateTime | null;
  ends_at?: ISODateTime | null;
}

export interface AdminAnalyticsDashboard {
  period: AdminAnalyticsPeriod | null;
  total_revenue: AdminRevenueKpi;
  orders_received: AdminOrdersKpi;
  average_order_value: number;
  loyalty_distribution: AdminLoyaltyDistributionEntry[];
  exposure_mix: AdminExposureMixEntry[];
  sales_summary: AdminSalesSummary | null;
  top_sellers: AdminTopSeller[];
  inventory: {
    total_estimated_value: number;
    total_units: number;
    items: AdminInventoryItemSummary[];
  };
  engagement: {
    totals: AdminEngagementTotals;
    trend: AdminEngagementPoint[];
  };
  operations: {
    orders_by_status: Record<string, number>;
    payments_by_status: Record<string, number>;
    shipments_by_status: Record<string, number>;
    stock_alerts: AdminStockAlertSummary[];
    pending_questions: AdminPendingQuestionSummary[];
  };
  promotions: {
    active_count: number;
    active: AdminPromotionSummary[];
  };
}
