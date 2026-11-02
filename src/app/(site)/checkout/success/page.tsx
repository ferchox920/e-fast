import type { Metadata } from 'next';

import CheckoutSuccessPageClient from '@/components/checkout/CheckoutSuccessPageClient';

export const metadata: Metadata = {
  title: 'Estado del pago | MyApp',
  description: 'Resultado de pago de Mercado Pago para tu orden.',
};

export default function CheckoutSuccessPage() {
  return <CheckoutSuccessPageClient />;
}