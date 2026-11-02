import type { Metadata } from 'next';

import LoyaltyPageClient from '@/components/account/LoyaltyPageClient';

export const metadata: Metadata = {
  title: 'Lealtad | MyApp',
  description: 'Consulta tu perfil de puntos y niveles del programa de lealtad.',
};

export default function LoyaltyPage() {
  return <LoyaltyPageClient />;
}
