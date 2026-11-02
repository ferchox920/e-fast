import type { Metadata } from 'next';

import CheckoutPageClient from '@/components/checkout/CheckoutPageClient';

export const metadata: Metadata = {
  title: 'Checkout | MyApp',
  description: 'Resumen final de compra y pago con Mercado Pago.',
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}