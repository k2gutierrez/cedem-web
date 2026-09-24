import Image from "next/image";

/**
 * Logotipo CEDEM.
 *
 * `variante="auto"` usa la versión navy sobre fondos claros y la blanca sobre
 * fondos oscuros (el manual prohíbe el wordmark navy sobre fondo oscuro porque
 * desaparece). Ambas versiones tienen fondo transparente.
 *
 * La altura se controla con clases estáticas de Tailwind (no con estilo en
 * línea) para que Next.js no advierta por modificar solo una de las dos
 * dimensiones de la imagen.
 *
 * TODO (Fase 0): sustituir por el SVG cuando CEDEM entregue el vectorial.
 */

/** Alturas permitidas, con su clase equivalente. */
const CLASES_ALTO: Record<number, string> = {
  28: "h-7",
  30: "h-[30px]",
  34: "h-[34px]",
  38: "h-[38px]",
  40: "h-10",
};

/** Proporción real del archivo (1061 × 300). */
const ANCHO_BASE = 1061;
const ALTO_BASE = 300;

export function Logo({
  variante = "auto",
  alto = 40,
  prioridad = false,
  className = "",
}: {
  variante?: "auto" | "navy" | "blanco" | "negro";
  alto?: keyof typeof CLASES_ALTO | number;
  prioridad?: boolean;
  className?: string;
}) {
  const claseAlto = CLASES_ALTO[alto] ?? "h-10";
  const props = {
    alt: "CEDEM · Centro de Dueñez Empresaria",
    width: ANCHO_BASE,
    height: ALTO_BASE,
    priority: prioridad,
  };
  const clases = `w-auto ${claseAlto} ${className}`;

  if (variante !== "auto") {
    const archivo =
      variante === "blanco"
        ? "/brand/cedem-logo-blanco.png"
        : variante === "negro"
          ? "/brand/cedem-logo-negro.png"
          : "/brand/cedem-logo-navy.png";

    return <Image src={archivo} {...props} className={clases} />;
  }

  return (
    <>
      <Image
        src="/brand/cedem-logo-navy.png"
        {...props}
        className={`dark:hidden ${clases}`}
      />
      <Image
        src="/brand/cedem-logo-blanco.png"
        {...props}
        className={`hidden dark:block ${clases}`}
      />
    </>
  );
}
