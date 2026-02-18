import type { ISODateTime, UUID } from './common';

export interface ExposureItem {
  product_id: UUID | string;
  reason: string[];
  badges: string[];
}

export interface ExposureResponse {
  context: string;
  user_id?: string | null;
  category_id?: UUID | string | null;
  generated_at: ISODateTime;
  expires_at: ISODateTime;
  mix: ExposureItem[];
}

export interface GetExposureParams {
  context: string;
  user_id?: string;
  category_id?: string;
  limit?: number;
}

export interface ClearExposureCacheResponse {
  status: string;
}
