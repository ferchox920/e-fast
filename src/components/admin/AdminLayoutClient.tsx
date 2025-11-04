'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useLogoutHandler } from '@/store/hooks';

interface AdminLayoutClientProps {
  children: ReactNode;
}

interface AdminNavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Pedidos' },
  { href: '/admin/products', label: 'Productos' },
  { href: '/admin/promotions', label: 'Promociones' },
  { href: '/admin/customers', label: 'Clientes' },
  { href: '/admin/analytics', label: 'Analíticas' },
];

const REDIRECT_LOGIN_PATH = '/login?redirect=/admin/dashboard';

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const logoutHandler = useLogoutHandler();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const user = useAppSelector((state) => state.user.current);
  const status = useAppSelector((state) => state.user.status);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (user.is_superuser) return true;
    const role = (user as { role?: string | null }).role;
    return role === 'admin';
  }, [user]);

  const displayName = useMemo(() => {
    const fullName = user?.full_name?.trim();
    if (fullName) return fullName;
    const email = user?.email?.trim();
    if (email) return email;
    return 'Administrador';
  }, [user]);

  useEffect(() => {
    if (status === 'idle') {
      return;
    }

    if (!isAdmin) {
      router.replace(REDIRECT_LOGIN_PATH);
    }
  }, [isAdmin, router, status]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await logoutHandler();
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logoutHandler, router]);

  if (status === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-neutral-600">
        <p className="text-sm">Cargando sesión…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-neutral-600">
        <p className="text-sm">Redirigiendo…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-100 text-neutral-900">
      <aside className="flex w-64 flex-col border-r border-neutral-200 bg-white">
        <div className="px-6 py-6">
          <span className="text-lg font-semibold text-neutral-900">MyApp · Admin</span>
          <p className="mt-1 text-xs text-neutral-500">Gestión de la tienda</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 pb-6">
          {NAV_ITEMS.map((item) => {
            const isRootDashboard = item.href === '/admin/dashboard';
            const active =
              (!isRootDashboard && pathname.startsWith(item.href)) ||
              (isRootDashboard && (pathname === '/admin' || pathname === '/admin/dashboard'));

            const baseClasses =
              'flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors';
            const activeClasses = active
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900';

            return (
              <Link key={item.href} href={item.href} className={`${baseClasses} ${activeClasses}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-8 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Administrador activo</p>
            <p className="text-sm font-semibold text-neutral-900">{displayName}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
