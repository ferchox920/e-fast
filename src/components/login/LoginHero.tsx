'use client';

interface LoginHeroProps {
  title?: string;
  subtitle?: string;
  tips?: string[];
}

const DEFAULT_TIPS = [
  'Consulta el estado de tus pedidos desde tu cuenta.',
  'Los importes de la compra se confirman al crear el pedido.',
  'Tu sesión termina al recargar la página.',
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
        <p className="font-medium text-neutral-400">Tu cuenta</p>
        <ul className="space-y-1 text-neutral-500">
          {tips.map((tip) => (
            <li key={tip}>• {tip}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
