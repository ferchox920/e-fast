import type { Metadata } from 'next';

import CartPageClient from '@/components/cart/CartPageClient';

export const metadata: Metadata = {
  title: 'Carrito | MyApp',
  description: 'Revisa tu carrito y avanza al checkout.',
};

export default function CartPage() {
  return <CartPageClient />;
}
