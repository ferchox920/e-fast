import type { PaymentRead } from './order';
import type { ISODateTime } from './common';

export type Payment = PaymentRead;

export interface CreatePaymentForOrderArgs {
  orderId: string;
  idempotencyKey: string;
}

export interface PaymentRefundInput {
  amount?: number | null;
  reason?: string | null;
  restock_items?: boolean | null;
}

export interface PaymentRefundArgs {
  paymentId: string;
  idempotencyKey: string;
  body: PaymentRefundInput;
}

export interface PaymentAuditRead {
  payment: Payment;
  refunds: Array<{
    id: string;
    amount: number;
    reason: string | null;
    provider_refund_id: string | null;
    status_detail: string | null;
    created_at: ISODateTime;
  }>;
  webhook_events: Array<{
    id: string;
    event_id: string;
    request_id: string | null;
    event_type: string | null;
    outcome: string | null;
    processed_at: ISODateTime;
  }>;
}
