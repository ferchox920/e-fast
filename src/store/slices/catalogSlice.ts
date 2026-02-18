import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';
import { catalogApi } from '@/store/api/catalogApi';
import type { Brand, Category } from '@/types/catalog';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface CatalogState {
  categories: Category[];
  adminCategories: Category[];
  brands: Brand[];
  adminBrands: Brand[];
  selectedCategoryId: string | null;
  selectedBrandId: string | null;
  categoriesStatus: RequestStatus;
  brandsStatus: RequestStatus;
  adminCategoriesStatus: RequestStatus;
  adminBrandsStatus: RequestStatus;
  error: string | null;
}

const initialState: CatalogState = {
  categories: [],
  adminCategories: [],
  brands: [],
  adminBrands: [],
  selectedCategoryId: null,
  selectedBrandId: null,
  categoriesStatus: 'idle',
  brandsStatus: 'idle',
  adminCategoriesStatus: 'idle',
  adminBrandsStatus: 'idle',
  error: null,
};

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

const ensureUniqueById = <T extends { id: string | number }>(items: T[]): T[] => {
  const map = new Map<string, T>();
  items.forEach((item) => {
    map.set(String(item.id), item);
  });
  return Array.from(map.values());
};

const setError = (state: CatalogState, action: { error?: { message?: string } }) => {
  state.error = action.error?.message ?? 'No se pudo cargar el catalogo.';
};

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setSelectedCategory(state, action: PayloadAction<string | null>) {
      state.selectedCategoryId = action.payload ? String(action.payload) : null;
    },
    setSelectedBrand(state, action: PayloadAction<string | null>) {
      state.selectedBrandId = action.payload ? String(action.payload) : null;
    },
    clearCatalogFilters(state) {
      state.selectedCategoryId = null;
      state.selectedBrandId = null;
    },
    clearCatalogState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(catalogApi.endpoints.getCategories.matchPending, (state) => {
        state.categoriesStatus = 'loading';
        state.error = null;
      })
      .addMatcher(catalogApi.endpoints.getCategories.matchFulfilled, (state, action) => {
        state.categories = [...action.payload].sort(byName);
        state.categoriesStatus = 'succeeded';
      })
      .addMatcher(catalogApi.endpoints.getCategories.matchRejected, (state, action) => {
        state.categoriesStatus = 'failed';
        setError(state, action);
      })
      .addMatcher(catalogApi.endpoints.listAllCategoriesAdmin.matchPending, (state) => {
        state.adminCategoriesStatus = 'loading';
        state.error = null;
      })
      .addMatcher(catalogApi.endpoints.listAllCategoriesAdmin.matchFulfilled, (state, action) => {
        state.adminCategories = [...action.payload].sort(byName);
        state.adminCategoriesStatus = 'succeeded';
      })
      .addMatcher(catalogApi.endpoints.listAllCategoriesAdmin.matchRejected, (state, action) => {
        state.adminCategoriesStatus = 'failed';
        setError(state, action);
      })
      .addMatcher(catalogApi.endpoints.getBrands.matchPending, (state) => {
        state.brandsStatus = 'loading';
        state.error = null;
      })
      .addMatcher(catalogApi.endpoints.getBrands.matchFulfilled, (state, action) => {
        state.brands = [...action.payload].sort(byName);
        state.brandsStatus = 'succeeded';
      })
      .addMatcher(catalogApi.endpoints.getBrands.matchRejected, (state, action) => {
        state.brandsStatus = 'failed';
        setError(state, action);
      })
      .addMatcher(catalogApi.endpoints.listAllBrandsAdmin.matchPending, (state) => {
        state.adminBrandsStatus = 'loading';
        state.error = null;
      })
      .addMatcher(catalogApi.endpoints.listAllBrandsAdmin.matchFulfilled, (state, action) => {
        state.adminBrands = [...action.payload].sort(byName);
        state.adminBrandsStatus = 'succeeded';
      })
      .addMatcher(catalogApi.endpoints.listAllBrandsAdmin.matchRejected, (state, action) => {
        state.adminBrandsStatus = 'failed';
        setError(state, action);
      })
      .addMatcher(catalogApi.endpoints.createCategoryAdmin.matchFulfilled, (state, action) => {
        state.adminCategories = ensureUniqueById([...state.adminCategories, action.payload]).sort(
          byName,
        );
      })
      .addMatcher(catalogApi.endpoints.updateCategoryAdmin.matchFulfilled, (state, action) => {
        state.adminCategories = ensureUniqueById(
          state.adminCategories.map((item) =>
            String(item.id) === String(action.payload.id) ? action.payload : item,
          ),
        ).sort(byName);
      })
      .addMatcher(catalogApi.endpoints.deleteCategoryAdmin.matchFulfilled, (state, action) => {
        const deletedId = action.meta.arg.originalArgs.categoryId;
        state.adminCategories = state.adminCategories.filter(
          (item) => String(item.id) !== String(deletedId),
        );
      })
      .addMatcher(catalogApi.endpoints.createBrandAdmin.matchFulfilled, (state, action) => {
        state.adminBrands = ensureUniqueById([...state.adminBrands, action.payload]).sort(byName);
      })
      .addMatcher(catalogApi.endpoints.updateBrandAdmin.matchFulfilled, (state, action) => {
        state.adminBrands = ensureUniqueById(
          state.adminBrands.map((item) =>
            String(item.id) === String(action.payload.id) ? action.payload : item,
          ),
        ).sort(byName);
      });
  },
});

export const { setSelectedCategory, setSelectedBrand, clearCatalogFilters, clearCatalogState } =
  catalogSlice.actions;
export default catalogSlice.reducer;

const selectCatalogState = (state: RootState) => state.catalog;

export const selectCatalogCategories = createSelector(
  selectCatalogState,
  (state) => state.categories,
);
export const selectCatalogAdminCategories = createSelector(
  selectCatalogState,
  (state) => state.adminCategories,
);
export const selectCatalogBrands = createSelector(selectCatalogState, (state) => state.brands);
export const selectCatalogAdminBrands = createSelector(
  selectCatalogState,
  (state) => state.adminBrands,
);
export const selectCatalogFilters = createSelector(selectCatalogState, (state) => ({
  categoryId: state.selectedCategoryId,
  brandId: state.selectedBrandId,
}));
export const selectCatalogStatus = createSelector(selectCatalogState, (state) => ({
  categories: state.categoriesStatus,
  brands: state.brandsStatus,
  adminCategories: state.adminCategoriesStatus,
  adminBrands: state.adminBrandsStatus,
  error: state.error,
}));
