import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de privacidad | MyApp',
  description: 'Como gestionamos tus datos personales y de compra en MyApp.',
};

export default function PrivacidadPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Politica de privacidad</h1>
      <p className="text-sm text-neutral-600">
        Protegemos tus datos personales y solo los usamos para operar tu cuenta, procesar compras y
        enviarte notificaciones relacionadas con el servicio.
      </p>
      <p className="text-sm text-neutral-600">
        Puedes solicitar cambios o eliminacion de datos desde soporte o en las opciones de tu cuenta.
      </p>
    </main>
  );
}
