if (typeof global.BroadcastChannel === 'undefined') {
  class BroadcastChannelMock {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
  // @ts-expect-error - Provide mock for environments without BroadcastChannel.
  global.BroadcastChannel = BroadcastChannelMock;
}

import { useState } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { renderWithProviders } from '@/test-utils/renderWithProviders';
import AdminProductImagesPanel from '../AdminProductImagesPanel';
import type { ProductImageRead, ProductRead } from '@/types/product';
import { server } from '@/test-utils/msw/server';
import { productApi } from '@/store/api/productApi';

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const initialImages: ProductImageRead[] = [
  {
    id: 'img-1',
    product_id: 'prod-1',
    url: 'https://example.com/1.jpg',
    alt_text: 'Imagen 1',
    is_primary: true,
    sort_order: 1,
  },
  {
    id: 'img-2',
    product_id: 'prod-1',
    url: 'https://example.com/2.jpg',
    alt_text: 'Imagen 2',
    is_primary: false,
    sort_order: 2,
  },
];

function setupPanel(images: ProductImageRead[] = initialImages) {
  const Wrapper = () => {
    const [stateImages, setStateImages] = useState(images);

    return (
      <AdminProductImagesPanel
        productId="prod-1"
        images={stateImages}
        onImagesChange={setStateImages}
        canEdit
      />
    );
  };

  return renderWithProviders(<Wrapper />);
}

describe('AdminProductImagesPanel', () => {
  it('adds a new image and renders the thumbnail', async () => {
    const newImage: ProductImageRead = {
      id: 'img-3',
      product_id: 'prod-1',
      url: 'https://example.com/3.jpg',
      alt_text: 'Imagen 3',
      is_primary: false,
      sort_order: 3,
    };

    server.use(
      http.post('http://127.0.0.1:8000/api/v1/products/:productId/images', async () => {
        return HttpResponse.json(newImage);
      }),
    );

    setupPanel();

    fireEvent.click(screen.getByRole('button', { name: /Agregar imagen/i }));
    fireEvent.change(screen.getByPlaceholderText('https://'), {
      target: { value: newImage.url },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar imagen/i }));

    await waitFor(() =>
      expect(screen.getByAltText(newImage.alt_text as string)).toBeInTheDocument(),
    );
  });

  it('marks a different image as primary and updates the indicator', async () => {
    const updatedImages = [
      { ...initialImages[0], is_primary: false },
      { ...initialImages[1], is_primary: true },
    ];

    const updatedProduct: ProductRead = {
      id: 'prod-1',
      slug: 'prod-1',
      title: 'Producto',
      description: null,
      price: 100,
      currency: 'USD',
      images: updatedImages,
      variants: [],
      created_at: null,
      updated_at: null,
    };

    server.use(
      http.post(
        'http://127.0.0.1:8000/api/v1/products/:productId/images/:imageId/primary',
        async () => {
          return HttpResponse.json(updatedProduct);
        },
      ),
    );

    const storeRender = setupPanel();
    const store = storeRender.store;

    store.dispatch(
      productApi.util.upsertQueryData('getProduct', 'prod-1', {
        ...updatedProduct,
        images: initialImages,
      }),
    );

    const primaryButtons = await screen.findAllByRole('button', {
      name: /Marcar como principal/i,
    });
    expect(primaryButtons.length).toBeGreaterThan(0);
    fireEvent.click(primaryButtons[0]);

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Marcar como principal/i })[0]).toBeDisabled(),
    );

    expect(screen.getAllByText(/Ya es principal/i).length).toBeGreaterThan(0);
  });
});
