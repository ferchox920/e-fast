import Link from 'next/link';
import type { NavBarCategoryGroup } from '../NavBar';
import type { UserRead } from '@/types/user';

interface MobileMenuProps {
  isOpen: boolean;
  categoryGroups: NavBarCategoryGroup[];
  user: UserRead | null;
  onCloseMenu: () => void;
  onLogout?: () => Promise<void> | void;
  isLogoutPending?: boolean;
}

export default function MobileMenu({
  isOpen,
  categoryGroups,
  user,
  onCloseMenu,
  onLogout,
  isLogoutPending = false,
}: MobileMenuProps) {
  const isAdminUser =
    user?.is_superuser === true || ((user as { role?: string | null } | null)?.role ?? null) === 'admin';

  if (!isOpen) return null;

  return (
    <div className="absolute left-0 right-0 top-20 border-b border-stone-200 bg-stone-50/95 shadow-xl backdrop-blur md:hidden">
      <div className="space-y-1 px-3 pb-4 pt-3">
        {categoryGroups.map((group) => (
          <div key={`mobile-${group.id}`} className="space-y-1">
            <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              {group.name}
            </p>
            {group.items.map((item) => (
              <Link
                key={item.id}
                href={`/categorias/${item.slug}`}
                className="block rounded-xl px-3 py-2 text-base font-medium text-stone-700 transition hover:bg-white hover:text-stone-900"
                onClick={onCloseMenu}
              >
                {item.name}
              </Link>
            ))}
          </div>
        ))}
        <Link
          href="/lista-deseos"
          className="block rounded-xl px-3 py-2 text-base font-medium text-stone-700 transition hover:bg-white hover:text-stone-900"
          onClick={onCloseMenu}
        >
          Lista de deseos
        </Link>
        <Link
          href="/carrito"
          className="block rounded-xl px-3 py-2 text-base font-medium text-stone-700 transition hover:bg-white hover:text-stone-900"
          onClick={onCloseMenu}
        >
          Carrito
        </Link>
        {user ? (
          <>
            <Link
              href="/mi-cuenta"
              className="block rounded-xl px-3 py-2 text-base font-medium text-stone-700 transition hover:bg-white hover:text-stone-900"
              onClick={onCloseMenu}
            >
              Mi cuenta
            </Link>
            {isAdminUser ? (
              <Link
                href="/admin/dashboard"
                className="block rounded-xl px-3 py-2 text-base font-semibold text-stone-900 transition hover:bg-white"
                onClick={onCloseMenu}
              >
                Dashboard Admin
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (isLogoutPending) return;
                if (onLogout) {
                  void onLogout();
                }
              }}
              className={`block w-full rounded-md px-3 py-2 text-left text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isLogoutPending ? 'cursor-progress text-red-400' : 'text-red-700 hover:bg-white'
              }`}
              disabled={isLogoutPending}
              aria-live="polite"
            >
              {isLogoutPending ? 'Cerrando sesion...' : 'Cerrar sesion'}
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="block rounded-xl px-3 py-2 text-base font-medium text-stone-700 transition hover:bg-white hover:text-stone-900"
            onClick={onCloseMenu}
          >
            Mi cuenta
          </Link>
        )}
      </div>
    </div>
  );
}
