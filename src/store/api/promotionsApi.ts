import { baseApi } from './baseApi';
import type {
  PromotionEligibilityParams,
  PromotionEligibilityResponse,
  PromotionRead,
} from '@/types/promotion';

export const promotionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listActivePromotions: build.query<PromotionRead[], void>({
      query: () => ({ url: '/promotions/active' }),
      providesTags: (result) =>
        result && result.length > 0
          ? [
              ...result.map((promotion) => ({ type: 'Promotion' as const, id: promotion.id })),
              { type: 'Promotion', id: 'ACTIVE' },
            ]
          : [{ type: 'Promotion', id: 'ACTIVE' }],
    }),
    getPromotionById: build.query<PromotionRead, { promotionId: string }>({
      query: ({ promotionId }) => ({ url: `/promotions/${promotionId}` }),
      providesTags: (result, _error, { promotionId }) => [
        { type: 'Promotion', id: result?.id ?? promotionId },
      ],
    }),
    checkPromotionEligibility: build.query<
      PromotionEligibilityResponse,
      { promotionId: string; params?: PromotionEligibilityParams }
    >({
      query: ({ promotionId, params }) => ({
        url: `/promotions/${promotionId}/eligibility`,
        params,
      }),
      providesTags: (result, _error, { promotionId }) => [
        { type: 'Promotion', id: result?.promotion_id ?? promotionId },
      ],
    }),
  }),
});

export const {
  useListActivePromotionsQuery,
  useLazyListActivePromotionsQuery,
  useGetPromotionByIdQuery,
  useLazyGetPromotionByIdQuery,
  useCheckPromotionEligibilityQuery,
  useLazyCheckPromotionEligibilityQuery,
} = promotionsApi;
