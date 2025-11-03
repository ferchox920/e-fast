'use client';

import type { ReactNode } from 'react';

export interface CartSummaryLine {
  id: string;
  label: string;
  value: number;
  type?: 'default' | 'discount' | 'total';
}

export interface CartSummaryCardProps {
  title?: string;
  lines: CartSummaryLine[];
  footer?: ReactNode;
  cta?: ReactNode;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);

const lineClassNames: Record<'default' | 'discount' | 'total', string> = {
  default: 'text-sm text-neutral-600',
  discount: 'text-sm font-medium text-emerald-600',
  total: 'text-base font-semibold text-neutral-900',
};

export default function CartSummaryCard({
  title = 'Resumen',
  lines,
  cta,
  footer,
}: CartSummaryCardProps) {
  return (
    <aside className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <header>
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="text-xs text-neutral-500">
          Revisa los imports antes de completar tu pedido. Los descuentos se aplican
          automaticamente.
        </p>
      </header>

      <dl className="space-y-3">
        {lines.map((line) => (
          <div key={line.id} className="flex items-center justify-between">
            <dt className={lineClassNames[line.type ?? 'default']}>{line.label}</dt>
            <dd className={lineClassNames[line.type ?? 'default']}>{formatCurrency(line.value)}</dd>
          </div>
        ))}
      </dl>

      {cta}

      {footer && (
        <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500">{footer}</div>
      )}
    </aside>
  );
}
