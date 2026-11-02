import type { Metadata } from 'next';
import RegisterPageClient from '@/components/login/RegisterPageClient';

export const metadata: Metadata = {
  title: 'Registro | MyApp',
  description: 'Crea tu cuenta MyApp para gestionar pedidos, favoritos y notificaciones.',
};

export default function Page() {
  return <RegisterPageClient />;
}
