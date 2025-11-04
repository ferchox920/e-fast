import { baseApi } from './baseApi';
import type { Brand, Category } from '@/types/catalog';

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<Category[], void>({
      query: () => ({
        url: '/categories',
      }),
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
  }),
});

export const {
  useGetCategoriesQuery,
  useLazyGetCategoriesQuery,
  useGetBrandsQuery,
  useLazyGetBrandsQuery,
} = catalogApi;

// Temporary backwards-compatible aliases while the rest of the app migrates.
export const useListCategoriesQuery = useGetCategoriesQuery;
export const useLazyListCategoriesQuery = useLazyGetCategoriesQuery;
export const useListBrandsQuery = useGetBrandsQuery;
export const useLazyListBrandsQuery = useLazyGetBrandsQuery;
