import { render } from '@testing-library/react';
import type { ProductImageRead, ProductRead } from '@/types/product';

jest.mock('@/store/api/productApi', () => ({
  useGetProductQuery: jest.fn(),
}));

import { useGetProductQuery } from '@/store/api/productApi';
import ProductDetailClient from '../ProductDetailClient';

const mockedUseGetProductQuery = useGetProductQuery as jest.Mock;

const baseProduct: ProductRead = {
  id: 'prod-1',
  slug: 'my-product',
  title: 'Producto Demo',
  description: 'Descripcion demo',
  price: 199,
  currency: 'USD',
  active: true,
  images: [],
  variants: [],
  created_at: null,
  updated_at: null,
};

const createImage = (id: string, overrides: Partial<ProductImageRead> = {}): ProductImageRead => ({
  id,
  product_id: baseProduct.id,
  url: `https://example.com/${id}.jpg`,
  alt_text: `Imagen ${id}`,
  is_primary: false,
  sort_order: 1,
  ...overrides,
});

describe('ProductDetailClient snapshots', () => {
  afterEach(() => {
    mockedUseGetProductQuery.mockReset();
  });

  it('renders loading state snapshot', () => {
    mockedUseGetProductQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { asFragment } = render(<ProductDetailClient slug="my-product" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders error state with retry button', () => {
    mockedUseGetProductQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: { status: 500 },
      refetch: jest.fn(),
    });

    const { asFragment, getByRole } = render(<ProductDetailClient slug="my-product" />);
    expect(getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });

  it('shows anomaly warning when multiple primary images', () => {
    mockedUseGetProductQuery.mockReturnValue({
      data: {
        ...baseProduct,
        images: [
          createImage('1', { is_primary: true, sort_order: 1 }),
          createImage('2', { is_primary: true, sort_order: 2 }),
        ],
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText, asFragment } = render(<ProductDetailClient slug="my-product" />);
    expect(getByText(/Se recibieron varias imágenes principales/i)).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });
});
