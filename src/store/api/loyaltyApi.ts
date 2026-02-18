import { baseApi } from './baseApi';
import type {
  LoyaltyAdjustPayload,
  LoyaltyLevelRead,
  LoyaltyProfileRead,
  LoyaltyRedeemPayload,
} from '@/types/loyalty';

export const loyaltyApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLoyaltyProfile: build.query<LoyaltyProfileRead, { user_id?: string } | void>({
      query: (params) => ({
        url: '/loyalty/profile',
        params: params ?? undefined,
      }),
      providesTags: (result) => [
        { type: 'Loyalty', id: result?.user_id ?? 'PROFILE' },
      ],
    }),
    adjustLoyaltyProfile: build.mutation<LoyaltyProfileRead, LoyaltyAdjustPayload>({
      query: (body) => ({
        url: '/loyalty/adjust',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) => [
        { type: 'Loyalty', id: result?.user_id ?? 'PROFILE' },
        { type: 'Loyalty', id: 'LEVELS' },
      ],
    }),
    redeemLoyaltyReward: build.mutation<LoyaltyProfileRead, LoyaltyRedeemPayload>({
      query: (body) => ({
        url: '/loyalty/redeem',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) => [
        { type: 'Loyalty', id: result?.user_id ?? 'PROFILE' },
        { type: 'Loyalty', id: 'LEVELS' },
      ],
    }),
    listLoyaltyLevels: build.query<LoyaltyLevelRead[], void>({
      query: () => ({ url: '/loyalty/levels' }),
      providesTags: [{ type: 'Loyalty', id: 'LEVELS' }],
    }),
  }),
});

export const {
  useGetLoyaltyProfileQuery,
  useLazyGetLoyaltyProfileQuery,
  useAdjustLoyaltyProfileMutation,
  useRedeemLoyaltyRewardMutation,
  useListLoyaltyLevelsQuery,
  useLazyListLoyaltyLevelsQuery,
} = loyaltyApi;
