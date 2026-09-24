import Image from "next/image";

/**
 * Logotipo CEDEM.
 *
 * `variante="auto"` usa la versión navy sobre fondos claros y la blanca sobre
 * fondos oscuros (el manual prohíbe el wordmark navy sobre fondo oscuro porque
 * desaparece). Ambas versiones tienen fondo transparente.
 *
 * TODO (Fase 0): sustituir por el SVG cuando CEDEM entregue el vectorial.
 */
export function Logo({
  variante = "auto",
  alto = 40,
  prioridad = false,
  className = "",
}: {
  variante?: "auto" | "navy" | "blanco" | "negro";
  alto?: number;
  prioridad?: boolean;
  className?: string;
}) {
  const ancho = Math.round((alto * 1061) / 300);

  if (variante !== "auto") {
    const archivo =
      variante === "blanco"
        ? "/brand/cedem-logo-blanco.png"
        : variante === "negro"
          ? "/brand/cedem-logo-negro.png"
          : "/brand/cedem-logo-navy.png";

    return (
      <Image
        src={archivo}
        alt="CEDEM · Centro de Dueñez Empresaria"
        width={ancho}
        height={alto}
        priority={prioridad}
        className={className}
        style={{ height: alto, width: "auto" }}
      />
    );
  }

  return (
    <>
      <Image
        src="/brand/cedem-logo-navy.png"
        alt="CEDEM · Centro de Dueñez Empresaria"
        width={ancho}
        height={alto}
        priority={prioridad}
        className={`dark:hidden ${className}`}
        style={{ height: alto, width: "auto" }}
      />
      <Image
        src="/brand/cedem-logo-blanco.png"
        alt="CEDEM · Centro de Dueñez Empresaria"
        width={ancho}
        height={alto}
        priority={prioridad}
        className={`hidden dark:block ${className}`}
        style={{ height: alto, width: "auto" }}
      />
    </>
  );
}
