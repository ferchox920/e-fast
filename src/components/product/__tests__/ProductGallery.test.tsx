import { fireEvent, render, screen } from '@testing-library/react';

import ProductGallery from '../ProductGallery';
import type { ProductImageRead } from '@/types/product';

const baseImages: ProductImageRead[] = [
  {
    id: '1',
    product_id: 'p1',
    url: 'https://example.com/1.jpg',
    alt_text: 'Imagen 1',
    is_primary: false,
    sort_order: 2,
  },
  {
    id: '2',
    product_id: 'p1',
    url: 'https://example.com/2.jpg',
    alt_text: 'Imagen 2',
    is_primary: true,
    sort_order: 1,
  },
  {
    id: '3',
    product_id: 'p1',
    url: 'https://example.com/3.jpg',
    alt_text: 'Imagen 3',
    is_primary: false,
    sort_order: 3,
  },
];

describe('ProductGallery', () => {
  it('shows placeholder when images list is empty', () => {
    render(<ProductGallery images={[]} />);

    expect(
      screen.getByRole('img', { name: /producto sin imagenes disponibles/i }),
    ).toBeInTheDocument();
  });

  it('renders primary image by default', () => {
    render(<ProductGallery images={baseImages} />);

    const mainImage = screen.getByTestId('product-gallery-main-image');
    expect(mainImage).toBeInTheDocument();
    expect(mainImage).toHaveAttribute(
      'alt',
      baseImages[1].alt_text ?? 'Imagen generica del producto',
    );

    const thumbnails = screen.getAllByRole('option');
    expect(thumbnails).toHaveLength(baseImages.length);
    expect(thumbnails[0]).toHaveAttribute('aria-selected', 'true');
    expect(thumbnails[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('allows selecting a different thumbnail via click and keyboard navigation', () => {
    render(<ProductGallery images={baseImages} />);

    const thumbnails = screen.getAllByRole('option');
    fireEvent.click(thumbnails[0]);

    expect(thumbnails[0]).toHaveAttribute('aria-selected', 'true');
    const expectedAlt = baseImages[0].alt_text ?? 'Imagen generica del producto 1';
    expect(screen.getByAltText(expectedAlt)).toBeInTheDocument();

    thumbnails[0].focus();
    fireEvent.keyDown(thumbnails[0], { key: 'ArrowRight' });

    expect(thumbnails[1]).toHaveFocus();
    expect(thumbnails[1]).toHaveAttribute('aria-selected', 'true');
    expect(thumbnails[1]).toHaveAttribute('aria-pressed', 'true');
  });

  it('falls back to the first image when none are flagged as primary', () => {
    const imagesWithoutPrimary = baseImages.map((image) => ({ ...image, is_primary: false }));
    render(<ProductGallery images={imagesWithoutPrimary} />);

    const mainImage = screen.getByTestId('product-gallery-main-image');
    expect(mainImage).toHaveAttribute(
      'alt',
      imagesWithoutPrimary[1].alt_text ?? 'Imagen generica del producto',
    );
  });

  it('normalizes multiple primary images to the first by sort order', () => {
    const imagesWithMultiplePrimary = baseImages.map((image) => ({ ...image, is_primary: true }));
    render(<ProductGallery images={imagesWithMultiplePrimary} />);

    const thumbnails = screen.getAllByRole('option');
    expect(thumbnails[0]).toHaveAttribute('aria-selected', 'true');
    expect(thumbnails[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('applies a friendly fallback alt text when missing', () => {
    const imagesWithMissingAlt = baseImages.map((image) => ({ ...image, alt_text: null }));
    render(<ProductGallery images={imagesWithMissingAlt} />);

    const mainImage = screen.getByTestId('product-gallery-main-image');
    expect(mainImage).toHaveAttribute('alt', 'Imagen generica del producto');

    const thumbnails = screen.getAllByRole('option');
    expect(screen.getByAltText('Imagen generica del producto 2')).toBeInTheDocument();
    expect(thumbnails[1]).toHaveAttribute('aria-pressed', 'false');
  });
});
