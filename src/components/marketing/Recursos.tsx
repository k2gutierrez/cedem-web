import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { IconoFlecha } from "@/components/ui/Iconos";
import { obtenerArticulosDestacados } from "@/lib/datos/contenido";

/**
 * Recursos: la entrada al contenido.
 *
 * Estas tres piezas salen de la base —marcadas como destacadas desde el panel— y
 * enlazan dentro de la plataforma. Antes eran una lista escrita en el código con
 * enlaces al WordPress actual, así que la home dependía de que el sitio viejo
 * siguiera en pie.
 */
export async function Recursos() {
  const articulosDestacados = await obtenerArticulosDestacados();

  return (
    <section className="border-y border-border bg-bg-soft py-16 lg:py-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <EncabezadoSeccion
            antetitulo="Recursos"
            titulo="Para empezar a pensar como dueño"
            entrada="Artículos, podcasts, videos y eventos. Parte del archivo es abierto; el resto es para miembros de CEDEM 2.0."
          />
          <Link
            href="/recursos"
            className="inline-flex items-center gap-2 font-display text-sm font-semibold text-navy transition-colors hover:text-cyan dark:text-sky dark:hover:text-white"
          >
            Ver todos los recursos
            <IconoFlecha className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {articulosDestacados.map((articulo) => (
            <article
              key={articulo.slug}
              className="flex flex-col rounded-2xl border border-border bg-bg p-6 transition-shadow hover:shadow-lg hover:shadow-navy/5"
            >
              <ul className="flex flex-wrap gap-2">
                {articulo.etiquetas.map((etiqueta) => (
                  <li
                    key={etiqueta}
                    className="rounded-full bg-sky/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-navy dark:bg-sky/20 dark:text-sky"
                  >
                    {etiqueta}
                  </li>
                ))}
              </ul>

              <h3 className="mt-4 font-display text-lg font-bold leading-snug text-fg">
                {articulo.titulo}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-fg-muted">
                {articulo.extracto}
              </p>

              <Link
                href={`/recursos/${articulo.slug}`}
                className="mt-5 inline-flex items-center gap-2 font-display text-sm font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
              >
                Leer el artículo
                <IconoFlecha className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
