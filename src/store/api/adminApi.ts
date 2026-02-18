// src/store/api/adminApi.ts
import { baseApi } from './baseApi';
import type { UserRead, UserCreate } from '@/types/user';
import type { Paginated, PaginationParams } from '@/types/api';
import type { Product, ProductCreate } from '@/types/product';
import type { Category, CategoryCreateInput, CategoryUpdateInput } from '@/types/catalog';
import type {
  AdminAnalyticsDashboard,
  AdminAnalyticsOverview,
  AdminEngagementPoint,
  AdminEngagementTotals,
  AdminExposureMixEntry,
  AdminInventoryItemSummary,
  AdminLoyaltyDistributionEntry,
  AdminOrderSummary,
  AdminOrdersKpi,
  AdminPromotionSummary,
  AdminRevenueKpi,
  AdminSalesSummary,
  AdminStockAlertSummary,
  AdminTopSeller,
  AdminPendingQuestionSummary,
} from '@/types/admin';

const envCurrency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY?.trim();
const DEFAULT_CURRENCY = envCurrency && envCurrency.length ? envCurrency : 'USD';

type MaybePaginated<T> = Paginated<T> | T[] | undefined;

const isPaginatedResponse = <T>(data: unknown): data is Paginated<T> =>
  !!data &&
  typeof data === 'object' &&
  'items' in data &&
  Array.isArray((data as Paginated<T>).items);

const normalizePaginated = <T>(
  data: MaybePaginated<T>,
  fallback?: { page?: number; page_size?: number },
): Paginated<T> => {
  if (isPaginatedResponse<T>(data)) {
    return data;
  }

  const items = Array.isArray(data) ? data : [];
  const fallbackSize = fallback?.page_size ?? items.length;
  const page_size =
    fallbackSize && fallbackSize > 0 ? fallbackSize : Math.max(items.length, 1) || 1;
  const page = fallback?.page && fallback.page > 0 ? fallback.page : 1;
  const total = items.length;
  const pages = page_size > 0 ? Math.max(1, Math.ceil(total / page_size)) : 1;

  return {
    items,
    total,
    page,
    page_size,
    pages,
  };
};

const coerceRevenueKpi = (input: unknown): AdminRevenueKpi => {
  if (input && typeof input === 'object') {
    const candidate = input as Partial<AdminRevenueKpi>;
    if (typeof candidate.value === 'number') {
      return {
        value: candidate.value,
        currency:
          (typeof candidate.currency === 'string' && candidate.currency.trim().length
            ? candidate.currency
            : DEFAULT_CURRENCY) ?? DEFAULT_CURRENCY,
        delta_percentage:
          typeof candidate.delta_percentage === 'number' ? candidate.delta_percentage : undefined,
      };
    }
  }
  return {
    value: typeof input === 'number' && Number.isFinite(input) ? input : 0,
    currency: DEFAULT_CURRENCY,
  };
};

const coerceOrdersKpi = (input: unknown): AdminOrdersKpi => {
  if (input && typeof input === 'object') {
    const candidate = input as Partial<AdminOrdersKpi>;
    if (typeof candidate.value === 'number') {
      return {
        value: candidate.value,
        delta_percentage:
          typeof candidate.delta_percentage === 'number' ? candidate.delta_percentage : undefined,
      };
    }
  }
  return {
    value: typeof input === 'number' && Number.isFinite(input) ? input : 0,
  };
};

const normalizeLoyaltyDistribution = (
  input: Record<string, number> | AdminLoyaltyDistributionEntry[] | undefined,
): AdminLoyaltyDistributionEntry[] => {
  if (Array.isArray(input)) {
    return input.map((entry) => ({
      loyalty_level: entry.loyalty_level,
      percentage: typeof entry.percentage === 'number' ? entry.percentage : 0,
      customers: typeof entry.customers === 'number' ? entry.customers : (entry.customers ?? null),
    }));
  }

  if (!input || typeof input !== 'object') {
    return [];
  }

  const entries = Object.entries(input).filter(
    ([, value]) => typeof value === 'number' && Number.isFinite(value),
  );
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  if (total <= 0) {
    return entries.map(([level]) => ({
      loyalty_level: level,
      percentage: 0,
      customers: 0,
    }));
  }

  return entries.map(([level, value]) => ({
    loyalty_level: level,
    customers: value,
    percentage: (value / total) * 100,
  }));
};

