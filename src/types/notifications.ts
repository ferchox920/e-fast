import { z } from 'zod';

export const notificationTypes = [
  'product_question',
  'product_answer',
  'order_status',
  'new_order',
  'promotion',
  'loyalty',
  'generic',
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export interface NotificationRead {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface NotificationUpdate {
  is_read: boolean;
}

export const ZNotificationType = z.enum(notificationTypes);

export const ZNotificationRead = z.object({
  id: z.string(),
  user_id: z.string(),
  type: z.union([ZNotificationType, z.string()]),
  title: z.string(),
  message: z.string(),
  payload: z.record(z.unknown()).nullable(),
  is_read: z.boolean(),
  created_at: z.string(),
  read_at: z.string().nullable(),
});

export const ZNotificationUpdate = z.object({
  is_read: z.boolean(),
});

export const ZWsPayload = ZNotificationRead.pick({
  id: true,
  user_id: true,
  type: true,
  title: true,
  message: true,
  payload: true,
  is_read: true,
  created_at: true,
  read_at: true,
});

export type NotificationWsPayload = z.infer<typeof ZWsPayload>;
