import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';
import { cartApi } from '@/store/api/cartApi';
import type { CartRead } from '@/types/cart';

type CartRequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface CartState {
  current: CartRead | null;
  status: CartRequestStatus;
  error: string | null;
}

const initialState: CartState = {
  current: null,
  status: 'idle',
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<CartRead | null>) {
      state.current = action.payload;
      state.status = action.payload ? 'succeeded' : 'idle';
      state.error = null;
    },
    clearCartState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(cartApi.endpoints.getCart.matchPending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addMatcher(cartApi.endpoints.getCart.matchFulfilled, (state, action) => {
        state.current = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addMatcher(cartApi.endpoints.getCart.matchRejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message ?? 'Could not load cart.';
      })
      .addMatcher(cartApi.endpoints.createOrGetCart.matchPending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addMatcher(cartApi.endpoints.createOrGetCart.matchFulfilled, (state, action) => {
        state.current = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addMatcher(cartApi.endpoints.createOrGetCart.matchRejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message ?? 'Could not initialize cart.';
      })
      .addMatcher(cartApi.endpoints.addCartItem.matchFulfilled, (state, action) => {
        state.current = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addMatcher(cartApi.endpoints.addCartItem.matchRejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message ?? 'Could not add item to cart.';
      })
      .addMatcher(cartApi.endpoints.updateCartItem.matchFulfilled, (state, action) => {
        state.current = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addMatcher(cartApi.endpoints.updateCartItem.matchRejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message ?? 'Could not update cart item.';
      })
      .addMatcher(cartApi.endpoints.removeCartItem.matchFulfilled, (state, action) => {
        state.current = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addMatcher(cartApi.endpoints.removeCartItem.matchRejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message ?? 'Could not remove cart item.';
      });
  },
});

export const { setCart, clearCartState } = cartSlice.actions;
export default cartSlice.reducer;

const selectCartState = (state: RootState) => state.cart;

export const selectCart = createSelector(selectCartState, (state) => state.current);
export const selectCartStatus = createSelector(selectCartState, (state) => state.status);
export const selectCartError = createSelector(selectCartState, (state) => state.error);
export const selectCartItems = createSelector(
  selectCart,
  (cart) => cart?.items ?? [],
);
export const selectCartItemsCount = createSelector(selectCartItems, (items) =>
  items.reduce((acc, item) => acc + (item.quantity ?? 0), 0),
);
export const selectCartSubtotal = createSelector(
  selectCart,
  (cart) => cart?.subtotal_amount ?? 0,
);
export const selectCartTotal = createSelector(
  selectCart,
  (cart) => cart?.total_amount ?? 0,
);
