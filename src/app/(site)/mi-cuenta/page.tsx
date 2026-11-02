import type { Metadata } from 'next';

import MyAccountPageClient from '@/components/account/MyAccountPageClient';

export const metadata: Metadata = {
  title: 'Mi cuenta | MyApp',
  description: 'Gestiona tu perfil, pedidos, lealtad y notificaciones en MyApp.',
};

export default function MiCuentaPage() {
  return <MyAccountPageClient />;
}
