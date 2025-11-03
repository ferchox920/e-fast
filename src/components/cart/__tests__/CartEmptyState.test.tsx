import { render, screen } from '@testing-library/react';

import CartEmptyState from '../CartEmptyState';

describe('CartEmptyState', () => {
  it('renders default title and description', () => {
    render(<CartEmptyState />);

    expect(screen.getByText(/Tu carrito esta vacio/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir a la tienda/i })).toHaveAttribute('href', '/');
  });

  it('supports custom content', () => {
    render(
      <CartEmptyState
        title="Sin items"
        description="Agrega nuevos productos"
        cta={<button type="button">Explorar</button>}
      />,
    );

    expect(screen.getByText('Sin items')).toBeInTheDocument();
    expect(screen.getByText('Agrega nuevos productos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explorar' })).toBeInTheDocument();
  });
});
