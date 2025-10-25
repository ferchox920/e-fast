// src/components/layout/__tests__/Footer.test.tsx
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import Footer from '../Footer';

// Describe el conjunto de tests para el componente Footer
describe('Footer Component', () => {
  // Define un test específico (it)
  it('should render the copyright text including the current year and brand name', () => {
    // Renderiza el componente en un DOM virtual
    renderWithProviders(<Footer />);

    // Obtiene el año actual para la aserción
    const currentYear = new Date().getFullYear();

    // screen.getByText fallará si no encuentra exactamente un elemento, lo cual es bueno para tests.
    const footerText = screen.getByText(/MyApp/i);

    // Afirma (expect) que el elemento encontrado está presente en el documento virtual.
    expect(footerText).toBeInTheDocument();
    expect(footerText).toHaveTextContent(String(currentYear));
  });

  // Puedes añadir más tests aquí, por ejemplo, para verificar enlaces:
  // it('should contain a link to the homepage', () => {
  //   render(<Footer />);
  //   const homeLink = screen.getByRole('link', { name: /e-fast/i }); // Busca un enlace con texto 'e-fast'
  //   expect(homeLink).toBeInTheDocument();
  //   expect(homeLink).toHaveAttribute('href', '/'); // Verifica el atributo href
  // });
});
