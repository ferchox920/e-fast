'use client';
// src/store/api/productApi.ts
import { baseApi } from './baseApi';
import type {
  PaginatedResponse,
  Product,
  ProductCreate,
  ProductImage,
  ProductImageCreate,
  ProductListParams,
  ProductQuestion,
  ProductQuestionAnswer,
  ProductQuestionAnswerCreate,
  ProductQuestionBlockUpdate,
  ProductQuestionCreate,
  ProductQuestionVisibilityUpdate,
  ProductUpdate,
  ProductVariant,
  ProductVariantCreate,
  ProductVariantUpdate,
} from '@/types/product';

type UpdateProductArgs = {
  productId: string;
  body: ProductUpdate;
};

type GetProductVariantsArgs = {
  productId: string;
};

type CreateVariantArgs = {
  productId: string;
  body: ProductVariantCreate;
};

type UpdateVariantArgs = {
  variantId: string;
  body: ProductVariantUpdate;
};

type DeleteVariantArgs = {
  variantId: string;
  productId?: string;
};

type AddImageArgs = {
  productId: string;
  body: ProductImageCreate;
};

type SetPrimaryImageArgs = {
  productId: string;
  imageId: string;
};

type ProductQuestionVariables = {
  productId: string;
  include_hidden?: boolean;
};

type CreateProductQuestionArgs = ProductQuestionVariables & {
  body: ProductQuestionCreate;
};

type AnswerProductQuestionArgs = {
  questionId: string;
  body: ProductQuestionAnswerCreate;
};

type SetProductQuestionVisibilityArgs = {
  questionId: string;
  body: ProductQuestionVisibilityUpdate;
};

type SetProductQuestionBlockArgs = {
  questionId: string;
  body: ProductQuestionBlockUpdate;
};

type SetVariantStockArgs = {
  variantId: string;
  on_hand?: number;
  reserved?: number;
};

type MoveVariantStockArgs = {
  variantId: string;
  body: { type: string; quantity: number; reason?: string | null };
};

type AdjustVariantStockArgs = {
  variantId: string;
  delta: number;
  reason?: string | null;
};

type ListVariantMovementsArgs = {
  variantId: string;
  limit?: number;
  offset?: number;
};

const LOW_STOCK_THRESHOLD = 5;
const LOW_STOCK_BATCH_LIMIT = 100;
const LOW_STOCK_MAX_PAGES = 50;

type RawProductsResponse =
  | PaginatedResponse<Product>
  | (Omit<PaginatedResponse<Product>, 'page_size'> & { limit?: number })
  | undefined;

