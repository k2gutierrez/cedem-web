import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "primario" | "secundario" | "fantasma" | "claro";
type Tamano = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none";

const variantes: Record<Variante, string> = {
  /* Sobre fondos claros y oscuros: el navy de marca es el botón de acción */
  primario:
    "bg-navy text-white hover:bg-[#0b1856] dark:bg-cyan dark:text-[#04102e] dark:hover:bg-sky",
  /* Contorno: para acciones secundarias */
  secundario:
    "border border-border-strong text-fg hover:border-cyan hover:text-cyan dark:hover:border-sky dark:hover:text-sky",
  /* Sin caja: enlaces de acción dentro de texto */
  fantasma: "text-accent hover:underline underline-offset-4 px-0",
  /* Para usar SOBRE un bloque navy */
  claro: "bg-white text-navy hover:bg-sky",
};

const tamanos: Record<Tamano, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export function Boton({
  children,
  variante = "primario",
  tamano = "md",
  className = "",
  ...props
}: {
  children: ReactNode;
  variante?: Variante;
  tamano?: Tamano;
} & ComponentProps<"button">) {
  return (
    <button
      className={`${base} ${variantes[variante]} ${tamanos[tamano]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BotonEnlace({
  children,
  href,
  variante = "primario",
  tamano = "md",
  className = "",
  externo = false,
}: {
  children: ReactNode;
  href: string;
  variante?: Variante;
  tamano?: Tamano;
  className?: string;
  externo?: boolean;
}) {
  const clases = `${base} ${variantes[variante]} ${tamanos[tamano]} ${className}`;

  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={clases}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={clases}>
      {children}
    </Link>
  );
}
