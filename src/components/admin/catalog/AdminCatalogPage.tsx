'use client';

import AdminCategoryManager from '@/components/admin/dashboard/AdminCategoryManager';
import AdminBrandManager from '@/components/admin/dashboard/AdminBrandManager';

export default function AdminCatalogPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Catalogo</h1>
        <p className="text-sm text-neutral-600">
          Gestiona categorias y marcas en un modulo dedicado.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-2">
        <AdminCategoryManager />
        <AdminBrandManager />
      </section>
    </div>
  );
}
