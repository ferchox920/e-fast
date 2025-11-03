import { render, screen } from '@testing-library/react';

import CartSummaryCard, { type CartSummaryLine } from '../CartSummaryCard';

const lines: CartSummaryLine[] = [
  { id: 'subtotal', label: 'Subtotal', value: 100 },
  { id: 'shipping', label: 'Envio', value: 0, type: 'discount' },
  { id: 'total', label: 'Total', value: 100, type: 'total' },
];

describe('CartSummaryCard', () => {
  it('renders summary lines and CTA', () => {
    render(
      <CartSummaryCard
        lines={lines}
        cta={<button type="button">Checkout</button>}
        footer={<span>Nota</span>}
      />,
    );

    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    });
    const formattedTotal = formatter.format(100).replace(/\s/g, '');
    expect(
      screen.getAllByText((content) => content.replace(/\s/g, '').includes(formattedTotal)).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Checkout' })).toBeInTheDocument();
    expect(screen.getByText('Nota')).toBeInTheDocument();
  });
});
