import type { Metadata } from 'next';
import LoginPageClient from '@/components/login/LoginPageClient';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Ingresar | MyApp',
  description: 'Accede a tu cuenta MyApp para gestionar pedidos, favoritos y notificaciones.',
};

export default function Page() {
  return (
    <Suspense fallback={<p role="status">Cargando ingreso…</p>}>
      <LoginPageClient />
    </Suspense>
  );
}
