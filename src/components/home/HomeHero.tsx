'use client';

import Image from 'next/image';
import Link from 'next/link';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80';

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 shadow-sm">
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="Modelo con look urbano de temporada"
          fill
          priority
          className="object-cover"
          sizes="(min-width:1024px) 1200px, 100vw"
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-950/85 via-stone-900/55 to-stone-900/10" />
      </div>

      <div className="relative flex flex-col gap-6 px-6 py-12 sm:px-10 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-16 lg:py-20">
        <div className="max-w-xl space-y-4">
          <span className="inline-flex items-center rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
            nueva temporada 2026
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Indumentaria que define tu estilo.
          </h1>
          <p className="text-base text-stone-200 sm:text-lg">
            Descubri drops semanales de ropa urbana, essentials y piezas premium para armar looks
            completos sin salir de casa.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 shadow-lg shadow-stone-950/20 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              Comprar indumentaria
            </Link>
            <Link
              href="/products?sort_by=popularity_score&sort_order=desc"
              className="inline-flex items-center justify-center rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              Ver mas populares
            </Link>
          </div>
        </div>

        <div className="hidden max-w-sm flex-1 rounded-2xl border border-white/25 bg-white/15 p-6 text-white backdrop-blur lg:block">
          <p className="text-sm font-medium uppercase tracking-wide text-stone-200">Lookbook de la semana</p>
          <p className="mt-3 text-2xl font-semibold">Basicos, denim y outerwear para todos los dias.</p>
          <p className="mt-4 text-sm text-stone-200">
            Curamos outfits por temporada y talles reales para que combines prendas en segundos.
          </p>
          <div className="mt-6 flex items-center justify-between border-t border-white/25 pt-4 text-sm">
            <span className="text-stone-100">Envio express</span>
            <span className="font-semibold text-white">24-48 hs</span>
          </div>
        </div>
      </div>
    </section>
  );
}
