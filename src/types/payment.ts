import type { PaymentRead } from './order';

export type Payment = PaymentRead;

export interface CreatePaymentForOrderArgs {
  orderId: string;
}

export interface MercadoPagoWebhookPayload {
  [key: string]: unknown;
}

export interface WebhookAck {
  status: string;
}
