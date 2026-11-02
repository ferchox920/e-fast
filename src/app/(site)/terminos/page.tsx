import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terminos y condiciones | MyApp',
  description: 'Condiciones de uso, compra, envios y devoluciones de MyApp.',
};

export default function TerminosPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Terminos y condiciones</h1>
      <p className="text-sm text-neutral-600">
        Al comprar en MyApp aceptas nuestras condiciones de uso, politicas de pago, envio y devolucion.
      </p>
      <p className="text-sm text-neutral-600">
        Los plazos y costos pueden variar segun zona de entrega y disponibilidad de stock.
      </p>
    </main>
  );
}
