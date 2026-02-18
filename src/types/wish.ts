import type { ISODateTime, UUID } from './common';

export interface WishNotificationRead {
  id: UUID | string;
  notification_type: string;
  message: string;
  created_at: ISODateTime;
}

export interface WishRead {
  id: UUID | string;
  product_id: UUID | string;
  desired_price?: number | string | null;
  notify_discount: boolean;
  status: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface WishWithNotifications extends WishRead {
  notifications: WishNotificationRead[];
}

export interface WishCreateInput {
  product_id: UUID | string;
  desired_price?: number | string | null;
  notify_discount?: boolean;
}

export interface DeleteWishResponse {
  detail: string;
}
