'use client';

interface LoginHeroProps {
  title?: string;
  subtitle?: string;
  tips?: string[];
}

const DEFAULT_TIPS = [
  'Usa feedback inmediato para estados de error o carga.',
  'Permite acceso rápido a recuperación de contraseña.',
  'Mantén consistencia visual con el resto del onboarding.',
];

export default function LoginHero({
  title = 'Bienvenido de nuevo',
  subtitle = 'Accede para seguir gestionando tus pedidos, lista de deseos y notificaciones en tiempo real.',
  tips = DEFAULT_TIPS,
}: LoginHeroProps) {
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-indigo-500">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-indigo-500/10 font-semibold">
            M
          </span>
          MyApp
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm text-neutral-500">
        <p className="font-medium text-neutral-400">Consejos de UX</p>
        <ul className="space-y-1 text-neutral-500">
          {tips.map((tip) => (
            <li key={tip}>• {tip}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
