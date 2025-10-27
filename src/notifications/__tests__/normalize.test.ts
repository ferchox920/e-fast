import { normalizeNotification } from '../normalize';
import type { NotificationRead } from '@/types/notifications';

const baseNotification = {
  id: 'notif-1',
  user_id: 'user-1',
  title: 'Titulo',
  message: 'Mensaje',
  is_read: false,
  created_at: '2025-01-01T10:00:00Z',
  read_at: null,
} satisfies Omit<NotificationRead, 'type' | 'payload'>;

const build = (override: Partial<NotificationRead>): NotificationRead => ({
  ...baseNotification,
  type: 'generic',
  payload: null,
  ...override,
});

describe('normalizeNotification', () => {
  it('normalizes product question notifications', () => {
    const result = normalizeNotification(
      build({
        id: 'notif-question',
        type: 'product_question',
        payload: { question_id: 123, product_id: 456 },
      }),
    );

    expect(result).not.toBeNull();
    expect(result?.payload).toEqual({ question_id: '123', product_id: '456' });
    expect(result?.meta?.href).toBe('/products/456?question=123');
    expect(result?.meta?.badge).toBe('Q&A');
  });

  it('normalizes product answer notifications', () => {
    const result = normalizeNotification(
      build({
        id: 'notif-answer',
        type: 'product_answer',
        payload: { question_id: 'Q1', answer_id: 'A1', product_id: 'P1' },
      }),
    );

    expect(result?.meta?.href).toBe('/products/P1?answer=A1');
    expect(result?.meta?.badge).toBe('Q&A');
  });

  it('normalizes order status notifications', () => {
    const result = normalizeNotification(
      build({
        id: 'notif-order',
        type: 'order_status',
        payload: { order_id: 'ORD-1', status: 'shipped' },
      }),
    );

    expect(result?.meta?.href).toBe('/orders/ORD-1');
    expect(result?.meta?.badge).toBe('shipped');
  });

  it('normalizes new order notifications', () => {
    const result = normalizeNotification(
      build({
        id: 'notif-new-order',
        type: 'new_order',
        payload: { order_id: 'ORD-2' },
      }),
    );

    expect(result?.meta?.href).toBe('/orders/ORD-2');
    expect(result?.meta?.badge).toBe('Nuevo pedido');
  });

  it('normalizes promotion notifications', () => {
    const result = normalizeNotification(
      build({
        id: 'notif-promo',
        type: 'promotion',
        payload: { promotion_id: 'PROMO-1' },
      }),
    );

    expect(result?.meta?.href).toBe('/promotions/PROMO-1');
    expect(result?.meta?.badge).toBe('Promocion');
  });

  it('normalizes loyalty notifications', () => {
    const result = normalizeNotification(
      build({
        id: 'notif-loyalty',
        type: 'loyalty',
        payload: { level: 'Gold', previous_level: 'Silver', points: 1200 },
      }),
    );

    expect(result?.meta?.href).toBe('/loyalty');
    expect(result?.meta?.badge).toBe('Nivel Gold');
  });

  it('passes through generic notifications without meta', () => {
    const result = normalizeNotification(
      build({
        id: 'notif-generic',
        type: 'generic',
        payload: { anything: 'goes' },
      }),
    );

    expect(result?.meta).toBeUndefined();
    expect(result?.payload).toEqual({ anything: 'goes' });
  });

  it('allows unknown notification types to pass through unchanged', () => {
    const custom = build({
      type: 'custom_type',
      payload: { foo: 'bar' },
    });

    const result = normalizeNotification(custom);
    expect(result).toEqual(custom);
  });

  it('returns null when payload validation fails', () => {
    const result = normalizeNotification(
      build({
        type: 'product_question',
        payload: { product_id: 'missing-question-id' },
      }),
    );

    expect(result).toBeNull();
  });

  it('returns null when notification shape is invalid', () => {
    const invalid = {
      ...baseNotification,
      type: null,
      payload: null,
    };

    const result = normalizeNotification(invalid as unknown as NotificationRead);
    expect(result).toBeNull();
  });
});
