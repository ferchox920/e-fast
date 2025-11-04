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
  ProductQuestionCreate,
  ProductUpdate,
  ProductVariant,
  ProductVariantCreate,
  ProductVariantUpdate,
} from '@/types/product';

type UpdateProductArgs = {
  productId: string;
  body: ProductUpdate;
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
};

type CreateProductQuestionArgs = ProductQuestionVariables & {
  body: ProductQuestionCreate;
};

const sanitizeParams = (params: ProductListParams | undefined) => {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
};

export const productApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<PaginatedResponse<Product>, ProductListParams | undefined>({
      query: (params) => ({
        url: '/products',
        params: sanitizeParams(params),
      }),
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
      query: ({ productId }) => ({
        url: `/products/${productId}/questions`,
      }),
      providesTags: (result, error, { productId }) => [
        { type: 'Product', id: productId },
        { type: 'ProductQuestion', id: productId },
      ],
    }),

    postProductQuestion: build.mutation<ProductQuestion, CreateProductQuestionArgs>({
      query: ({ productId, body }) => ({
        url: `/products/${productId}/questions`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'ProductQuestion', id: productId },
        { type: 'Product', id: productId },
      ],
    }),
  }),
});

export const useGetProductsQuery = productApi.endpoints.getProducts.useQuery;
export const useLazyGetProductsQuery = productApi.endpoints.getProducts.useLazyQuery;
export const useGetProductBySlugQuery = productApi.endpoints.getProductBySlug.useQuery;
export const useLazyGetProductBySlugQuery = productApi.endpoints.getProductBySlug.useLazyQuery;
export const useCreateProductMutation = productApi.endpoints.createProduct.useMutation;
export const useUpdateProductMutation = productApi.endpoints.updateProduct.useMutation;
export const useCreateVariantMutation = productApi.endpoints.createVariant.useMutation;
export const useUpdateVariantMutation = productApi.endpoints.updateVariant.useMutation;
export const useDeleteVariantMutation = productApi.endpoints.deleteVariant.useMutation;
export const useAddImageMutation = productApi.endpoints.addImage.useMutation;
export const useSetPrimaryImageMutation = productApi.endpoints.setPrimaryImage.useMutation;
export const useGetProductQuestionsQuery = productApi.endpoints.getProductQuestions.useQuery;
export const useLazyGetProductQuestionsQuery =
  productApi.endpoints.getProductQuestions.useLazyQuery;
export const usePostProductQuestionMutation = productApi.endpoints.postProductQuestion.useMutation;

// Backwards-compatible aliases for existing consumers still using legacy hooks.
export const useListProductsQuery = useGetProductsQuery;
export const useLazyListProductsQuery = useLazyGetProductsQuery;
export const useGetProductQuery = useGetProductBySlugQuery;
export const useLazyGetProductQuery = useLazyGetProductBySlugQuery;
