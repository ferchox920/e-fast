import { baseApi } from './baseApi';
import type {
  ScoringRankingItem,
  ScoringRankingsParams,
  ScoringRunResult,
} from '@/types/scoring';

export const scoringApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    runScoring: build.mutation<ScoringRunResult, void>({
      query: () => ({
        url: '/internal/scoring/run',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Scoring', id: 'RANKINGS' }],
    }),
    getScoringRankings: build.query<ScoringRankingItem[], ScoringRankingsParams | void>({
      query: (params) => ({
        url: '/internal/scoring/rankings',
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result && result.length > 0
          ? [
              ...result.map((item) => ({ type: 'Scoring' as const, id: item.product_id })),
              { type: 'Scoring', id: 'RANKINGS' },
            ]
          : [{ type: 'Scoring', id: 'RANKINGS' }],
    }),
  }),
});

export const {
  useRunScoringMutation,
  useGetScoringRankingsQuery,
  useLazyGetScoringRankingsQuery,
} = scoringApi;
