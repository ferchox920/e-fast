import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CartItemCard, { type CartItem } from '../CartItemCard';

const baseItem: CartItem = {
  id: 'sku-1',
  name: 'Camiseta Essentials',
  variant: 'Azul - Talla M',
  price: 25,
  quantity: 2,
};

describe('CartItemCard', () => {
  it('renders product details and subtotal', () => {
    render(<CartItemCard item={baseItem} />);

    expect(screen.getByText('Camiseta Essentials')).toBeInTheDocument();
    expect(screen.getByText('Azul - Talla M')).toBeInTheDocument();
    expect(screen.getByText(/Subtotal/)).toBeInTheDocument();
    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    });
    const formattedSubtotal = formatter
      .format(baseItem.price * baseItem.quantity)
      .replace(/\s/g, '');
    expect(
      screen.getByText((content) => content.replace(/\s/g, '').includes(formattedSubtotal)),
    ).toBeInTheDocument();
  });

  it('invokes callbacks for quantity controls and removal', async () => {
    const user = userEvent.setup();
    const onIncrement = jest.fn();
    const onDecrement = jest.fn();
    const onRemove = jest.fn();

    render(
      <CartItemCard
        item={baseItem}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Aumentar cantidad/i }));
    await user.click(screen.getByRole('button', { name: /Reducir cantidad/i }));
    await user.click(screen.getByRole('button', { name: /Quitar Camiseta Essentials/i }));

    expect(onIncrement).toHaveBeenCalledWith(baseItem.id);
    expect(onDecrement).toHaveBeenCalledWith(baseItem.id);
    expect(onRemove).toHaveBeenCalledWith(baseItem.id);
  });

  it('supports custom actions slot', () => {
    render(
      <CartItemCard item={baseItem} actions={<button type="button">Guardar para luego</button>} />,
    );

    expect(screen.getByRole('button', { name: /Guardar para luego/i })).toBeInTheDocument();
  });
});
