import type { ISODateTime } from './common';

export interface LoyaltyProfileRead {
  user_id: string;
  level: string;
  points: number;
  progress_json: Record<string, unknown>;
  updated_at: ISODateTime;
}

export interface LoyaltyAdjustPayload {
  user_id: string;
  points_delta: number;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface LoyaltyRedeemPayload {
  user_id?: string | null;
  points: number;
  reward_code?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface LoyaltyLevelRead {
  level: string;
  min_points: number;
  perks_json?: Record<string, unknown> | null;
}
