import type { Metadata } from 'next';
import LoginPageClient from '@/components/login/LoginPageClient';

export const metadata: Metadata = {
  title: 'Ingresar | MyApp',
  description: 'Accede a tu cuenta MyApp para gestionar pedidos, favoritos y notificaciones.',
};

export default function Page() {
  return <LoginPageClient />;
}
