import Link from "next/link";
import type { ReactNode } from "react";
import { Revelar } from "@/components/fx/Efectos";
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
    <section className="relative isolate overflow-hidden border-b border-border bg-bg">
      {/* Misma rejilla y mismos halos que el hero: el visitante reconoce que
          sigue en el mismo sitio, no en una página suelta. */}
      <div
        aria-hidden="true"
        className="rejilla-tecnica rejilla-viva pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 -z-10 h-[460px] w-[460px] rounded-full bg-sky/20 blur-3xl dark:bg-cyan/12"
      />
      <Container className="relative py-14 lg:py-20">
        <nav aria-label="Ruta" className="text-sm text-fg-subtle">
          <Link href="/" className="hover:text-cyan dark:hover:text-sky">
            Inicio
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-fg-muted">{etiqueta}</span>
        </nav>

        <Revelar>
          <p className="tagline mt-6 text-cyan dark:text-sky">{antetitulo}</p>
          <h1 className="mt-4 max-w-[46rem] text-h1 text-fg">{titulo}</h1>
          <p className="mt-5 max-w-[56ch] text-lead text-fg-muted">{entrada}</p>
        </Revelar>

        {children}
      </Container>
    </section>
  );
}
