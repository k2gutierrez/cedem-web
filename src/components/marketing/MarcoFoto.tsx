import Image from "next/image";
import { rutaDeArchivo } from "@/lib/fotos-locales";

/**
 * Marco de fotografía con el duotono de marca.
 *
 * DOS FORMAS DE USARLO
 *
 *   <MarcoFoto archivo="hero-consejo.jpg" … />   la foto de `public/fotos/`
 *   <MarcoFoto src="/fotos/otra.jpg" … />        una ruta ya armada
 *
 * Si el archivo todavía no existe, cae en un **hueco de marca**: un bloque con la
 * retícula del manual y el isotipo. Es deliberado que se vea como un hueco y no
 * como una foto: así nadie publica el sitio creyendo que ahí ya hay una imagen
 * definitiva. El día que llegue la foto, se deja en `public/fotos/` con el nombre
 * exacto y aparece sola, sin tocar código (lo resuelve el manifiesto que se genera
 * al compilar: ver `scripts/generar-manifiesto-fotos.mjs`).
 *
 * Decisión de Carlos: no generar imágenes con IA desde aquí ni gastar recursos en
 * esto. Las fotos se piden con los prompts de `docs/21-prompts-de-imagenes.md` y
 * salen de su archivo (eventos, equipo, oficinas).
 */
export function MarcoFoto({
  archivo,
  src,
  alt,
  className = "",
  sizes = "(max-width: 1024px) 100vw, 45vw",
  prioridad = false,
  proporcion = "aspect-[4/5]",
}: {
  /** Nombre del archivo dentro de `public/fotos/`, con extensión. */
  archivo?: string;
  /** Ruta pública completa. Tiene prioridad sobre `archivo`. */
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
  prioridad?: boolean;
  proporcion?: string;
}) {
  const ruta = src ?? (archivo ? rutaDeArchivo(archivo) : undefined);

  if (!ruta) {
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
          <p className="max-w-[26ch] text-xs leading-relaxed text-white/50">
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
        src={ruta}
        alt={alt}
        fill
        priority={prioridad}
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
