import ProductDetailClient from '@/components/product/ProductDetailClient';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const slug = decodeURIComponent(params.slug);
  return <ProductDetailClient slug={slug} />;
}
