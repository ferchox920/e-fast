import type { Metadata } from 'next';

import WishlistPageClient from '@/components/account/WishlistPageClient';

export const metadata: Metadata = {
  title: 'Lista de deseos | MyApp',
  description: 'Consulta y gestiona tus productos favoritos guardados.',
};

export default function WishlistPage() {
  return <WishlistPageClient />;
}
