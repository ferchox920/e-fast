import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NavBar, { type NavBarCategoryGroup } from '../NavBar';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

const categoryGroups: NavBarCategoryGroup[] = [
  {
    id: 'men',
    name: '\u2642 Hombres',
    items: [
      { id: 'men-ropa', name: 'Ropa', slug: 'hombres/ropa' },
      { id: 'men-zapatos', name: 'Zapatos', slug: 'hombres/zapatos' },
    ],
  },
  {
    id: 'women',
    name: '\u2640 Mujeres',
    items: [
      { id: 'women-ropa', name: 'Ropa', slug: 'mujeres/ropa' },
      { id: 'women-zapatos', name: 'Zapatos', slug: 'mujeres/zapatos' },
    ],
  },
];

const popularSearches = ['Sneakers', 'Blazer', 'Vestidos'];

describe('NavBar', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens and closes the search overlay via keyboard', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <NavBar
        brandHref="/"
        brandLabel="MyApp"
        categoryGroups={categoryGroups}
        popularSearches={popularSearches}
        user={null}
        cartItemCount={0}
      />,
    );

    const searchButton = screen.getByRole('button', { name: /Abrir buscador/i });
    await user.click(searchButton);

    const dialog = await screen.findByRole('dialog', { name: /Buscador de productos/i });
    expect(dialog).toBeInTheDocument();
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /Buscador de productos/i }),
      ).not.toBeInTheDocument(),
    );
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });

  it('expands desktop categories on hover and collapses after leaving', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({
      advanceTimers: (ms) => jest.advanceTimersByTime(ms),
    });

    renderWithProviders(
      <NavBar
        brandHref="/"
        brandLabel="MyApp"
        categoryGroups={categoryGroups}
        popularSearches={popularSearches}
        user={null}
        cartItemCount={0}
      />,
    );

    const menButton = screen.getByRole('button', { name: /\u2642 Hombres/i });

    await user.hover(menButton);
    expect(menButton).toHaveAttribute('aria-expanded', 'true');

    const menPanel = document.getElementById('category-panel-men');
    expect(menPanel).not.toBeNull();
    expect(
      within(menPanel as HTMLElement).getByRole('menuitem', { name: /ropa/i }),
    ).toBeInTheDocument();

    await user.unhover(menButton);
    act(() => {
      jest.advanceTimersByTime(150);
    });
    await waitFor(() => expect(menButton).toHaveAttribute('aria-expanded', 'false'));
  });

  it('toggles the mobile menu when pressing the menu button', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <NavBar
        brandHref="/"
        brandLabel="MyApp"
        categoryGroups={categoryGroups}
        popularSearches={popularSearches}
        user={null}
        cartItemCount={0}
      />,
    );

    const menuButton = screen.getByRole('button', { name: /Abrir menu/i });
    await user.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-label', 'Cerrar menu');
    expect(screen.getByText('Lista de deseos', { selector: 'a' })).toBeInTheDocument();

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-label', 'Abrir menu');
  });
});
