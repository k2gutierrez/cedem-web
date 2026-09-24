import Image from "next/image";

/**
 * Marco de fotografía con el duotono de marca.
 *
 * Mientras CEDEM no entregue fotografía propia, cae en un **placeholder de
 * marca**: un bloque con la retícula del manual y el isotipo. Es deliberado que
 * se vea como un hueco y no como una foto: así nadie publica el sitio creyendo
 * que ahí ya hay una imagen definitiva.
 *
 * Decisión de Carlos: no generar imágenes con IA ni gastar recursos en esto
 * ahora. Las fotos definitivas salen de su archivo (eventos, equipo, oficinas).
 */
export function MarcoFoto({
  src,
  alt,
  className = "",
  sizes = "(max-width: 1024px) 100vw, 45vw",
  prioridad = false,
  proporcion = "aspect-[4/5]",
}: {
  /** Ruta en /public. Si falta, se dibuja el placeholder. */
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
  prioridad?: boolean;
  proporcion?: string;
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={`${alt} — fotografía pendiente`}
        className={`relative overflow-hidden rounded-[28px] bg-navy ${proporcion} ${className}`}
      >
        {/* Retícula del manual */}
        <svg
          className="absolute inset-0 h-full w-full text-white/[0.07]"
          aria-hidden="true"
        >
          <defs>
            <pattern id="retricula-cedem" width="34" height="34" patternUnits="userSpaceOnUse">
              <path d="M34 0H0v34" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#retricula-cedem)" />
        </svg>

        <div className="relative flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
          {/* Isotipo del manual */}
          <svg viewBox="0 0 300 300" className="h-16 w-16 fill-white/25" aria-hidden="true">
            <path d="M40 20v260l150-130z" />
            <path d="M190 20v260l70-130z" />
          </svg>
          <p className="tagline text-sky/70">Fotografía pendiente</p>
          <p className="max-w-[26ch] text-[13px] leading-relaxed text-white/50">
            {alt}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`duotono-marco relative overflow-hidden rounded-[28px] ${proporcion} ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={prioridad}
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
