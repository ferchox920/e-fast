'use client';

import type { ReactNode } from 'react';

interface LoginLayoutProps {
  theme?: 'light' | 'dark';
  hero: ReactNode;
  form: ReactNode;
}

export default function LoginLayout({ hero, form }: LoginLayoutProps) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[color:var(--login-line)] bg-[var(--login-surface)] shadow-[0_32px_90px_rgba(31,42,36,0.12)] backdrop-blur-sm">
      <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="grid lg:grid-cols-[1.18fr_0.94fr]">
        <div className="relative overflow-hidden bg-[linear-gradient(145deg,#163f38_0%,#1f5f53_52%,#102b27_100%)] px-8 py-10 text-white sm:px-10 sm:py-12">
          <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_68%)]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-16 translate-y-20 rounded-full bg-[radial-gradient(circle,rgba(200,135,77,0.28),transparent_62%)]" />
          <div className="relative flex h-full min-h-[430px] flex-col justify-between">{hero}</div>
        </div>
        <div className="relative flex flex-col justify-center bg-[var(--login-surface-strong)] px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
          {form}
        </div>
      </div>
    </section>
  );
}
