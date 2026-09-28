import { IconoFlecha } from "@/components/ui/Iconos";

/**
 * Tarjeta de un webinar de la serie de CEDEM.
 * Todos los webinars viven en el canal de YouTube de la firma, así que la
 * tarjeta entera es el enlace: no hay página intermedia que inventar.
 */
export function TarjetaVideo({
  titulo,
  duracion,
  serie,
  href,
}: {
  titulo: string;
  duracion: string;
  serie: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl border border-border bg-bg p-6 transition-colors hover:border-cyan/60 dark:hover:border-sky/60"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-navy text-white transition-colors group-hover:bg-cyan dark:bg-cyan dark:text-navy dark:group-hover:bg-sky">
          <IconoReproducir className="h-4 w-4" />
        </span>
        <span className="rounded-full bg-sky/15 px-2.5 py-1 font-display text-xs font-semibold tabular-nums tracking-wider text-navy dark:bg-sky/20 dark:text-sky">
          {duracion}
        </span>
      </div>

      <h3 className="mt-5 flex-1 font-display text-lg font-bold leading-snug text-fg">
        {titulo}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-subtle">{serie}</p>

      <span className="mt-5 inline-flex items-center gap-2 font-display text-sm font-semibold text-navy group-hover:text-cyan dark:text-sky dark:group-hover:text-white">
        Ver en YouTube
        <IconoFlecha className="h-4 w-4" />
      </span>
    </a>
  );
}

/** Triángulo de reproducción. Se dibuja aquí para no tocar Iconos.tsx. */
function IconoReproducir({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 5.2v13.6L19 12z" />
    </svg>
  );
}
