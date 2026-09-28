import Link from "next/link";
import { Revelar } from "@/components/fx/Efectos";
import { Container } from "@/components/ui/Container";
import { EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { IconoFlecha } from "@/components/ui/Iconos";
import { servicios } from "@/content/site";

/**
 * Las tres puertas de entrada.
 * No se presentan como "servicios" comparables, sino como niveles de
 * acompañamiento: el dueño se autoselecciona por tamaño y etapa.
 *
 * Tres viñetas por puerta y ni una más: la cuarta vive en la página del servicio.
 * Al final hay una salida para quien todavía no sabe cuál le toca.
 */
export function Puertas() {
  return (
    <section id="servicios" className="py-16 lg:py-24">
      <Container>
        <EncabezadoSeccion
          antetitulo="Tres formas de trabajar con CEDEM"
          titulo="¿Con cuál te toca empezar?"
          entrada="El mismo método, con distinta intensidad. Se elige por tamaño de empresa y momento del dueño."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {servicios.map((servicio, i) => (
            <Revelar key={servicio.clave} retraso={i * 0.1} className="flex">
            <article
              className="group relative flex w-full flex-col overflow-hidden rounded-3xl border border-border bg-bg p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan/50 hover:shadow-[var(--sombra-alta)] dark:hover:border-sky/50"
            >
              {/* Filo de acento que aparece al pasar el ratón */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-cyan via-blue to-sky transition-transform duration-500 group-hover:scale-x-100"
              />
              <p className="tagline text-xs text-cyan dark:text-sky">{servicio.etiqueta}</p>
              <h3 className="mt-3 font-display text-2xl font-bold text-fg">
                {servicio.nombre}
              </h3>
              <p className="mt-2 text-xs font-medium text-fg-subtle">
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
            </Revelar>
          ))}
        </div>

        {/* Salida para quien no sabe cuál le toca: el diagnóstico decide por él */}
        <Revelar retraso={0.2}>
          <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-fg-muted">
            <span>¿No sabes cuál te corresponde?</span>
            <Link
              href="/camino"
              className="inline-flex items-center gap-2 font-display text-sm font-semibold text-navy underline-offset-4 hover:text-cyan hover:underline dark:text-sky dark:hover:text-white"
            >
              El Camino del Dueño lo dice en 5 minutos
              <IconoFlecha className="h-4 w-4" />
            </Link>
          </p>
        </Revelar>
      </Container>
    </section>
  );
}
