import AdminProductEditPage from '@/components/admin/products/AdminProductEditPage';

interface EditPageProps {
  params: {
    slug: string;
  };
}

export default function AdminProductEditRoute({ params }: EditPageProps) {
  return <AdminProductEditPage slug={params.slug} />;
}
