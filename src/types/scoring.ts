import type { ISODateTime, UUID } from './common';

export interface ScoringRankingItem {
  product_id: UUID | string;
  popularity_score: number;
  cold_score: number;
  profit_score: number;
  exposure_score: number;
  computed_at: ISODateTime;
}

export interface ScoringRunResult {
  [key: string]: unknown;
}

export interface ScoringRankingsParams {
  limit?: number;
}
