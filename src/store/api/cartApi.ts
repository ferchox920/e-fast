import { baseApi } from './baseApi';
import type {
  CartCreatePayload,
  CartItemCreatePayload,
  CartItemRemovePayload,
  CartItemUpdatePayload,
  CartRead,
} from '@/types/cart';
import { getOrCreateGuestToken } from '@/lib/guestToken';

const resolveGuestToken = (explicit?: string | null) => {
  if (explicit) return explicit;
  if (typeof window === 'undefined') return undefined;
  return getOrCreateGuestToken() ?? undefined;
};

export const cartApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createOrGetCart: build.mutation<CartRead, CartCreatePayload | void>({
      query: (args) => {
        const guestToken = resolveGuestToken(args?.guestToken ?? null);
        return {
          url: '/cart',
          method: 'POST',
          body: {
            guest_token: guestToken ?? null,
            currency: args?.currency ?? 'ARS',
          },
        };
      },
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),

    getCart: build.query<CartRead, Pick<CartCreatePayload, 'guestToken'> | void>({
      query: (args) => {
        const guestToken = resolveGuestToken(args?.guestToken ?? null);
        return {
          url: '/cart',
          params: guestToken ? { guest_token: guestToken } : undefined,
        };
      },
      providesTags: (result) =>
        result ? [{ type: 'Cart', id: 'CURRENT' }] : [{ type: 'Cart', id: 'MISSING' }],
    }),

    addCartItem: build.mutation<CartRead, CartItemCreatePayload>({
      query: ({ variantId, quantity, guestToken }) => {
        const token = resolveGuestToken(guestToken ?? null);
        return {
          url: '/cart/items',
          method: 'POST',
          params: token ? { guest_token: token } : undefined,
          body: {
            variant_id: variantId,
            quantity,
          },
        };
      },
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),

    updateCartItem: build.mutation<CartRead, CartItemUpdatePayload>({
      query: ({ itemId, quantity, guestToken }) => {
        const token = resolveGuestToken(guestToken ?? null);
        return {
          url: `/cart/items/${itemId}`,
          method: 'PUT',
          params: token ? { guest_token: token } : undefined,
          body: {
            quantity,
          },
        };
      },
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),

    removeCartItem: build.mutation<CartRead, CartItemRemovePayload>({
      query: ({ itemId, guestToken }) => {
        const token = resolveGuestToken(guestToken ?? null);
        return {
          url: `/cart/items/${itemId}`,
          method: 'DELETE',
          params: token ? { guest_token: token } : undefined,
        };
      },
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
  }),
});

export const {
  useCreateOrGetCartMutation,
  useGetCartQuery,
  useLazyGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} = cartApi;
