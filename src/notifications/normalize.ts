import { z } from 'zod';

import type { NotificationRead, NotificationType } from '@/types/notifications';
import { ZNotificationRead } from '@/types/notifications';

export interface NotificationMeta {
  href?: string;
  badge?: string;
}

export type NotificationEntity = NotificationRead & { meta?: NotificationMeta };
export type NormalizedNotification = NotificationEntity | null;

const baseIdSchema = z
  .union([z.string(), z.number(), z.bigint()])
  .transform((value) => (typeof value === 'string' ? value : String(value)));

const productQuestionSchema = z.object({
  question_id: baseIdSchema,
  product_id: baseIdSchema,
});

const productAnswerSchema = z.object({
  question_id: baseIdSchema,
  answer_id: baseIdSchema,
  product_id: baseIdSchema,
});

const orderStatusSchema = z.object({
  order_id: baseIdSchema,
  status: z.string().optional(),
  payment_status: z.string().optional(),
  shipping_status: z.string().optional(),
});

const newOrderSchema = z.object({
  order_id: baseIdSchema,
});

const promotionSchema = z.object({
  promotion_id: baseIdSchema,
});

const loyaltySchema = z.object({
  level: z.string(),
  previous_level: z.string().nullable().optional(),
  points: z.number().nonnegative(),
});

const schemaByType: Record<NotificationType, z.ZodTypeAny> = {
  product_question: productQuestionSchema,
  product_answer: productAnswerSchema,
  order_status: orderStatusSchema,
  new_order: newOrderSchema,
  promotion: promotionSchema,
  loyalty: loyaltySchema,
  generic: z.record(z.unknown()).nullable().default(null),
};

export const normalizeNotification = (notification: NotificationRead): NormalizedNotification => {
  const validated = ZNotificationRead.safeParse(notification);
  if (!validated.success) {
    console.warn('normalizeNotification: received invalid notification shape');
    return null;
  }

  const { type } = notification;

  if (typeof type !== 'string') {
    console.warn('normalizeNotification: notification type missing or invalid');
    return null;
  }

  const schema = schemaByType[type as NotificationType];

  if (!schema) {
    // Unknown type; keep payload as-is
    return { ...notification };
  }

  const payloadResult = schema.safeParse(notification.payload ?? {});

  if (!payloadResult.success) {
    console.warn(`normalizeNotification: invalid payload for type "${type}"`);
    return null;
  }

  const normalizedPayload = payloadResult.data ?? null;

  const meta = buildMeta(type as NotificationType, normalizedPayload);

  return {
    ...notification,
    payload: normalizedPayload,
    ...(meta ? { meta } : null),
  } as NotificationEntity;
};

const buildMeta = (type: NotificationType, payload: unknown): NotificationMeta | undefined => {
  switch (type) {
    case 'product_question': {
      const data = payload as z.infer<typeof productQuestionSchema>;
      return {
        href: `/products/${data.product_id}?question=${data.question_id}`,
        badge: 'Q&A',
      };
    }
    case 'product_answer': {
      const data = payload as z.infer<typeof productAnswerSchema>;
      return {
        href: `/products/${data.product_id}?answer=${data.answer_id}`,
        badge: 'Q&A',
      };
    }
    case 'order_status': {
      const data = payload as z.infer<typeof orderStatusSchema>;
      return {
        href: `/orders/${data.order_id}`,
        badge: data.status ?? data.payment_status ?? data.shipping_status,
      };
    }
    case 'new_order': {
      const data = payload as z.infer<typeof newOrderSchema>;
      return {
        href: `/orders/${data.order_id}`,
        badge: 'Nuevo pedido',
      };
    }
    case 'promotion': {
      const data = payload as z.infer<typeof promotionSchema>;
      return {
        href: `/promotions/${data.promotion_id}`,
        badge: 'Promocion',
      };
    }
    case 'loyalty': {
      const data = payload as z.infer<typeof loyaltySchema>;
      return {
        href: `/loyalty`,
        badge: `Nivel ${data.level}`,
      };
    }
    case 'generic':
    default:
      return undefined;
  }
};
