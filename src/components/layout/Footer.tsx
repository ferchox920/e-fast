import Link from 'next/link';

const SHOP_LINKS = [
  { href: '/products', label: 'Novedades' },
  { href: '/products?sort_by=popularity_score&sort_order=desc', label: 'Mas populares' },
  { href: '/categorias/hombres/ropa', label: 'Hombre' },
  { href: '/categorias/mujeres/ropa', label: 'Mujer' },
];

const SUPPORT_LINKS = [
  { href: '/mi-cuenta', label: 'Mi cuenta' },
  { href: '/login', label: 'Iniciar sesion' },
  { href: '/registro', label: 'Crear cuenta' },
  { href: '/notifications', label: 'Notificaciones' },
  { href: '/checkout', label: 'Ayuda de compra' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-14 border-t border-stone-200 bg-stone-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 border-b border-stone-200 pb-8 text-center md:grid-cols-3 md:text-left">
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Marca</p>
            <p className="text-lg font-semibold text-stone-900">MyApp Atelier</p>
            <p className="text-sm text-stone-600">Moda urbana y essentials de temporada.</p>
          </section>

          <section aria-label="Navegacion de tienda" className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Tienda</h3>
            <ul className="space-y-2 text-sm text-stone-700">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-stone-950">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Navegacion de soporte" className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Soporte</h3>
            <ul className="space-y-2 text-sm text-stone-700">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-stone-950">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-stone-500 sm:flex-row">
          <p>&copy; {currentYear} MyApp. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacidad" className="transition hover:text-stone-700">
              Politica de privacidad
            </Link>
            <Link href="/terminos" className="transition hover:text-stone-700">
              Terminos y condiciones
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
