'use client';

import Image from 'next/image';
import Link from 'next/link';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1600&q=80';

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="Cliente sonriendo mientras abre una caja de compra online"
          fill
          priority
          className="object-cover"
          sizes="(min-width:1024px) 1200px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/30" />
      </div>

      <div className="relative flex flex-col gap-6 px-6 py-12 sm:px-10 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-16 lg:py-20">
        <div className="max-w-xl space-y-4">
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 backdrop-blur">
            e-fast · tu compra en minutos
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
            Lo que querés, al instante.
          </h1>
          <p className="text-base text-neutral-600 sm:text-lg">
            Miles de productos, entregados en tiempo récord. Sentí la experiencia moderna de comprar
            sin esperar.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Comprar ahora
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center justify-center rounded-full border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-300"
            >
              Explorar categorías
            </Link>
          </div>
        </div>

        <div className="hidden max-w-sm flex-1 rounded-2xl border border-white/60 bg-white/70 p-6 backdrop-blur lg:block">
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Promesa</p>
          <p className="mt-3 text-2xl font-semibold text-neutral-900">Rápido. Fácil. e-fast.</p>
          <p className="mt-4 text-sm text-neutral-600">
            Entregas en menos de 24 horas en las principales ciudades. Pagos seguros, seguimiento en
            tiempo real y soporte humano cuando lo necesites.
          </p>
        </div>
      </div>
    </section>
  );
}