const normalizeExposureMix = (
  input: Record<string, number> | AdminExposureMixEntry[] | undefined,
): AdminExposureMixEntry[] => {
  if (Array.isArray(input)) {
    return input.map((entry) => ({
      slot: entry.slot,
      ctr: typeof entry.ctr === 'number' ? entry.ctr : 0,
      impressions: entry.impressions,
      clicks: entry.clicks,
    }));
  }

  if (!input || typeof input !== 'object') {
    return [];
  }

  return Object.entries(input)
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
    .map(([slot, value]) => {
      const normalized = value <= 1 ? value * 100 : value;
      return { slot, ctr: normalized };
    });
};

const safeNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const normalizeRecordCounts = (
  input: Record<string, unknown> | undefined,
): Record<string, number> => {
  if (!input || typeof input !== 'object') {
    return {};
  }
  return Object.entries(input).reduce<Record<string, number>>((acc, [key, value]) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

const normalizeTopSellers = (input: unknown): AdminTopSeller[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const data = raw as Partial<AdminTopSeller>;
      const product_id =
        data.product_id ?? (data as { productId?: string }).productId ?? null ?? null;
      if (!product_id) return null;
      return {
        product_id,
        product_title: typeof data.product_title === 'string' ? data.product_title : 'Producto',
        sku: typeof data.sku === 'string' ? data.sku : 'SKU',
        units_sold: safeNumber(data.units_sold),
        estimated_revenue: safeNumber(data.estimated_revenue),
      };
    })
    .filter((entry): entry is AdminTopSeller => entry !== null);
};

const normalizeInventoryItems = (input: unknown): AdminInventoryItemSummary[] => {
  if (!Array.isArray(input)) return [];
  return input.reduce<AdminInventoryItemSummary[]>((acc, raw) => {
    if (!raw || typeof raw !== 'object') return acc;
    const data = raw as Partial<AdminInventoryItemSummary>;
    const variant_id =
      data.variant_id ?? (data as { variantId?: string }).variantId ?? null ?? null;
    if (!variant_id) return acc;

    acc.push({
      variant_id,
      sku: typeof data.sku === 'string' ? data.sku : 'SKU',
      product_title:
        typeof data.product_title === 'string' ? data.product_title : 'Producto sin titulo',
      stock_on_hand: safeNumber(data.stock_on_hand),
      last_unit_cost: typeof data.last_unit_cost === 'number' ? data.last_unit_cost : null,
      estimated_value: safeNumber(data.estimated_value),
    });
    return acc;
  }, []);
};

const normalizeEngagementTotals = (
  input: Partial<AdminEngagementTotals> | undefined,
): AdminEngagementTotals => ({
  views: safeNumber(input?.views),
  clicks: safeNumber(input?.clicks),
  carts: safeNumber(input?.carts),
  purchases: safeNumber(input?.purchases),
  revenue: safeNumber(input?.revenue),
  conversion_rate: safeNumber(input?.conversion_rate),
  cart_rate: safeNumber(input?.cart_rate),
});

const normalizeEngagementTrend = (input: unknown): AdminEngagementPoint[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const point = raw as Partial<AdminEngagementPoint>;
      const date = point.date ?? (point as { date?: string }).date ?? null;
      if (!date) return null;
      return {
        date,
        views: safeNumber(point.views),
        clicks: safeNumber(point.clicks),
        carts: safeNumber(point.carts),
        purchases: safeNumber(point.purchases),
        revenue: safeNumber(point.revenue),
      };
    })
    .filter((entry): entry is AdminEngagementPoint => entry !== null);
};

