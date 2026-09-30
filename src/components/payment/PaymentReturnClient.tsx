'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

export default function PaymentReturnClient() {
  const params = useSearchParams();
  const token = useAppSelector((state) => state.user.session.accessToken);
  const id = params.get('external_reference');
  const valid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const orderPath = valid ? `/orders/${id}` : '/mis-pedidos';
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-10">
      <h1 className="text-2xl font-semibold">Regresaste del proveedor de pago</h1>
      <p>El estado se confirma con el servidor. Regresar al comercio no confirma un cobro.</p>
      {!token && (
        <p>Tu sesión terminó al salir del comercio. Ingresa nuevamente para consultar tu pedido.</p>
      )}
      <Link
        className="inline-block rounded bg-indigo-600 px-4 py-3 text-white"
        href={token ? orderPath : `/login?redirect=${encodeURIComponent(orderPath)}`}
      >
        {token ? 'Consultar estado del pedido' : 'Ingresar y consultar pedido'}
      </Link>
    </main>
  );
}
