import { baseApi } from './baseApi';
import type {
  CreatePOFromSuggestionPayload,
  ListSuppliersParams,
  POCreateInput,
  PORead,
  PurchaseOrderActionArgs,
  PurchaseOrderByIdArgs,
  PurchaseOrderLineMutationArgs,
  PurchaseOrderReceiveMutationArgs,
  ReplenishmentSuggestion,
  StockAlert,
  SupplierCreateInput,
  SupplierFilterParams,
  SupplierRead,
} from '@/types/purchase';

const mapListSuppliersParams = (params?: ListSuppliersParams) => {
  if (!params) return undefined;

  const query: Record<string, string | number> = {};

  if (params.q) query.q = params.q;
  if (typeof params.limit === 'number') query.limit = Math.max(1, params.limit);
  if (typeof params.offset === 'number') query.offset = Math.max(0, params.offset);

  return Object.keys(query).length > 0 ? query : undefined;
};

const mapSupplierFilterParams = (params?: SupplierFilterParams) => {
  if (!params?.supplier_id) return undefined;
  return { supplier_id: params.supplier_id };
};

export const purchasesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createSupplier: build.mutation<SupplierRead, SupplierCreateInput>({
      query: (body) => ({
        url: '/purchases/suppliers',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Purchase', id: 'SUPPLIERS' }],
    }),
    listSuppliers: build.query<SupplierRead[], ListSuppliersParams | void>({
      query: (params) => ({
        url: '/purchases/suppliers',
        params: mapListSuppliersParams(params ?? undefined),
      }),
      providesTags: (result) =>
        result && result.length > 0
          ? [
              ...result.map((supplier) => ({ type: 'Purchase' as const, id: `SUPPLIER:${supplier.id}` })),
              { type: 'Purchase', id: 'SUPPLIERS' },
            ]
          : [{ type: 'Purchase', id: 'SUPPLIERS' }],
    }),
    createPurchaseOrder: build.mutation<PORead, POCreateInput>({
      query: (body) => ({
        url: '/purchases/orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Purchase', id: 'PO_LIST' }],
    }),
    getPurchaseOrderById: build.query<PORead, PurchaseOrderByIdArgs>({
      query: ({ poId }) => ({ url: `/purchases/orders/${poId}` }),
      providesTags: (result, _error, { poId }) => [
        { type: 'Purchase', id: `PO:${result?.id ?? poId}` },
      ],
    }),
    addPurchaseOrderLine: build.mutation<PORead, PurchaseOrderLineMutationArgs>({
      query: ({ poId, body }) => ({
        url: `/purchases/orders/${poId}/lines`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, _error, { poId }) => [
        { type: 'Purchase', id: `PO:${result?.id ?? poId}` },
        { type: 'Purchase', id: 'PO_LIST' },
        { type: 'Purchase', id: 'REPLENISHMENT_ALERTS' },
        { type: 'Purchase', id: 'REPLENISHMENT_SUGGESTIONS' },
      ],
    }),
    placePurchaseOrder: build.mutation<PORead, PurchaseOrderActionArgs>({
      query: ({ poId }) => ({
        url: `/purchases/orders/${poId}/place`,
        method: 'POST',
      }),
      invalidatesTags: (result, _error, { poId }) => [
        { type: 'Purchase', id: `PO:${result?.id ?? poId}` },
        { type: 'Purchase', id: 'PO_LIST' },
      ],
    }),
    receivePurchaseOrder: build.mutation<PORead, PurchaseOrderReceiveMutationArgs>({
      query: ({ poId, body }) => ({
        url: `/purchases/orders/${poId}/receive`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, _error, { poId }) => [
        { type: 'Purchase', id: `PO:${result?.id ?? poId}` },
        { type: 'Purchase', id: 'PO_LIST' },
        { type: 'Purchase', id: 'REPLENISHMENT_ALERTS' },
        { type: 'Purchase', id: 'REPLENISHMENT_SUGGESTIONS' },
      ],
    }),
    cancelPurchaseOrder: build.mutation<PORead, PurchaseOrderActionArgs>({
      query: ({ poId }) => ({
        url: `/purchases/orders/${poId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, _error, { poId }) => [
        { type: 'Purchase', id: `PO:${result?.id ?? poId}` },
        { type: 'Purchase', id: 'PO_LIST' },
      ],
    }),
    createPurchaseOrderFromSuggestions: build.mutation<PORead, CreatePOFromSuggestionPayload>({
      query: (body) => ({
        url: '/purchases/orders/from-suggestions',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Purchase', id: 'PO_LIST' }],
    }),
    getReplenishmentAlerts: build.query<StockAlert[], SupplierFilterParams | void>({
      query: (params) => ({
        url: '/purchases/replenishment/alerts',
        params: mapSupplierFilterParams(params ?? undefined),
      }),
      providesTags: (result, _error, args) => [
        { type: 'Purchase', id: 'REPLENISHMENT_ALERTS' },
        { type: 'Purchase', id: `REPLENISHMENT_ALERTS:${args?.supplier_id ?? 'ALL'}` },
        ...(result ?? []).map((item) => ({ type: 'Purchase' as const, id: `ALERT_VARIANT:${item.variant_id}` })),
      ],
    }),
    getReplenishmentSuggestions: build.query<ReplenishmentSuggestion, SupplierFilterParams | void>({
      query: (params) => ({
        url: '/purchases/replenishment/suggestions',
        params: mapSupplierFilterParams(params ?? undefined),
      }),
      providesTags: (result, _error, args) => [
        { type: 'Purchase', id: 'REPLENISHMENT_SUGGESTIONS' },
        { type: 'Purchase', id: `REPLENISHMENT_SUGGESTIONS:${args?.supplier_id ?? 'ALL'}` },
        ...(result?.lines ?? []).map((item) => ({
          type: 'Purchase' as const,
          id: `SUGGESTION_VARIANT:${item.variant_id}`,
        })),
      ],
    }),
  }),
});

export const {
  useCreateSupplierMutation,
  useListSuppliersQuery,
  useLazyListSuppliersQuery,
  useCreatePurchaseOrderMutation,
  useGetPurchaseOrderByIdQuery,
  useLazyGetPurchaseOrderByIdQuery,
  useAddPurchaseOrderLineMutation,
  usePlacePurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useCreatePurchaseOrderFromSuggestionsMutation,
  useGetReplenishmentAlertsQuery,
  useLazyGetReplenishmentAlertsQuery,
  useGetReplenishmentSuggestionsQuery,
  useLazyGetReplenishmentSuggestionsQuery,
} = purchasesApi;
