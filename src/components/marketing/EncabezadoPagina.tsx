import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

/**
 * Encabezado de las páginas interiores (Recursos, Equipo, Nosotros…).
 *
 * Replica la jerarquía del hero de las páginas de servicio —ruta, antetítulo,
 * título y entradilla— para que el visitante reconozca el mismo recorrido en
 * todo el sitio. Lo que cambia en cada página entra por `children`.
 */
export function EncabezadoPagina({
  etiqueta,
  antetitulo,
  titulo,
  entrada,
  children,
}: {
  etiqueta: string;
  antetitulo: string;
  titulo: ReactNode;
  entrada: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-bg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-sky/15 blur-3xl dark:bg-cyan/10"
      />
      <Container className="relative py-14 lg:py-20">
        <nav aria-label="Ruta" className="text-[13px] text-fg-subtle">
          <Link href="/" className="hover:text-cyan dark:hover:text-sky">
            Inicio
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-fg-muted">{etiqueta}</span>
        </nav>

        <p className="tagline mt-6 text-cyan dark:text-sky">{antetitulo}</p>
        <h1 className="mt-4 max-w-[46rem] text-h1 text-fg">{titulo}</h1>
        <p className="mt-5 max-w-[56ch] text-lead text-fg-muted">{entrada}</p>

        {children}
      </Container>
    </section>
  );
}
