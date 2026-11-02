import type { PaymentRead } from './order';
import type { ISODateTime, UUID } from './common';
import type { OrderStatus, PaymentStatus, ShippingStatus } from './order';

export type Payment = PaymentRead;

export type CheckoutResult = 'success' | 'failure' | 'pending' | 'refunded' | 'unknown';

export interface CheckoutStatus {
  order_id: UUID | string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_status: ShippingStatus;
  currency: string;
  total_amount: number;
  paid_at?: ISODateTime | null;
  refunded_at?: ISODateTime | null;
  latest_payment?: PaymentRead | null;
  checkout_result: CheckoutResult;
  can_retry_payment: boolean;
}

export interface CreatePaymentForOrderArgs {
  orderId: string;
  idempotencyKey?: string;
}

export interface MercadoPagoWebhookPayload {
  [key: string]: unknown;
}

export interface WebhookAck {
  status: string;
}
