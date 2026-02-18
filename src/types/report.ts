import type { ISODateTime, UUID } from './common';

export interface SalesSummary {
  total_revenue: number;
  total_sales_transactions: number;
  total_units_sold: number;
}

export interface TopSeller {
  product_id: UUID | string;
  product_title: string;
  sku: string;
  units_sold: number;
  estimated_revenue: number;
}

export interface SalesReport {
  generated_at: ISODateTime;
  period_days: number;
  sales_summary: SalesSummary;
  top_sellers: TopSeller[];
}

export interface InventoryValueItem {
  variant_id: UUID | string;
  sku: string;
  product_title: string;
  stock_on_hand: number;
  last_unit_cost?: number | null;
  estimated_value: number;
}

export interface InventoryValueReport {
  generated_at: ISODateTime;
  total_estimated_value: number;
  total_units: number;
  items: InventoryValueItem[];
}

export interface CostAnalysisItem {
  product_id: UUID | string;
  variant_id: UUID | string;
  sku: string;
  product_title: string;
  units_purchased: number;
  total_cost: number;
  average_cost: number;
}

export interface CostAnalysisReport {
  generated_at: ISODateTime;
  period_days: number;
  total_units_purchased: number;
  total_purchase_cost: number;
  items_by_product: CostAnalysisItem[];
}

export interface InventoryRotationItem {
  product_id: UUID | string;
  variant_id: UUID | string;
  sku: string;
  product_title: string;
  units_sold: number;
  current_stock: number;
  turnover_ratio?: number | null;
}

export interface InventoryRotationReport {
  generated_at: ISODateTime;
  period_days: number;
  notes: string;
  items: InventoryRotationItem[];
}

export interface ReportPeriodParams {
  days?: number;
}
