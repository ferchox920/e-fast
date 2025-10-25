import ProductDetailClient from '@/components/product/ProductDetailClient';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return <ProductDetailClient slug={params.slug} />;
}
