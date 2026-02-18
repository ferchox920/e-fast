import ProductDetailClient from '@/components/product/ProductDetailClient';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  return <ProductDetailClient slug={slug} />;
}
