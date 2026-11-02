import type { Metadata } from 'next';

import OrdersPageClient from '@/components/account/OrdersPageClient';

export const metadata: Metadata = {
  title: 'Mis pedidos | MyApp',
  description: 'Consulta el historial y detalle de tus pedidos.',
};

export default function OrdersPage() {
  return <OrdersPageClient />;
}
