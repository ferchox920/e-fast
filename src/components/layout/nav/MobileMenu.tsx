import Link from 'next/link';
import type { NavBarCategoryGroup } from '../NavBar';
import type { UserRead } from '@/types/user';

interface MobileMenuProps {
  isOpen: boolean;
  categoryGroups: NavBarCategoryGroup[];
  user: UserRead | null;
  onCloseMenu: () => void;
  onLogout?: () => void;
}

export default function MobileMenu({
  isOpen,
  categoryGroups,
  user,
  onCloseMenu,
  onLogout,
}: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute left-0 right-0 top-16 border-b border-t bg-white shadow-lg md:hidden">
      <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
        {categoryGroups.map((group) => (
          <div key={`mobile-${group.id}`} className="space-y-1">
            <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {group.name}
            </p>
            {group.items.map((item) => (
              <Link
                key={item.id}
                href={`/categorias/${item.slug}`}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={onCloseMenu}
              >
                {item.name}
              </Link>
            ))}
          </div>
        ))}
        <Link
          href="/lista-deseos"
          className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          onClick={onCloseMenu}
        >
          Lista de deseos
        </Link>
        <Link
          href="/carrito"
          className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          onClick={onCloseMenu}
        >
          Carrito
        </Link>
        {user ? (
          <button
            type="button"
            onClick={onLogout}
            className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-red-600 hover:bg-gray-50"
          >
            Cerrar Sesion
          </button>
        ) : (
          <Link
            href="/login"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            onClick={onCloseMenu}
          >
            Mi cuenta
          </Link>
        )}
      </div>
    </div>
  );
}
