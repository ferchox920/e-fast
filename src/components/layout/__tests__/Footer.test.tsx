// src/components/layout/__tests__/Footer.test.tsx
import { render, screen } from '@testing-library/react';
import Footer from '../Footer'; // Ajusta la ruta si es necesario

// Describe el conjunto de tests para el componente Footer
describe('Footer Component', () => {
  // Define un test específico (it)
  it('should render the copyright text including the current year and brand name', () => {
    // Renderiza el componente en un DOM virtual
    render(<Footer />);

    // Obtiene el año actual para la aserción
    const currentYear = new Date().getFullYear();

    // Define una expresión regular para buscar el texto del copyright.
    // \s* permite espacios opcionales alrededor del año.
    // 'i' hace que la búsqueda no distinga mayúsculas/minúsculas para 'e-fast'.
    const copyrightRegex = new RegExp(`©\\s*${currentYear}\\s*MyApp`, 'i');

    // Busca un elemento que contenga el texto que coincide con la expresión regular.
    // screen.getByText fallará si no encuentra exactamente un elemento, lo cual es bueno para tests.
    const copyrightElement = screen.getByText(copyrightRegex);

    // Afirma (expect) que el elemento encontrado está presente en el documento virtual.
    expect(copyrightElement).toBeInTheDocument();
  });

  // Puedes añadir más tests aquí, por ejemplo, para verificar enlaces:
  // it('should contain a link to the homepage', () => {
  //   render(<Footer />);
  //   const homeLink = screen.getByRole('link', { name: /e-fast/i }); // Busca un enlace con texto 'e-fast'
  //   expect(homeLink).toBeInTheDocument();
  //   expect(homeLink).toHaveAttribute('href', '/'); // Verifica el atributo href
  // });
});
