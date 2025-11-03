import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

interface WishesState {
  items: string[];
}

const initialState: WishesState = {
  items: [],
};

const wishesSlice = createSlice({
  name: 'wishes',
  initialState,
  reducers: {
    addWish(state, action: PayloadAction<string>) {
      const id = action.payload.trim();
      if (!id) return;
      if (!state.items.includes(id)) {
        state.items.push(id);
      }
    },
    removeWish(state, action: PayloadAction<string>) {
      const id = action.payload.trim();
      if (!id) return;
      state.items = state.items.filter((itemId) => itemId !== id);
    },
    toggleWish(state, action: PayloadAction<string>) {
      const id = action.payload.trim();
      if (!id) return;
      if (state.items.includes(id)) {
        state.items = state.items.filter((itemId) => itemId !== id);
      } else {
        state.items.push(id);
      }
    },
    clearAll(state) {
      state.items = [];
    },
  },
});

export const { addWish, removeWish, toggleWish, clearAll } = wishesSlice.actions;
export default wishesSlice.reducer;

export const selectWishIds = (state: RootState) => state.wishes.items;
export const selectIsWished = (state: RootState, productId: string) =>
  state.wishes.items.includes(productId);
