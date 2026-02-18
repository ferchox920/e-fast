import { baseApi } from './baseApi';
import type {
  Brand,
  BrandCreateInput,
  BrandUpdateInput,
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  PaginatedResponse,
} from '@/types/catalog';

const normalizeListResponse = <T>(response: PaginatedResponse<T> | T[] | undefined): T[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (typeof response === 'object' && Array.isArray((response as PaginatedResponse<T>).items)) {
    return (response as PaginatedResponse<T>).items;
  }
  return [];
};

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<Category[], void>({
      query: () => ({
        url: '/categories',
      }),
      transformResponse: (response: PaginatedResponse<Category> | Category[]) =>
        normalizeListResponse(response),
      providesTags: (result) =>
        result && result.length > 0
          ? [
              ...result.map((category) => ({
                type: 'CatalogCategory' as const,
                id: category.id,
              })),
              { type: 'CatalogCategory', id: 'LIST' },
            ]
          : [{ type: 'CatalogCategory', id: 'LIST' }],
    }),
    listAllCategoriesAdmin: build.query<Category[], void>({
      query: () => ({
        url: '/categories/all',
      }),
      transformResponse: (response: PaginatedResponse<Category> | Category[]) =>
        normalizeListResponse(response),
      providesTags: (result) =>
        result && result.length > 0
          ? [
              ...result.map((category) => ({
                type: 'CatalogCategory' as const,
                id: category.id,
              })),
              { type: 'CatalogCategory', id: 'LIST' },
            ]
          : [{ type: 'CatalogCategory', id: 'LIST' }],
    }),
    getBrands: build.query<Brand[], void>({
      query: () => ({
        url: '/brands',
      }),
      transformResponse: (response: PaginatedResponse<Brand> | Brand[]) =>
        normalizeListResponse(response),
      providesTags: (result) =>
        result && result.length > 0
          ? [
              ...result.map((brand) => ({
                type: 'CatalogBrand' as const,
                id: brand.id,
              })),
              { type: 'CatalogBrand', id: 'LIST' },
            ]
          : [{ type: 'CatalogBrand', id: 'LIST' }],
    }),
    listAllBrandsAdmin: build.query<Brand[], void>({
      query: () => ({
        url: '/brands/all',
      }),
      transformResponse: (response: PaginatedResponse<Brand> | Brand[]) =>
        normalizeListResponse(response),
      providesTags: [{ type: 'CatalogBrand', id: 'LIST' }],
    }),
    createBrandAdmin: build.mutation<Brand, BrandCreateInput>({
      query: (body) => ({
        url: '/brands',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'CatalogBrand', id: 'LIST' }],
    }),
    updateBrandAdmin: build.mutation<Brand, { brandId: string; body: BrandUpdateInput }>({
      query: ({ brandId, body }) => ({
        url: `/brands/${brandId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { brandId }) => [
        { type: 'CatalogBrand', id: brandId },
        { type: 'CatalogBrand', id: 'LIST' },
      ],
    }),
    createCategoryAdmin: build.mutation<Category, CategoryCreateInput>({
      query: (body) => ({
        url: '/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'CatalogCategory', id: 'LIST' }],
    }),
    updateCategoryAdmin: build.mutation<
      Category,
      { categoryId: string; body: CategoryUpdateInput }
    >({
      query: ({ categoryId, body }) => ({
        url: `/categories/${categoryId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { categoryId }) => [
        { type: 'CatalogCategory', id: categoryId },
        { type: 'CatalogCategory', id: 'LIST' },
      ],
    }),
    deleteCategoryAdmin: build.mutation<void, { categoryId: string }>({
      query: ({ categoryId }) => ({
        url: `/categories/${categoryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { categoryId }) => [
        { type: 'CatalogCategory', id: categoryId },
        { type: 'CatalogCategory', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useLazyGetCategoriesQuery,
  useListAllCategoriesAdminQuery,
  useLazyListAllCategoriesAdminQuery,
  useGetBrandsQuery,
  useLazyGetBrandsQuery,
  useListAllBrandsAdminQuery,
  useLazyListAllBrandsAdminQuery,
  useCreateBrandAdminMutation,
  useUpdateBrandAdminMutation,
  useCreateCategoryAdminMutation,
  useUpdateCategoryAdminMutation,
  useDeleteCategoryAdminMutation,
} = catalogApi;

// Temporary backwards-compatible aliases while the rest of the app migrates.
export const useListCategoriesQuery = useGetCategoriesQuery;
export const useLazyListCategoriesQuery = useLazyGetCategoriesQuery;
export const useListBrandsQuery = useGetBrandsQuery;
export const useLazyListBrandsQuery = useLazyGetBrandsQuery;
