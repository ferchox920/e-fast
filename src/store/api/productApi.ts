// src/store/api/productApi.ts
import { baseApi } from './baseApi';
import type {
  PaginatedProducts,
  ProductCreate,
  ProductImageCreate,
  ProductImageRead,
  ProductListParams,
  ProductRead,
  ProductUpdate,
  ProductVariantCreate,
  ProductVariantRead,
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

export const productApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listProducts: build.query<PaginatedProducts, ProductListParams | undefined>({
      query: (params) => ({
        url: '/products',
        params: params ? params : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id, slug }) => ({ type: 'Product' as const, id: id ?? slug })),
              { type: 'ProductList' as const, id: 'LIST' },
            ]
          : [{ type: 'ProductList' as const, id: 'LIST' }],
    }),

    getProduct: build.query<ProductRead, string>({
      query: (slug) => ({
        url: `/products/${slug}`,
      }),
      providesTags: (result, error, slug) => [{ type: 'Product' as const, id: result?.id ?? slug }],
    }),

    createProduct: build.mutation<ProductRead, ProductCreate>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ProductList', id: 'LIST' }],
    }),

    updateProduct: build.mutation<ProductRead, UpdateProductArgs>({
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

    listVariants: build.query<ProductVariantRead[], string>({
      query: (productId) => ({
        url: `/products/${productId}/variants`,
      }),
      providesTags: (result, error, productId) => {
        const variantTags =
          result?.map((variant) => ({ type: 'ProductVariant' as const, id: variant.id })) ?? [];
        return [...variantTags, { type: 'Product', id: productId }];
      },
    }),

    createVariant: build.mutation<ProductVariantRead, CreateVariantArgs>({
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

    updateVariant: build.mutation<ProductVariantRead, UpdateVariantArgs>({
      query: ({ variantId, body }) => ({
        url: `/variants/${variantId}`,
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
        url: `/variants/${variantId}`,
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

    addImage: build.mutation<ProductImageRead, AddImageArgs>({
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

    setPrimaryImage: build.mutation<ProductRead, SetPrimaryImageArgs>({
      query: ({ productId, imageId }) => ({
        url: `/products/${productId}/images/${imageId}/primary`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Product', id: result?.id ?? productId },
        { type: 'ProductList', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListProductsQuery,
  useLazyListProductsQuery,
  useGetProductQuery,
  useLazyGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useListVariantsQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
  useAddImageMutation,
  useSetPrimaryImageMutation,
} = productApi;