const normalizeStockAlerts = (input: unknown): AdminStockAlertSummary[] => {
  if (!Array.isArray(input)) return [];
  return input.reduce<AdminStockAlertSummary[]>((acc, raw) => {
    if (!raw || typeof raw !== 'object') return acc;
    const data = raw as Partial<AdminStockAlertSummary>;
    const variant_id =
      data.variant_id ?? (data as { variantId?: string }).variantId ?? null ?? null;
    if (!variant_id) return acc;

    acc.push({
      variant_id,
      sku: typeof data.sku === 'string' ? data.sku : null,
      product_title: typeof data.product_title === 'string' ? data.product_title : null,
      available: safeNumber(data.available),
      reorder_point: safeNumber(data.reorder_point),
      missing: safeNumber(data.missing),
    });
    return acc;
  }, []);
};

const normalizePendingQuestions = (
  input: AdminPendingQuestionSummary[] | undefined,
): AdminPendingQuestionSummary[] => {
  if (!Array.isArray(input)) return [];
  return input.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    body: item.body,
    product_title: item.product_title,
    created_at: item.created_at,
    author_name: item.author_name,
  }));
};

const normalizePromotions = (input: unknown): AdminPromotionSummary[] => {
  if (!Array.isArray(input)) return [];
  return input.reduce<AdminPromotionSummary[]>((acc, raw) => {
    if (!raw || typeof raw !== 'object') return acc;
    const data = raw as Partial<AdminPromotionSummary>;
    const id = data.id ?? (data as { promotion_id?: string }).promotion_id ?? null;
    if (!id) return acc;

    acc.push({
      id,
      name: typeof data.name === 'string' ? data.name : 'Promocion',
      scope: typeof data.scope === 'string' ? data.scope : null,
      status: typeof data.status === 'string' ? data.status : null,
      starts_at: data.starts_at ?? null,
      ends_at: data.ends_at ?? null,
    });
    return acc;
  }, []);
};

type RawAnalyticsOverview = {
  period?: { start?: string | null; end?: string | null };
  kpis?: {
    total_revenue?: unknown;
    orders?: unknown;
    orders_received?: unknown;
    average_exposure_mix?: Record<string, number>;
    exposure_mix?: Record<string, number>;
    loyalty_distribution?: Record<string, number> | AdminLoyaltyDistributionEntry[];
    latest_orders?: AdminOrderSummary[];
  };
  total_revenue?: unknown;
  orders?: unknown;
  orders_received?: unknown;
  average_exposure_mix?: Record<string, number>;
  exposure_mix?: Record<string, number>;
  loyalty_distribution?: Record<string, number> | AdminLoyaltyDistributionEntry[];
  latest_orders?: AdminOrderSummary[];
};

const transformAnalyticsOverviewResponse = (
  response?: RawAnalyticsOverview,
): AdminAnalyticsOverview => {
  const kpis = response?.kpis ?? {};
  const totalRevenue = coerceRevenueKpi(kpis.total_revenue ?? response?.total_revenue);
  const orders = coerceOrdersKpi(
    kpis.orders_received ?? kpis.orders ?? response?.orders_received ?? response?.orders,
  );
  const loyaltyDistribution = normalizeLoyaltyDistribution(
    kpis.loyalty_distribution ?? response?.loyalty_distribution,
  );
  const exposureMix = normalizeExposureMix(
    kpis.average_exposure_mix ??
      kpis.exposure_mix ??
      response?.average_exposure_mix ??
      response?.exposure_mix,
  );
  const latestOrders =
    (Array.isArray(kpis.latest_orders) ? kpis.latest_orders : response?.latest_orders) ?? [];

  return {
    total_revenue: totalRevenue,
    orders_received: orders,
    loyalty_distribution: loyaltyDistribution,
    exposure_mix: exposureMix,
    latest_orders: latestOrders,
    period: response?.period ?? null,
  };
};

