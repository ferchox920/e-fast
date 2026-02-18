import { baseApi } from './baseApi';
import type {
  CostAnalysisReport,
  InventoryRotationReport,
  InventoryValueReport,
  ReportPeriodParams,
  SalesReport,
} from '@/types/report';

const mapReportPeriodParams = (params?: ReportPeriodParams) => {
  if (!params || typeof params.days !== 'number') return undefined;
  return { days: Math.max(1, Math.min(365, params.days)) };
};

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSalesReport: build.query<SalesReport, ReportPeriodParams | void>({
      query: (params) => ({
        url: '/reports/sales',
        params: mapReportPeriodParams(params ?? undefined),
      }),
      providesTags: [{ type: 'Report', id: 'SALES' }],
    }),
    getInventoryValueReport: build.query<InventoryValueReport, void>({
      query: () => ({ url: '/reports/inventory/value' }),
      providesTags: [{ type: 'Report', id: 'INVENTORY_VALUE' }],
    }),
    getPurchasesCostAnalysisReport: build.query<CostAnalysisReport, ReportPeriodParams | void>({
      query: (params) => ({
        url: '/reports/purchases/cost-analysis',
        params: mapReportPeriodParams(params ?? undefined),
      }),
      providesTags: [{ type: 'Report', id: 'COST_ANALYSIS' }],
    }),
    getInventoryRotationReport: build.query<InventoryRotationReport, ReportPeriodParams | void>({
      query: (params) => ({
        url: '/reports/inventory/rotation',
        params: mapReportPeriodParams(params ?? undefined),
      }),
      providesTags: [{ type: 'Report', id: 'INVENTORY_ROTATION' }],
    }),
  }),
});

export const {
  useGetSalesReportQuery,
  useLazyGetSalesReportQuery,
  useGetInventoryValueReportQuery,
  useLazyGetInventoryValueReportQuery,
  useGetPurchasesCostAnalysisReportQuery,
  useLazyGetPurchasesCostAnalysisReportQuery,
  useGetInventoryRotationReportQuery,
  useLazyGetInventoryRotationReportQuery,
} = reportsApi;
