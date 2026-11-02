import { render, screen } from '@testing-library/react';

import LoginHero from '../LoginHero';

describe('LoginHero', () => {
  it('renders default content', () => {
    render(<LoginHero />);

    expect(
      screen.getByText('Todo lo que importa de tu compra, en un acceso claro.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/seguir tus pedidos, revisar guardados/i)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('accepts custom title, subtitle and highlights', () => {
    render(
      <LoginHero
        title="Hola de nuevo"
        subtitle="Continúa administrando tu tienda."
        highlights={[
          { title: 'Tip 1', description: 'Texto 1' },
          { title: 'Tip 2', description: 'Texto 2' },
        ]}
      />,
    );

    expect(screen.getByText('Hola de nuevo')).toBeInTheDocument();
    expect(screen.getByText('Continúa administrando tu tienda.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
