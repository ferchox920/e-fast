'use client';

interface LoginHeroProps {
  title?: string;
  subtitle?: string;
  tips?: string[];
  highlights?: Array<{
    title: string;
    description: string;
  }>;
}

const DEFAULT_HIGHLIGHTS = [
  {
    title: 'Pedidos al día',
    description: 'Consulta estados, entregas y devoluciones sin salir de tu cuenta.',
  },
  {
    title: 'Favoritos listos',
    description: 'Recupera productos guardados y retoma la compra en segundos.',
  },
  {
    title: 'Novedades relevantes',
    description: 'Recibe alertas útiles y beneficios pensados para volver con confianza.',
  },
];

export default function LoginHero({
  title = 'Todo lo que importa de tu compra, en un acceso claro.',
  subtitle = 'Entra para seguir tus pedidos, revisar guardados y mantener el historial de tu cuenta siempre a mano.',
  tips,
  highlights = DEFAULT_HIGHLIGHTS,
}: LoginHeroProps) {
  const items =
    tips && tips.length > 0
      ? tips.map((tip) => ({
          title: tip,
          description: 'Diseñado para que el acceso se sienta claro, confiable y consistente.',
        }))
      : highlights;

  return (
    <>
      <div className="space-y-8">
        <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/72 backdrop-blur-sm">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-white/14 text-sm font-semibold text-white">
            M
          </span>
          MyApp
        </div>
        <div className="max-w-xl space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-white/48">Acceso privado</p>
          <h2 className="text-4xl leading-tight font-semibold text-white sm:text-5xl [font-family:var(--font-fraunces)]">
            {title}
          </h2>
          <p className="max-w-lg text-sm leading-7 text-white/74 sm:text-base">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.28em] text-white/48">
          Lo que encuentras al entrar
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {items.map((highlight) => (
            <li
              key={highlight.title}
              className="rounded-[24px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm"
            >
              <p className="text-sm font-semibold text-white">{highlight.title}</p>
              <p className="mt-2 text-sm leading-6 text-white/68">{highlight.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
