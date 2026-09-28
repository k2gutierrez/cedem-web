/**
 * El crecimiento de un caso, en dos barras.
 *
 * POR QUÉ EXISTE
 *
 * «20 → 250 MDD» es una cifra que se lee, pero no se siente. Dos barras a escala
 * hacen que el salto se vea de golpe, y de paso obligan a ser honestos: la barra
 * pequeña es el punto de partida real, no un adorno.
 *
 * Los números salen de `src/content/site.ts` y son los que declara CEDEM. Si un
 * caso no trae cifras, este componente no se dibuja: no se inventa nada.
 */
export function BarraDeCrecimiento({
  inicio,
  fin,
  unidad,
  nota,
  className = "",
}: {
  inicio: number;
  fin: number;
  unidad: string;
  nota: string;
  className?: string;
}) {
  const maximo = Math.max(inicio, fin);
  const anchoInicio = Math.max(8, Math.round((inicio / maximo) * 100));
  const anchoFin = Math.max(8, Math.round((fin / maximo) * 100));

  return (
    <figure className={`mt-6 ${className}`}>
      <dl className="space-y-2.5">
        <div className="flex items-center gap-3">
          <dt className="w-[4.5rem] shrink-0 text-xs uppercase tracking-wider text-fg-subtle">
            Antes
          </dt>
          <dd className="flex flex-1 items-center gap-3">
            <span
              aria-hidden="true"
              className="h-3 rounded-full bg-border-strong"
              style={{ width: `${anchoInicio}%` }}
            />
            <span className="font-display text-sm font-semibold text-fg-muted">
              {inicio}
            </span>
          </dd>
        </div>

        <div className="flex items-center gap-3">
          <dt className="w-[4.5rem] shrink-0 text-xs uppercase tracking-wider text-cyan dark:text-sky">
            Después
          </dt>
          <dd className="flex flex-1 items-center gap-3">
            <span
              aria-hidden="true"
              className="h-3 rounded-full bg-gradient-to-r from-cyan to-sky shadow-[0_0_18px_-2px_var(--cedem-cyan)]"
              style={{ width: `${anchoFin}%` }}
            />
            <span className="font-display text-sm font-bold text-fg">{fin}</span>
          </dd>
        </div>
      </dl>

      <figcaption className="mt-3 text-xs text-fg-subtle">
        {unidad} · {nota}
      </figcaption>
    </figure>
  );
}
