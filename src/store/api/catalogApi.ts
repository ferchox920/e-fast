import { baseApi } from './baseApi';
import type { BrandListResponse, CategoryRead } from '@/types/catalog';

interface ListBrandsParams {
  page?: number;
  page_size?: number;
}

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCategories: build.query<CategoryRead[], void>({
      query: () => ({
        url: '/categories',
      }),
      providesTags: [{ type: 'CatalogCategory', id: 'LIST' }],
    }),
    listBrands: build.query<BrandListResponse, ListBrandsParams | void>({
      query: (params) => ({
        url: '/brands',
        params: {
          page: params?.page ?? 1,
          page_size: params?.page_size ?? 50,
        },
      }),
      providesTags: (result) => [
        ...(result?.items ?? []).map((brand) => ({
          type: 'CatalogBrand' as const,
          id: brand.id,
        })),
        { type: 'CatalogBrand', id: 'LIST' },
      ],
    }),
  }),
});

export const { useListCategoriesQuery, useListBrandsQuery } = catalogApi;
