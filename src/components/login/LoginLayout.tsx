'use client';

import type { ReactNode } from 'react';

export type LoginTheme = 'light' | 'dark';

interface LoginLayoutProps {
  theme?: LoginTheme;
  hero: ReactNode;
  form: ReactNode;
}

export default function LoginLayout({ theme = 'light', hero, form }: LoginLayoutProps) {
  const outerThemeClass =
    theme === 'dark' ? 'bg-neutral-900 text-neutral-100' : 'bg-neutral-100 text-neutral-900';
  const heroThemeClass =
    theme === 'dark' ? 'bg-neutral-900 text-neutral-100' : 'bg-white text-neutral-900';
  const formThemeClass =
    theme === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-white text-neutral-900';

  return (
    <div
      className={`min-h-[520px] overflow-hidden rounded-2xl border shadow-sm transition ${outerThemeClass}`}
    >
      <div className="grid h-full gap-0 lg:grid-cols-[1.1fr_1fr]">
        <div className={`flex flex-col justify-between p-8 ${heroThemeClass}`}>{hero}</div>
        <div className={`flex flex-col justify-center gap-6 px-8 py-10 ${formThemeClass}`}>
          {form}
        </div>
      </div>
    </div>
  );
}
