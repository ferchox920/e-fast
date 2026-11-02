import PromotionDetailClient from '@/components/promotion/PromotionDetailClient';

export default async function PromotionDetailPage({
  params,
}: {
  params: Promise<{ promotionId: string }>;
}) {
  const { promotionId } = await params;
  return <PromotionDetailClient promotionId={promotionId} />;
}
