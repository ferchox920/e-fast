import type { ProductImageRead, ProductRead } from '@/types/product';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

jest.mock('@/store/api/productApi', () => ({
  useGetProductBySlugQuery: jest.fn(),
  useGetProductQuestionsQuery: jest.fn(),
  usePostProductQuestionMutation: jest.fn(),
}));

import {
  useGetProductBySlugQuery,
  useGetProductQuestionsQuery,
  usePostProductQuestionMutation,
} from '@/store/api/productApi';
import ProductDetailClient from '../ProductDetailClient';

const mockedUseGetProductQuery = useGetProductBySlugQuery as jest.Mock;
const mockedUseGetProductQuestionsQuery = useGetProductQuestionsQuery as jest.Mock;
const mockedUsePostProductQuestionMutation = usePostProductQuestionMutation as jest.Mock;

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
  beforeEach(() => {
    mockedUseGetProductQuestionsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    mockedUsePostProductQuestionMutation.mockReturnValue([
      jest.fn(),
      {
        isLoading: false,
      },
    ]);
  });

  afterEach(() => {
    mockedUseGetProductQuery.mockReset();
    mockedUseGetProductQuestionsQuery.mockReset();
    mockedUsePostProductQuestionMutation.mockReset();
  });

  it('renders loading state with skeleton feedback', () => {
    mockedUseGetProductQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByTestId, getByText } = renderWithProviders(
      <ProductDetailClient slug="my-product" />,
    );
    expect(getByTestId('product-gallery-skeleton')).toBeInTheDocument();
    expect(getByText(/Cargando producto/i)).toBeInTheDocument();
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

    const { getByRole, getByText } = renderWithProviders(<ProductDetailClient slug="my-product" />);
    expect(getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
    expect(getByText(/No pudimos cargar el producto/i)).toBeInTheDocument();
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

    const { getByText } = renderWithProviders(<ProductDetailClient slug="my-product" />);
    expect(getByText(/Se recibieron varias imagenes principales/i)).toBeInTheDocument();
  });
});
