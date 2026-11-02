import { redirect } from 'next/navigation';

interface ProductRouteProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const toQueryString = (params: Record<string, string | string[] | undefined>) => {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      qs.set(key, value);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        qs.append(key, item);
      }
    }
  }
  const query = qs.toString();
  return query ? `?${query}` : '';
};

export default async function AdminProductLegacyRoute({
  params,
  searchParams,
}: ProductRouteProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = toQueryString(resolvedSearchParams);
  redirect(`/admin/products/${slug}/edit${query}`);
}
