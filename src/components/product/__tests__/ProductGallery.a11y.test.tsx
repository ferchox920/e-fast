import { render, screen } from '@testing-library/react';

import ProductGallery from '../ProductGallery';
import type { ProductImageRead } from '@/types/product';

const images: ProductImageRead[] = [
  {
    id: 'img-1',
    product_id: 'prod-1',
    url: 'https://example.com/1.jpg',
    alt_text: 'Imagen 1',
    is_primary: false,
    sort_order: 1,
  },
  {
    id: 'img-2',
    product_id: 'prod-1',
    url: 'https://example.com/2.jpg',
    alt_text: null,
    is_primary: true,
    sort_order: 2,
  },
] as ProductImageRead[];

describe('ProductGallery accessibility', () => {
  it('ensures all thumbnails have labels and lazy loading', () => {
    render(<ProductGallery images={images} />);

    const thumbButtons = screen.getAllByRole('option');
    thumbButtons.forEach((button) => {
      expect(button).toHaveAttribute('aria-selected');
      expect(button).toHaveAttribute('aria-pressed');
    });

    const thumbImages = screen.getAllByRole('img');
    thumbImages.forEach((img) => {
      expect(img).toHaveAttribute('alt');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });
});
