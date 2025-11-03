import { render, screen } from '@testing-library/react';

import LoginHero from '../LoginHero';

describe('LoginHero', () => {
  it('renders default content', () => {
    render(<LoginHero />);

    expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument();
    expect(screen.getByText(/Accede para seguir gestionando tus pedidos/i)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('accepts custom title, subtitle and tips', () => {
    render(
      <LoginHero
        title="Hola de nuevo"
        subtitle="Continúa administrando tu tienda."
        tips={['Tip 1', 'Tip 2']}
      />,
    );

    expect(screen.getByText('Hola de nuevo')).toBeInTheDocument();
    expect(screen.getByText('Continúa administrando tu tienda.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
