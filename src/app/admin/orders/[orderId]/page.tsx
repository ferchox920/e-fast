import AdminOrderDetailPage from '@/components/admin/orders/AdminOrderDetailPage';

interface AdminOrderDetailRouteProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function AdminOrderDetailRoute({ params }: AdminOrderDetailRouteProps) {
  const { orderId } = await params;
  return <AdminOrderDetailPage orderId={orderId} />;
}
