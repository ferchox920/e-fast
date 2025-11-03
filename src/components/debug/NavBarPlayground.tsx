'use client';

import { useMemo, useState } from 'react';
import NavBar, { type NavBarCategoryGroup } from '@/components/layout/NavBar';
import type { UserRead } from '@/types/user';

type UserPreset = 'anonymous' | 'buyer' | 'admin';

const baseCategoryGroups: NavBarCategoryGroup[] = [
  {
    id: 'men',
    name: '\u2642 Hombres',
    items: [
      { id: 'men-ropa', name: 'Ropa', slug: 'hombres/ropa' },
      { id: 'men-zapatos', name: 'Zapatos', slug: 'hombres/zapatos' },
      { id: 'men-accesorios', name: 'Accesorios', slug: 'hombres/accesorios' },
    ],
  },
  {
    id: 'women',
    name: '\u2640 Mujeres',
    items: [
      { id: 'women-ropa', name: 'Ropa', slug: 'mujeres/ropa' },
      { id: 'women-zapatos', name: 'Zapatos', slug: 'mujeres/zapatos' },
      { id: 'women-accesorios', name: 'Accesorios', slug: 'mujeres/accesorios' },
    ],
  },
];

const buildUser = (overrides: Partial<UserRead>): UserRead => ({
  id: overrides.id ?? 'demo-user-id',
  email: overrides.email ?? 'demo@example.com',
  full_name: overrides.full_name ?? 'Usuario Demo',
  is_active: overrides.is_active ?? true,
  is_superuser: overrides.is_superuser ?? false,
  email_verified: overrides.email_verified ?? true,
  address_line1: overrides.address_line1 ?? null,
  address_line2: overrides.address_line2 ?? null,
  city: overrides.city ?? null,
  state: overrides.state ?? null,
  postal_code: overrides.postal_code ?? null,
  country: overrides.country ?? null,
  phone: overrides.phone ?? null,
  birthdate: overrides.birthdate ?? null,
  avatar_url: overrides.avatar_url ?? null,
  oauth_provider: overrides.oauth_provider ?? null,
  oauth_sub: overrides.oauth_sub ?? null,
  oauth_picture: overrides.oauth_picture ?? null,
});

export default function NavBarPlayground() {
  const [brandLabel, setBrandLabel] = useState('MyApp');
  const [showCategories, setShowCategories] = useState(true);
  const [userPreset, setUserPreset] = useState<UserPreset>('anonymous');
  const [lastAction, setLastAction] = useState<string | null>(null);
  const popularSearches = useMemo(
    () => ['Sneakers blancas', 'Blazer oversize', 'Joggers', 'Sombreros bucket', 'Perfume floral'],
    [],
  );

  const categoryGroups = useMemo<NavBarCategoryGroup[]>(
    () => (showCategories ? baseCategoryGroups : []),
    [showCategories],
  );

  const user = useMemo<UserRead | null>(() => {
    if (userPreset === 'anonymous') return null;
    if (userPreset === 'admin') {
      return buildUser({
        id: 'admin-1',
        email: 'admin@myapp.test',
        full_name: 'Admin Demo',
        is_superuser: true,
      });
    }
    return buildUser({
      id: 'buyer-1',
      email: 'cliente@myapp.test',
      full_name: 'Cliente Demo',
    });
  }, [userPreset]);

  const handleLogout = () => {
    setUserPreset('anonymous');
    setLastAction('Se ejecuto onLogout desde el NavBar');
  };

  return (
    <section className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">NavBar Playground</h1>
        <p className="text-sm text-neutral-600">
          Explora diferentes estados del componente de navegacion. Ajusta los controles para ver
          como se comportan los botones (solo iconos) de busqueda, mi cuenta, lista de deseos y
          carrito, y recuerda que la campana de notificaciones solo aparece cuando hay usuario
          autenticado.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <article className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="border-b bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700">
              Vista escritorio
            </div>
            <div className="bg-white">
              <NavBar
                brandHref="/"
                brandLabel={brandLabel}
                categoryGroups={categoryGroups}
                popularSearches={popularSearches}
                user={user}
                onLogout={handleLogout}
              />
            </div>
          </article>

          <article className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="border-b bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700">
              Vista movil (375px)
            </div>
            <div className="flex justify-center bg-white py-4">
              <div className="w-[375px] overflow-hidden rounded-lg border shadow-sm">
                <NavBar
                  brandHref="/"
                  brandLabel={brandLabel}
                  categoryGroups={categoryGroups}
                  popularSearches={popularSearches}
                  user={user}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </article>
        </div>

        <aside className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-800">Controles</h2>
            <p className="text-xs text-neutral-500">
              Estos controles solo afectan el playground y no persisten cambios en el store global.
            </p>
          </div>

          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Branding
            <input
              type="text"
              value={brandLabel}
              onChange={(event) => setBrandLabel(event.target.value)}
              className="rounded border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Nombre comercial"
            />
          </label>

          <div className="flex flex-col gap-2 text-sm text-neutral-700">
            Estado de usuario
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setUserPreset('anonymous')}
                className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                  userPreset === 'anonymous'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                Invitado
              </button>
              <button
                type="button"
                onClick={() => setUserPreset('buyer')}
                className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                  userPreset === 'buyer'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                Cliente
              </button>
              <button
                type="button"
                onClick={() => setUserPreset('admin')}
                className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                  userPreset === 'admin'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={showCategories}
              onChange={(event) => setShowCategories(event.target.checked)}
              className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
            />
            Mostrar dropdown de categorias
          </label>

          {lastAction && (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {lastAction}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
