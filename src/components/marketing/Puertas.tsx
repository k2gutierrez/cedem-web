import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { IconoFlecha } from "@/components/ui/Iconos";
import { servicios } from "@/content/site";

/**
 * Las tres puertas de entrada.
 * No se presentan como "servicios" comparables, sino como niveles de
 * acompañamiento: el dueño se autoselecciona por tamaño y etapa.
 */
export function Puertas() {
  return (
    <section id="servicios" className="py-16 lg:py-24">
      <Container>
        <EncabezadoSeccion
          antetitulo="Tres formas de trabajar con CEDEM"
          titulo="Elige por el tamaño de tu empresa y tu momento"
          entrada="El mismo método, con distinta intensidad y distinto nivel de acompañamiento. En los tres casos trabajas con la metodología de Dueñez Empresaria."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {servicios.map((servicio) => (
            <article
              key={servicio.clave}
              className="flex flex-col rounded-3xl border border-border bg-bg p-7 transition-shadow hover:shadow-xl hover:shadow-navy/5"
            >
              <p className="tagline text-cyan dark:text-sky">{servicio.etiqueta}</p>
              <h3 className="mt-3 font-display text-2xl font-bold text-fg">
                {servicio.nombre}
              </h3>
              <p className="mt-2 text-[13px] font-medium text-fg-subtle">
                {servicio.segmento}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-fg-muted">
                {servicio.resumen}
              </p>

              <ul className="mt-6 space-y-2.5">
                {servicio.puntos.map((punto) => (
                  <li key={punto} className="flex gap-2.5 text-sm text-fg-muted">
                    <span
                      aria-hidden="true"
                      className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan dark:bg-sky"
                    />
                    {punto}
                  </li>
                ))}
              </ul>

              <Link
                href={servicio.href}
                className="mt-7 inline-flex items-center gap-2 font-display text-sm font-semibold text-navy transition-colors hover:text-cyan dark:text-sky dark:hover:text-white"
              >
                Conocer {servicio.nombre}
                <IconoFlecha className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
