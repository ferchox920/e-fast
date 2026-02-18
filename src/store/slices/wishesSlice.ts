import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import { wishesApi } from '@/store/api/wishesApi';
import type { WishRead, WishWithNotifications } from '@/types/wish';

interface WishesState {
  items: string[];
  wishIdByProductId: Record<string, string>;
}

const initialState: WishesState = {
  items: [],
  wishIdByProductId: {},
};

const addProductWish = (state: WishesState, productIdValue: string, wishId?: string | null) => {
  const productId = productIdValue.trim();
  if (!productId) return;

  if (!state.items.includes(productId)) {
    state.items.push(productId);
  }
  if (wishId) {
    state.wishIdByProductId[productId] = wishId;
  }
};

const removeProductWish = (state: WishesState, productIdValue: string) => {
  const productId = productIdValue.trim();
  if (!productId) return;
  state.items = state.items.filter((itemId) => itemId !== productId);
  delete state.wishIdByProductId[productId];
};

const syncWishRecord = (state: WishesState, wish: WishRead | WishWithNotifications) => {
  addProductWish(state, String(wish.product_id), String(wish.id));
};

const wishesSlice = createSlice({
  name: 'wishes',
  initialState,
  reducers: {
    addWish(state, action: PayloadAction<string>) {
      addProductWish(state, action.payload);
    },
    removeWish(state, action: PayloadAction<string>) {
      removeProductWish(state, action.payload);
    },
    toggleWish(state, action: PayloadAction<string>) {
      const id = action.payload.trim();
      if (!id) return;
      if (state.items.includes(id)) {
        removeProductWish(state, id);
      } else {
        addProductWish(state, id);
      }
    },
    clearAll(state) {
      state.items = [];
      state.wishIdByProductId = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(wishesApi.endpoints.listWishes.matchFulfilled, (state, action) => {
        state.items = [];
        state.wishIdByProductId = {};
        action.payload.forEach((wish) => {
          syncWishRecord(state, wish);
        });
      })
      .addMatcher(wishesApi.endpoints.createWish.matchFulfilled, (state, action) => {
        syncWishRecord(state, action.payload);
      })
      .addMatcher(wishesApi.endpoints.deleteWish.matchFulfilled, (state, action) => {
        const { wishId, productId } = action.meta.arg.originalArgs;
        if (productId) {
          removeProductWish(state, productId);
          return;
        }
        const targetProductId =
          Object.entries(state.wishIdByProductId).find(
            ([, storedWishId]) => storedWishId === wishId,
          )?.[0] ?? null;
        if (targetProductId) {
          removeProductWish(state, targetProductId);
        }
      });
  },
});

export const { addWish, removeWish, toggleWish, clearAll } = wishesSlice.actions;
export default wishesSlice.reducer;

export const selectWishIds = (state: RootState) => state.wishes.items;
export const selectWishIdByProductId = (state: RootState) => state.wishes.wishIdByProductId;
export const selectIsWished = (state: RootState, productId: string) =>
  state.wishes.items.includes(productId);
