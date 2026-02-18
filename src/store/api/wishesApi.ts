import { baseApi } from './baseApi';
import type {
  DeleteWishResponse,
  WishCreateInput,
  WishRead,
  WishWithNotifications,
} from '@/types/wish';

export const wishesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listWishes: build.query<WishWithNotifications[], void>({
      query: () => ({ url: '/wishes' }),
      providesTags: (result) =>
        result && result.length > 0
          ? [
              ...result.map((wish) => ({ type: 'Wish' as const, id: wish.id })),
              ...result.map((wish) => ({
                type: 'Wish' as const,
                id: `PRODUCT:${String(wish.product_id)}`,
              })),
              { type: 'Wish', id: 'LIST' },
            ]
          : [{ type: 'Wish', id: 'LIST' }],
    }),
    createWish: build.mutation<WishRead, WishCreateInput>({
      query: (body) => ({
        url: '/wishes',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) => [
        { type: 'Wish', id: 'LIST' },
        { type: 'Wish', id: result?.id ?? 'NEW' },
        ...(result
          ? [{ type: 'Wish' as const, id: `PRODUCT:${String(result.product_id)}` }]
          : []),
      ],
    }),
    deleteWish: build.mutation<
      DeleteWishResponse,
      { wishId: string; productId?: string | null }
    >({
      query: ({ wishId }) => ({
        url: `/wishes/${wishId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, _error, { wishId, productId }) => [
        { type: 'Wish', id: 'LIST' },
        { type: 'Wish', id: wishId },
        ...(productId ? [{ type: 'Wish' as const, id: `PRODUCT:${productId}` }] : []),
      ],
    }),
  }),
});

export const {
  useListWishesQuery,
  useLazyListWishesQuery,
  useCreateWishMutation,
  useDeleteWishMutation,
} = wishesApi;
