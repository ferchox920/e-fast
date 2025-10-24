// src/app/(dev)/admin-playground/page.tsx (Archivo nuevo o adaptar existente)
import AdminPlayground from '@/components/debug/AdminPlayground';

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      {' '}
      {/* Ajusta max-w si es necesario */}
      {/* Puedes incluir UserPlayground si quieres ambos en la misma página */}
      {/* <UserPlayground /> */}
      {/* <div className="my-8 border-t"></div> */} {/* Separador opcional */}
      <AdminPlayground />
    </div>
  );
}
