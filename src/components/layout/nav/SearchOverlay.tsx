'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchIcon } from './icons';

interface SearchOverlayProps {
  isOpen: boolean;
  brandHref: string;
  brandLabel: string;
  popularSearches: string[];
  onClose: () => void;
}

export default function SearchOverlay({
  isOpen,
  brandHref,
  brandLabel,
  popularSearches,
  onClose,
}: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const controls = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>('a,button,input') ?? [],
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    const focusTimeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 180);

    document.body.classList.add('overflow-hidden');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimeout);
      document.body.classList.remove('overflow-hidden');
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-70 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        aria-label="Cerrar buscador"
        tabIndex={-1}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      />

      <div
        ref={dialogRef}
        className={`relative mx-auto w-full max-w-5xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Buscador de productos"
      >
        <div className="mx-4 mt-4 overflow-hidden rounded-2xl bg-white shadow-2xl sm:mx-8">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3">
              <Link
                href={brandHref}
                className="text-lg font-semibold text-indigo-600 transition hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
                onClick={onClose}
              >
                {brandLabel}
              </Link>
            </div>
            <form
              className="flex flex-1 items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                router.push(
                  `/products?search=${encodeURIComponent(inputRef.current?.value.trim() ?? '')}`,
                );
                onClose();
              }}
            >
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <SearchIcon />
                </span>
                <input
                  ref={inputRef}
                  type="search"
                  className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:text-base"
                  placeholder="Buscar productos, marcas o categorias"
                  autoComplete="off"
                  aria-label="Buscar productos"
                />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="hidden rounded-full border border-transparent px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:inline-flex"
              >
                Cerrar
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start">
            <div className="flex flex-1 flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Busquedas populares
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      router.push(`/products?search=${encodeURIComponent(term)}`);
                      onClose();
                    }}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-indigo-300 hover:text-indigo-600 sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center border-t border-gray-100 px-5 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-50 sm:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