type RawAnalyticsDashboard = {
  period?: { start?: string | null; end?: string | null } | null;
  kpis?: {
    total_revenue?: unknown;
    orders?: unknown;
    orders_received?: unknown;
    average_order_value?: unknown;
    average_exposure_mix?: Record<string, number>;
    loyalty_distribution?: Record<string, number> | AdminLoyaltyDistributionEntry[];
  };
  sales?: {
    summary?: Partial<AdminSalesSummary>;
    top_sellers?: unknown;
  };
  inventory?: {
    total_estimated_value?: unknown;
    total_units?: unknown;
    items?: unknown;
  };
  engagement?: {
    totals?: Partial<AdminEngagementTotals>;
    trend?: unknown;
  };
  operations?: {
    orders_by_status?: Record<string, unknown>;
    payments_by_status?: Record<string, unknown>;
    shipments_by_status?: Record<string, unknown>;
    stock_alerts?: unknown;
    pending_questions?: AdminPendingQuestionSummary[];
  };
  promotions?: {
    active_count?: unknown;
    active?: unknown;
  };
};

const transformAnalyticsDashboardResponse = (
  response?: RawAnalyticsDashboard,
): AdminAnalyticsDashboard => {
  const kpis = response?.kpis ?? {};
  const totalRevenue = coerceRevenueKpi(kpis.total_revenue);
  const orders = coerceOrdersKpi(kpis.orders_received ?? kpis.orders);
  const loyaltyDistribution = normalizeLoyaltyDistribution(kpis.loyalty_distribution);
  const exposureMix = normalizeExposureMix(kpis.average_exposure_mix);
  const averageOrderValue = safeNumber(kpis.average_order_value);

  const salesSummary = response?.sales?.summary
    ? {
        total_revenue: safeNumber(response.sales.summary.total_revenue),
        total_units_sold: safeNumber(response.sales.summary.total_units_sold),
        total_sales_transactions: safeNumber(response.sales.summary.total_sales_transactions),
      }
    : null;
  const topSellers = normalizeTopSellers(response?.sales?.top_sellers);

  const inventoryBlock = response?.inventory ?? {};
  const inventory = {
    total_estimated_value: safeNumber(inventoryBlock.total_estimated_value),
    total_units: safeNumber(inventoryBlock.total_units),
    items: normalizeInventoryItems(inventoryBlock.items),
  };

  const engagementBlock = response?.engagement ?? {};
  const engagement = {
    totals: normalizeEngagementTotals(engagementBlock.totals),
    trend: normalizeEngagementTrend(engagementBlock.trend),
  };

  const operationsBlock = response?.operations ?? {};
  const operations = {
    orders_by_status: normalizeRecordCounts(operationsBlock.orders_by_status),
    payments_by_status: normalizeRecordCounts(operationsBlock.payments_by_status),
    shipments_by_status: normalizeRecordCounts(operationsBlock.shipments_by_status),
    stock_alerts: normalizeStockAlerts(operationsBlock.stock_alerts),
    pending_questions: normalizePendingQuestions(operationsBlock.pending_questions),
  };

  const promotionsBlock = response?.promotions ?? {};
  const promotions = {
    active_count: safeNumber(promotionsBlock.active_count),
    active: normalizePromotions(promotionsBlock.active),
  };

  return {
    period: response?.period ?? null,
    total_revenue: totalRevenue,
    orders_received: orders,
    average_order_value: averageOrderValue,
    loyalty_distribution: loyaltyDistribution,
    exposure_mix: exposureMix,
    sales_summary: salesSummary,
    top_sellers: topSellers,
    inventory,
    engagement,
    operations,
    promotions,
  };
};

