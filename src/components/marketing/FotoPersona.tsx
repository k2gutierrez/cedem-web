import { urlDeFoto } from "@/lib/fotos";

/**
 * La foto de una persona, o sus iniciales mientras no haya foto.
 *
 * POR QUÉ EXISTE LA ALTERNATIVA
 *
 * Un hueco con una foto borrosa se ve peor que un avatar limpio, y durante meses
 * el equipo de CEDEM no tendrá fotos para todos. Así que el mismo componente
 * resuelve los dos casos: si hay foto la muestra, y si no, pinta las iniciales
 * sobre el navy de la marca. Nunca queda un espacio vacío.
 *
 * Las iniciales son decorativas —el nombre siempre va al lado— así que no se
 * anuncian al lector de pantalla. La foto tampoco: el nombre ya está en el texto,
 * y anunciar «foto de Ana» antes de «Ana» solo alarga la lectura.
 */
export function FotoPersona({
  nombre,
  ruta,
  tamano = "md",
  className = "",
}: {
  nombre: string;
  /** Ruta dentro del bucket `avatars`, o una URL completa. */
  ruta: string | null | undefined;
  /** `sm` en listados, `md` en tarjetas, `lg` en la ficha. */
  tamano?: "sm" | "md" | "lg";
  className?: string;
}) {
  const url = urlDeFoto(ruta);

  const medidas = {
    sm: "h-12 w-12 text-base",
    md: "h-16 w-16 text-lg",
    lg: "h-28 w-28 text-2xl",
  }[tamano];

  if (url) {
    return (
      <span
        className={`relative ${medidas} shrink-0 overflow-hidden rounded-full ring-1 ring-sky/25 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- el bucket público sirve la imagen ya optimizada al subirla */}
        <img
          src={url}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`grid ${medidas} shrink-0 place-items-center rounded-full bg-navy font-display font-bold tracking-wide text-white ring-1 ring-sky/25 ${className}`}
    >
      {iniciales(nombre)}
    </span>
  );
}

/** Primera letra del nombre y del apellido; ignora iniciales sueltas como "A.". */
function iniciales(nombre: string): string {
  const palabras = nombre
    .split(/\s+/)
    .filter((palabra) => palabra.replace(/\./g, "").length > 1);

  const primera = palabras[0]?.charAt(0) ?? "";
  const ultima = palabras.length > 1 ? palabras[palabras.length - 1].charAt(0) : "";

  return `${primera}${ultima}`.toUpperCase();
}
