import AdminProductsPage from '@/components/admin/products/AdminProductsPage';
import { redirect } from 'next/navigation';

interface AdminProductsRouteProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminProductsRoute({ searchParams }: AdminProductsRouteProps) {
  const params = searchParams ? await searchParams : {};
  const tab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  if (tab === 'questions') {
    redirect('/admin/questions');
  }
  return <AdminProductsPage />;
}
