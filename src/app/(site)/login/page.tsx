import type { Metadata } from 'next';
import { Fraunces, Sora } from 'next/font/google';
import LoginPageClient from '@/components/login/LoginPageClient';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
});

export const metadata: Metadata = {
  title: 'Mi cuenta | MyApp',
  description:
    'Accede a tu cuenta MyApp para revisar pedidos, favoritos y novedades de forma segura.',
};

export default function Page() {
  return (
    <div className={`${sora.variable} ${fraunces.variable}`}>
      <LoginPageClient />
    </div>
  );
}