const buildProductsQueryParams = (
  params: ProductListParams | undefined,
  options?: { omitPagination?: boolean },
) => {
  if (!params) return undefined;

  const page = typeof params.page === 'number' && params.page > 0 ? params.page : undefined;
  const pageSize =
    typeof params.page_size === 'number' && params.page_size > 0 ? params.page_size : undefined;
  const limit =
    typeof params.limit === 'number' && params.limit > 0 ? params.limit : (pageSize ?? undefined);
  const offset =
    typeof params.offset === 'number' && params.offset >= 0
      ? params.offset
      : page && limit
        ? (page - 1) * limit
        : undefined;

  const mapped: Record<string, unknown> = {
    search: params.search,
    category: params.category ?? params.category_id,
    brand: params.brand ?? params.brand_id,
    min_price: params.min_price,
    max_price: params.max_price,
  };
  if (!options?.omitPagination) {
    mapped.limit = limit;
    mapped.offset = offset;
  }

  return Object.fromEntries(
    Object.entries(mapped).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
};

const normalizeProductsResponse = (response: RawProductsResponse): PaginatedResponse<Product> => {
  if (!response) {
    return {
      items: [],
      total: 0,
      page: 1,
      page_size: 20,
      pages: 1,
    };
  }

  const fallbackItems = Array.isArray(response.items) ? response.items : [];
  const fallbackTotal = typeof response.total === 'number' ? response.total : fallbackItems.length;
  const fallbackPage = typeof response.page === 'number' && response.page > 0 ? response.page : 1;
  const inferredPageSize =
    typeof (response as { page_size?: number }).page_size === 'number' &&
    (response as { page_size?: number }).page_size! > 0
      ? (response as { page_size: number }).page_size
      : typeof (response as { limit?: number }).limit === 'number' &&
          (response as { limit?: number }).limit! > 0
        ? (response as { limit: number }).limit
        : fallbackItems.length > 0
          ? fallbackItems.length
          : 20;
  const fallbackPages =
    typeof response.pages === 'number' && response.pages > 0
      ? response.pages
      : Math.max(1, Math.ceil(fallbackTotal / Math.max(inferredPageSize, 1)));

  return {
    items: fallbackItems,
    total: fallbackTotal,
    page: fallbackPage,
    page_size: inferredPageSize,
    pages: fallbackPages,
  };
};

const getRequestedPage = (params: ProductListParams | undefined) =>
  typeof params?.page === 'number' && params.page > 0 ? params.page : 1;

const getRequestedPageSize = (params: ProductListParams | undefined) => {
  if (typeof params?.page_size === 'number' && params.page_size > 0) return params.page_size;
  if (typeof params?.limit === 'number' && params.limit > 0) return params.limit;
  return 20;
};

const computeProductStock = (product: Product) =>
  (product.variants ?? []).reduce((sum, variant) => sum + (variant.stock_on_hand ?? 0), 0);

const mapQuestionAnswer = (raw: Partial<ProductQuestionAnswer>): ProductQuestionAnswer => {
  const content = raw.content ?? raw.body ?? '';
  return {
    id: String(raw.id ?? ''),
    content,
    body: content,
    question_id: raw.question_id,
    admin_id: raw.admin_id,
    is_visible: raw.is_visible,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    author: raw.author ?? null,
  };
};

const mapProductQuestion = (raw: Partial<ProductQuestion>): ProductQuestion => {
  const answers = Array.isArray(raw.answers)
    ? raw.answers.map((item) => mapQuestionAnswer(item))
    : [];
  const firstVisibleAnswer =
    answers.find((item) => item.is_visible !== false) ?? answers[0] ?? null;
  const content = raw.content ?? raw.body ?? '';

  return {
    id: String(raw.id ?? ''),
    product_id: raw.product_id ?? '',
    user_id: raw.user_id,
    content,
    body: content,
    status: raw.status,
    is_visible: raw.is_visible,
    is_blocked: raw.is_blocked,
    author: raw.author ?? null,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    answers,
    answer: firstVisibleAnswer,
  };
};

export const productApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<PaginatedResponse<Product>, ProductListParams | undefined>({
      async queryFn(arg, _queryApi, _extraOptions, fetchWithBQ) {
        const isLowStockFilter = arg?.stock_status === 'low';

        if (!isLowStockFilter) {
          const response = await fetchWithBQ({
            url: '/products',
            params: buildProductsQueryParams(arg),
          });
          if (response.error) {
            return { error: response.error };
          }
          return { data: normalizeProductsResponse(response.data as RawProductsResponse) };
        }

        const baseParams = buildProductsQueryParams(arg, { omitPagination: true }) ?? {};
        const requestedPage = getRequestedPage(arg);
        const requestedPageSize = getRequestedPageSize(arg);

        let total = Number.POSITIVE_INFINITY;
        let offset = 0;
        let pageReads = 0;
        const lowStockItems: Product[] = [];

        while (offset < total && pageReads < LOW_STOCK_MAX_PAGES) {
          const response = await fetchWithBQ({
            url: '/products',
            params: {
              ...baseParams,
              limit: LOW_STOCK_BATCH_LIMIT,
              offset,
            },
          });
          if (response.error) {
            return { error: response.error };
          }

          const normalized = normalizeProductsResponse(response.data as RawProductsResponse);
          total = normalized.total;
          pageReads += 1;
          offset += LOW_STOCK_BATCH_LIMIT;

          const filteredBatch = normalized.items.filter(
            (product) => computeProductStock(product) < LOW_STOCK_THRESHOLD,
          );
          lowStockItems.push(...filteredBatch);

          if (normalized.items.length === 0) {
            break;
          }
        }

        const start = (requestedPage - 1) * requestedPageSize;
        const end = start + requestedPageSize;
        const pagedItems = lowStockItems.slice(start, end);
        const filteredTotal = lowStockItems.length;
        const filteredPages = Math.max(1, Math.ceil(filteredTotal / requestedPageSize));

        return {
          data: {
            items: pagedItems,
            total: filteredTotal,
            page: requestedPage,
            page_size: requestedPageSize,
            pages: filteredPages,
          },
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id, slug }) => ({
                type: 'Product' as const,
                id: id ?? slug,
              })),
              { type: 'ProductList' as const, id: 'LIST' },
            ]
          : [{ type: 'ProductList' as const, id: 'LIST' }],
    }),

    getProductBySlug: build.query<Product, string>({
      query: (slug) => ({
        url: `/products/${slug}`,
      }),
      providesTags: (result, error, slug) => [{ type: 'Product' as const, id: result?.id ?? slug }],
    }),

    createProduct: build.mutation<Product, ProductCreate>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ProductList', id: 'LIST' }],
    }),

    updateProduct: build.mutation<Product, UpdateProductArgs>({
      query: ({ productId, body }) => ({
        url: `/products/${productId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Product', id: result?.id ?? productId },
        { type: 'ProductList', id: 'LIST' },
      ],
    }),

    getProductVariants: build.query<ProductVariant[], GetProductVariantsArgs>({
      query: ({ productId }) => ({
        url: `/products/${productId}/variants`,
      }),
      providesTags: (result, _error, { productId }) => [
        { type: 'Product', id: productId },
        ...(result?.map((variant) => ({ type: 'ProductVariant' as const, id: variant.id })) ?? []),
      ],
    }),

    createVariant: build.mutation<ProductVariant, CreateVariantArgs>({
      query: ({ productId, body }) => ({
        url: `/products/${productId}/variants`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Product', id: productId },
        { type: 'ProductList', id: 'LIST' },
      ],
    }),

    updateVariant: build.mutation<ProductVariant, UpdateVariantArgs>({
      query: ({ variantId, body }) => ({
        url: `/products/variants/${variantId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { variantId }) => [
        { type: 'ProductVariant' as const, id: variantId },
        ...(result?.product_id ? [{ type: 'Product' as const, id: result.product_id }] : []),
      ],
    }),

    deleteVariant: build.mutation<void, DeleteVariantArgs>({
      query: ({ variantId }) => ({
        url: `/products/variants/${variantId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { variantId, productId }) => {
        const baseTags = [
          { type: 'ProductVariant' as const, id: variantId },
          { type: 'ProductList' as const, id: 'LIST' },
        ];
        return productId ? [...baseTags, { type: 'Product' as const, id: productId }] : baseTags;
      },
    }),

    addImage: build.mutation<ProductImage, AddImageArgs>({
      query: ({ productId, body }) => ({
        url: `/products/${productId}/images`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Product' as const, id: result?.product_id ?? productId },
        { type: 'ProductList', id: 'LIST' },
        ...(result?.id ? [{ type: 'ProductImage' as const, id: result.id }] : []),
      ],
    }),

    setPrimaryImage: build.mutation<Product, SetPrimaryImageArgs>({
      query: ({ productId, imageId }) => ({
        url: `/products/${productId}/images/${imageId}/primary`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Product', id: result?.id ?? productId },
        { type: 'ProductList', id: 'LIST' },
      ],
    }),

    getProductQuestions: build.query<ProductQuestion[], ProductQuestionVariables>({
      query: ({ productId, include_hidden }) => ({
        url: `/products/${productId}/questions`,
        params: include_hidden ? { include_hidden } : undefined,
      }),
      transformResponse: (response: ProductQuestion[] | undefined) =>
        Array.isArray(response) ? response.map((item) => mapProductQuestion(item)) : [],
      providesTags: (result, _error, { productId }) =>
        result && result.length > 0
          ? [
              { type: 'Product', id: productId },
              { type: 'ProductQuestion', id: `PRODUCT:${productId}` },
              ...result.map((item) => ({ type: 'ProductQuestion' as const, id: item.id })),
            ]
          : [
              { type: 'Product', id: productId },
              { type: 'ProductQuestion', id: `PRODUCT:${productId}` },
            ],
    }),

    postProductQuestion: build.mutation<ProductQuestion, CreateProductQuestionArgs>({
      query: ({ productId, body }) => ({
        url: `/products/${productId}/questions`,
        method: 'POST',
        body: {
          content: body.content ?? body.body ?? '',
        },
      }),
      transformResponse: (response: ProductQuestion) => mapProductQuestion(response),
      invalidatesTags: (result, _error, { productId }) => [
        { type: 'ProductQuestion', id: `PRODUCT:${productId}` },
        ...(result?.id ? [{ type: 'ProductQuestion' as const, id: result.id }] : []),
        { type: 'Product', id: productId },
        { type: 'AdminQuestion', id: 'PENDING' },
      ],
    }),

    answerProductQuestion: build.mutation<ProductQuestion, AnswerProductQuestionArgs>({
      query: ({ questionId, body }) => ({
        url: `/products/questions/${questionId}/answer`,
        method: 'POST',
        body: {
          content: body.content ?? body.body ?? '',
        },
      }),
      transformResponse: (response: ProductQuestion) => mapProductQuestion(response),
      invalidatesTags: (result, _error, { questionId }) => [
        { type: 'ProductQuestion', id: questionId },
        ...(result?.product_id
          ? [{ type: 'ProductQuestion' as const, id: `PRODUCT:${result.product_id}` }]
          : []),
        { type: 'ProductList', id: 'LIST' },
        { type: 'AdminQuestion', id: 'PENDING' },
      ],
    }),

    setProductQuestionVisibility: build.mutation<ProductQuestion, SetProductQuestionVisibilityArgs>(
      {
        query: ({ questionId, body }) => ({
          url: `/products/questions/${questionId}/visibility`,
          method: 'PATCH',
          body,
        }),
        transformResponse: (response: ProductQuestion) => mapProductQuestion(response),
        invalidatesTags: (result, _error, { questionId }) => [
          { type: 'ProductQuestion', id: questionId },
          ...(result?.product_id
            ? [{ type: 'ProductQuestion' as const, id: `PRODUCT:${result.product_id}` }]
            : []),
          { type: 'ProductList', id: 'LIST' },
          { type: 'AdminQuestion', id: 'PENDING' },
        ],
      },
    ),

    setProductQuestionBlock: build.mutation<ProductQuestion, SetProductQuestionBlockArgs>({
      query: ({ questionId, body }) => ({
        url: `/products/questions/${questionId}/block`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: ProductQuestion) => mapProductQuestion(response),
      invalidatesTags: (result, _error, { questionId }) => [
        { type: 'ProductQuestion', id: questionId },
        ...(result?.product_id
          ? [{ type: 'ProductQuestion' as const, id: `PRODUCT:${result.product_id}` }]
          : []),
        { type: 'ProductList', id: 'LIST' },
        { type: 'AdminQuestion', id: 'PENDING' },
      ],
    }),

    setVariantStock: build.mutation<ProductVariant, SetVariantStockArgs>({
      query: ({ variantId, on_hand, reserved }) => ({
        url: `/products/variants/${variantId}/stock`,
        method: 'PATCH',
        params: { on_hand, reserved },
      }),
      invalidatesTags: (result, error, { variantId }) => [
        { type: 'ProductVariant' as const, id: variantId },
      ],
    }),

    receiveVariantStock: build.mutation<ProductVariant, MoveVariantStockArgs>({
      query: ({ variantId, body }) => ({
        url: `/products/variants/${variantId}/stock/receive`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { variantId }) => [
        { type: 'ProductVariant' as const, id: variantId },
      ],
    }),

    reserveVariantStock: build.mutation<ProductVariant, MoveVariantStockArgs>({
      query: ({ variantId, body }) => ({
        url: `/products/variants/${variantId}/stock/reserve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { variantId }) => [
        { type: 'ProductVariant' as const, id: variantId },
      ],
    }),

    releaseVariantStock: build.mutation<ProductVariant, MoveVariantStockArgs>({
      query: ({ variantId, body }) => ({
        url: `/products/variants/${variantId}/stock/release`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { variantId }) => [
        { type: 'ProductVariant' as const, id: variantId },
      ],
    }),

    sellVariantStock: build.mutation<ProductVariant, MoveVariantStockArgs>({
      query: ({ variantId, body }) => ({
        url: `/products/variants/${variantId}/stock/sale`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { variantId }) => [
        { type: 'ProductVariant' as const, id: variantId },
      ],
    }),

    adjustVariantStock: build.mutation<ProductVariant, AdjustVariantStockArgs>({
      query: ({ variantId, delta, reason }) => ({
        url: `/products/variants/${variantId}/stock/adjust`,
        method: 'POST',
        params: { delta, reason },
      }),
      invalidatesTags: (result, error, { variantId }) => [
        { type: 'ProductVariant' as const, id: variantId },
      ],
    }),

    getVariantStockMovements: build.query<Array<Record<string, unknown>>, ListVariantMovementsArgs>(
      {
        query: ({ variantId, limit = 50, offset = 0 }) => ({
          url: `/products/variants/${variantId}/stock/movements`,
          params: { limit, offset },
        }),
        providesTags: (result, error, { variantId }) => [
          { type: 'ProductVariant' as const, id: variantId },
        ],
      },
    ),

    getProductQuality: build.query<Record<string, unknown>, { productId: string }>({
      query: ({ productId }) => ({
        url: `/products/${productId}/quality`,
      }),
      providesTags: (result, error, { productId }) => [{ type: 'Product' as const, id: productId }],
    }),
  }),
});

export const useGetProductsQuery = productApi.endpoints.getProducts.useQuery;
export const useLazyGetProductsQuery = productApi.endpoints.getProducts.useLazyQuery;
export const useGetProductBySlugQuery = productApi.endpoints.getProductBySlug.useQuery;
export const useLazyGetProductBySlugQuery = productApi.endpoints.getProductBySlug.useLazyQuery;
export const useCreateProductMutation = productApi.endpoints.createProduct.useMutation;
export const useUpdateProductMutation = productApi.endpoints.updateProduct.useMutation;
export const useGetProductVariantsQuery = productApi.endpoints.getProductVariants.useQuery;
export const useLazyGetProductVariantsQuery = productApi.endpoints.getProductVariants.useLazyQuery;
export const useCreateVariantMutation = productApi.endpoints.createVariant.useMutation;
export const useUpdateVariantMutation = productApi.endpoints.updateVariant.useMutation;
export const useDeleteVariantMutation = productApi.endpoints.deleteVariant.useMutation;
export const useAddImageMutation = productApi.endpoints.addImage.useMutation;
export const useSetPrimaryImageMutation = productApi.endpoints.setPrimaryImage.useMutation;
export const useGetProductQuestionsQuery = productApi.endpoints.getProductQuestions.useQuery;
export const useLazyGetProductQuestionsQuery =
  productApi.endpoints.getProductQuestions.useLazyQuery;
export const usePostProductQuestionMutation = productApi.endpoints.postProductQuestion.useMutation;
export const useAnswerProductQuestionMutation =
  productApi.endpoints.answerProductQuestion.useMutation;
export const useSetProductQuestionVisibilityMutation =
  productApi.endpoints.setProductQuestionVisibility.useMutation;
export const useSetProductQuestionBlockMutation =
  productApi.endpoints.setProductQuestionBlock.useMutation;
export const useSetVariantStockMutation = productApi.endpoints.setVariantStock.useMutation;
export const useReceiveVariantStockMutation = productApi.endpoints.receiveVariantStock.useMutation;
export const useReserveVariantStockMutation = productApi.endpoints.reserveVariantStock.useMutation;
export const useReleaseVariantStockMutation = productApi.endpoints.releaseVariantStock.useMutation;
export const useSellVariantStockMutation = productApi.endpoints.sellVariantStock.useMutation;
export const useAdjustVariantStockMutation = productApi.endpoints.adjustVariantStock.useMutation;
export const useGetVariantStockMovementsQuery =
  productApi.endpoints.getVariantStockMovements.useQuery;
export const useLazyGetVariantStockMovementsQuery =
  productApi.endpoints.getVariantStockMovements.useLazyQuery;
export const useGetProductQualityQuery = productApi.endpoints.getProductQuality.useQuery;
export const useLazyGetProductQualityQuery = productApi.endpoints.getProductQuality.useLazyQuery;

// Backwards-compatible aliases for existing consumers still using legacy hooks.
export const useListProductsQuery = useGetProductsQuery;
export const useLazyListProductsQuery = useLazyGetProductsQuery;
export const useGetProductQuery = useGetProductBySlugQuery;
export const useLazyGetProductQuery = useLazyGetProductBySlugQuery;
export const useListProductVariantsQuery = useGetProductVariantsQuery;
export const useLazyListProductVariantsQuery = useLazyGetProductVariantsQuery;
