'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
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

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
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
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = () => {
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-70 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      />

      <div
        className={`relative mx-auto w-full max-w-5xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Buscador de productos"
      >
        <div className="mx-4 mt-4 overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 shadow-2xl shadow-stone-950/25 sm:mx-8">
          <div className="flex flex-col gap-3 border-b border-stone-200 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3">
              <Link
                href={brandHref}
                className="rounded px-1 text-sm font-semibold uppercase tracking-[0.32em] text-stone-900 transition hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2"
                onClick={onClose}
              >
                {brandLabel}
              </Link>
            </div>
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400">
                  <SearchIcon />
                </span>
                <input
                  ref={inputRef}
                  type="search"
                  className="w-full rounded-full border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-700 outline-none transition focus:border-stone-500 focus:bg-white focus:ring-2 focus:ring-stone-200 sm:text-base"
                  placeholder="Buscar productos, marcas o categorias"
                  autoComplete="off"
                  aria-label="Buscar productos"
                />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="hidden rounded-full border border-transparent px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 sm:inline-flex"
              >
                Cerrar
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start">
            <div className="flex flex-1 flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                Busquedas populares
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-700 transition hover:border-stone-500 hover:text-stone-900 sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2"
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
            className="flex w-full items-center justify-center border-t border-stone-200 px-5 py-3 text-sm font-medium text-stone-600 transition hover:bg-stone-100 sm:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