const extractLimit = (params: { limit?: number } | void, fallback: number): number => {
  if (
    params &&
    typeof params === 'object' &&
    typeof params.limit === 'number' &&
    params.limit > 0
  ) {
    return params.limit;
  }
  return fallback;
};

// Antes: interface ListUsersParams extends PaginationParams {}
// Ahora: type (no dispara no-empty-object-type)
type ListUsersParams = PaginationParams;

type CreateUserAdminBody = Partial<UserCreate> &
  Pick<UserCreate, 'email' | 'password'> & {
    is_superuser?: boolean;
  };

interface SetUserRoleParams {
  userId: string;
  makeAdmin: boolean;
}

interface SetUserActiveParams {
  userId: string;
  active: boolean;
}

type AdminPromotionPayload = Record<string, unknown>;

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAnalyticsOverview: build.query<AdminAnalyticsOverview, void>({
      query: () => ({
        url: '/admin/analytics/overview',
      }),
      transformResponse: (response: RawAnalyticsOverview | undefined) =>
        transformAnalyticsOverviewResponse(response),
      providesTags: [{ type: 'AdminAnalytics', id: 'OVERVIEW' }],
    }),
    getAnalyticsDashboard: build.query<AdminAnalyticsDashboard, void>({
      query: () => ({
        url: '/admin/analytics/dashboard',
      }),
      transformResponse: (response: RawAnalyticsDashboard | undefined) =>
        transformAnalyticsDashboardResponse(response),
      providesTags: [{ type: 'AdminAnalytics', id: 'DASHBOARD' }],
    }),

    listUsers: build.query<Paginated<UserRead>, ListUsersParams | void>({
      query: (params) => {
        const page = params?.page ?? 1;
        const pageSize = params?.page_size ?? 50;
        const safePage = page > 0 ? page : 1;
        const safeSize = pageSize > 0 ? pageSize : 50;
        return {
          url: '/admin/users',
          params: {
            skip: (safePage - 1) * safeSize,
            limit: safeSize,
          },
        };
      },
      transformResponse: (response: Paginated<UserRead> | UserRead[] | undefined, _meta, params) =>
        normalizePaginated(response, {
          page: params?.page ?? 1,
          page_size: params?.page_size ?? 50,
        }),
      providesTags: (result) => {
        const items = result?.items ?? [];

        return [
          ...items.map(({ id }) => ({ type: 'User' as const, id })),
          { type: 'UserList' as const, id: 'LIST' },
        ];
      },
    }),

    createUserAdmin: build.mutation<UserRead, CreateUserAdminBody>({
      query: ({ is_superuser = false, ...body }) => ({
        url: '/admin/users',
        method: 'POST',
        params: { is_superuser },
        body,
      }),
      invalidatesTags: [{ type: 'UserList', id: 'LIST' }],
    }),

    setUserRole: build.mutation<UserRead, SetUserRoleParams>({
      query: ({ userId, makeAdmin }) => ({
        url: `/admin/users/${userId}/role`,
        method: 'PATCH',
        params: { make_admin: makeAdmin },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        { type: 'UserList', id: 'LIST' },
      ],
    }),

    setUserActiveStatus: build.mutation<UserRead, SetUserActiveParams>({
      query: ({ userId, active }) => ({
        url: `/admin/users/${userId}/active`,
        method: 'PATCH',
        params: { active },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        { type: 'UserList', id: 'LIST' },
      ],
    }),

    getPendingProductQuestions: build.query<
      Paginated<AdminPendingQuestionSummary>,
      { limit?: number } | void
    >({
      query: (params) => {
        const limit = extractLimit(params, 5);
        return {
          url: '/admin/product-questions',
          params: { limit },
        };
      },
      transformResponse: (
        response:
          | Paginated<AdminPendingQuestionSummary>
          | AdminPendingQuestionSummary[]
          | undefined,
        _meta,
        params,
      ) =>
        normalizePaginated(response, {
          page: 1,
          page_size: extractLimit(params, 5),
        }),
      providesTags: [{ type: 'AdminQuestion', id: 'PENDING' }],
    }),

    createAdminProduct: build.mutation<Product, ProductCreate>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'ProductList', id: 'LIST' },
        { type: 'AdminAnalytics', id: 'OVERVIEW' },
      ],
    }),

    listAdminCategories: build.query<Category[], void>({
      query: () => ({
        url: '/admin/categories',
      }),
      providesTags: (result) =>
        result && result.length > 0
          ? [
              ...result.map((category) => ({
                type: 'CatalogCategory' as const,
                id: category.id,
              })),
              { type: 'CatalogCategory' as const, id: 'LIST' },
            ]
          : [{ type: 'CatalogCategory' as const, id: 'LIST' }],
    }),

    createAdminCategory: build.mutation<Category, CategoryCreateInput>({
      query: (body) => ({
        url: '/admin/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'CatalogCategory', id: 'LIST' }],
    }),

    updateAdminCategory: build.mutation<
      Category,
      { categoryId: string; data: CategoryUpdateInput }
    >({
      query: ({ categoryId, data }) => ({
        url: `/admin/categories/${categoryId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { categoryId }) => [
        { type: 'CatalogCategory', id: categoryId },
        { type: 'CatalogCategory', id: 'LIST' },
      ],
    }),
    deleteAdminCategory: build.mutation<void, { categoryId: string }>({
      query: ({ categoryId }) => ({
        url: `/admin/categories/${categoryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { categoryId }) => [
        { type: 'CatalogCategory', id: categoryId },
        { type: 'CatalogCategory', id: 'LIST' },
      ],
    }),

    listAdminPromotions: build.query<AdminPromotionPayload[], { status_filter?: string } | void>({
      query: (params) => ({
        url: '/admin/promotions',
        params: params?.status_filter ? { status_filter: params.status_filter } : undefined,
      }),
      providesTags: [{ type: 'AdminAnalytics', id: 'PROMOTIONS' }],
    }),

    createAdminPromotion: build.mutation<AdminPromotionPayload, AdminPromotionPayload>({
      query: (body) => ({
        url: '/admin/promotions',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'AdminAnalytics', id: 'PROMOTIONS' },
        { type: 'AdminAnalytics', id: 'OVERVIEW' },
      ],
    }),

    updateAdminPromotion: build.mutation<
      AdminPromotionPayload,
      { promotionId: string; data: AdminPromotionPayload }
    >({
      query: ({ promotionId, data }) => ({
        url: `/admin/promotions/${promotionId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: [{ type: 'AdminAnalytics', id: 'PROMOTIONS' }],
    }),

    activateAdminPromotion: build.mutation<AdminPromotionPayload, { promotionId: string }>({
      query: ({ promotionId }) => ({
        url: `/admin/promotions/${promotionId}/activate`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'AdminAnalytics', id: 'PROMOTIONS' }],
    }),

    deactivateAdminPromotion: build.mutation<AdminPromotionPayload, { promotionId: string }>({
      query: ({ promotionId }) => ({
        url: `/admin/promotions/${promotionId}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'AdminAnalytics', id: 'PROMOTIONS' }],
    }),
  }),
});

export const {
  useGetAnalyticsOverviewQuery,
  useGetAnalyticsDashboardQuery,
  useListUsersQuery,
  useLazyListUsersQuery,
  useCreateUserAdminMutation,
  useSetUserRoleMutation,
  useSetUserActiveStatusMutation,
  useGetPendingProductQuestionsQuery,
  useCreateAdminProductMutation,
  useListAdminCategoriesQuery,
  useCreateAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
  useListAdminPromotionsQuery,
  useLazyListAdminPromotionsQuery,
  useCreateAdminPromotionMutation,
  useUpdateAdminPromotionMutation,
  useActivateAdminPromotionMutation,
  useDeactivateAdminPromotionMutation,
} = adminApi;
