import type { Metadata } from "next";
import Link from "next/link";
import { EncabezadoPagina } from "@/components/marketing/EncabezadoPagina";
import { TarjetaVideo } from "@/components/marketing/TarjetaVideo";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { IconoFlecha, IconoYouTube } from "@/components/ui/Iconos";
import { bibliotecaMiembros, canalYouTube, serieWebinars, webinars } from "@/content/recursos";
import {
  buscarArticulos,
  obtenerArticulosDestacados,
  obtenerArticulosPublicados,
} from "@/lib/datos/contenido";

export const metadata: Metadata = {
  title: "Recursos · Artículos, webinars y documentos de CEDEM",
  description:
    "El archivo de CEDEM sobre el rol de dueño: artículos abiertos, los ocho webinars de la serie «El Rol de Dueño en Tiempos de Incertidumbre» y la biblioteca de miembros con once documentos metodológicos.",
};

/** El muro, explicado sin rodeos: qué se ve y qué se pide a cambio. */
const muro = [
  {
    titulo: "Abres cualquier pieza del archivo",
    texto:
      "Artículos publicados desde 1985, webinars y documentos metodológicos. Todo el catálogo es visible.",
  },
  {
    titulo: "Lees el primer párrafo",
    texto:
      "Suficiente para saber si el tema te toca. Sin registro, sin correo y sin formulario.",
  },
  {
    titulo: "Si quieres seguir, entras a CEDEM 2.0",
    texto:
      "La lectura completa, los webinars y los once documentos en PDF son para miembros de la plataforma.",
  },
];

const meses = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Fecha legible sin depender del ICU del entorno de compilación. */
function fechaLegible(iso: string): string {
  const [anio, mes, dia] = iso.split("-");
  return `${Number(dia)} de ${meses[Number(mes) - 1]} de ${anio}`;
}

export default async function PaginaRecursos(props: PageProps<"/recursos">) {
  const parametros = await props.searchParams;
  const consulta = typeof parametros.q === "string" ? parametros.q.trim() : "";

  // Si hay búsqueda, se resuelve con el índice de texto completo en español y
  // el resto de la página pasa a segundo plano.
  const [resultados, publicados, articulosDestacados] = await Promise.all([
    consulta ? buscarArticulos(consulta) : Promise.resolve([]),
    consulta ? Promise.resolve([]) : obtenerArticulosPublicados(),
    consulta ? Promise.resolve([]) : obtenerArticulosDestacados(),
  ]);

  return (
    <>
      <EncabezadoPagina
        etiqueta="Recursos"
        antetitulo="El archivo de CEDEM"
        titulo="Lo que hemos escrito y grabado sobre el rol de dueño"
        entrada="Parte del archivo es abierto. El resto es para miembros de CEDEM 2.0: puedes leer el primer párrafo y se te invita a registrarte."
      >
        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <BotonEnlace href="/unete" tamano="lg">
            Unirme a CEDEM 2.0
            <IconoFlecha className="h-4 w-4" />
          </BotonEnlace>
          {/* Ancla dentro de la misma página: no hay ruta que navegar, así que va en <a> */}
          <a
            href="#videos"
            className="inline-flex items-center gap-2 font-display text-sm font-semibold text-navy transition-colors hover:text-cyan sm:ml-3 dark:text-sky dark:hover:text-white"
          >
            Ver los webinars
            <IconoFlecha className="h-4 w-4" />
          </a>
        </div>
      </EncabezadoPagina>

      {/* Buscador del archivo */}
      <section className="border-b border-border bg-bg-soft py-8">
        <Container>
          <form method="get" action="/recursos" className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="q" className="sr-only">
              Buscar en el archivo
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={consulta}
              placeholder="Busca por tema: sucesión, gobierno, abandonar, querencia…"
              className="w-full rounded-full border border-border bg-bg px-5 py-3 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-navy px-6 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-[#0b1856] dark:bg-cyan dark:text-[#04102e]"
            >
              Buscar
            </button>
          </form>
          <p className="mt-3 text-[12.5px] text-fg-subtle">
            Busca en los 186 artículos del archivo. Entiende el español: «sucesion»
            encuentra «sucesión».
          </p>
        </Container>
      </section>

      {/* Resultados de la búsqueda */}
      {consulta ? (
        <section className="py-14 lg:py-20">
          <Container>
            <EncabezadoSeccion
              antetitulo="Resultados"
              titulo={
                resultados.length === 0
                  ? `No encontramos nada sobre «${consulta}»`
                  : `${resultados.length} ${resultados.length === 1 ? "artículo" : "artículos"} sobre «${consulta}»`
              }
              entrada={
                resultados.length === 0
                  ? "Prueba con otra palabra o escríbenos: si no lo hemos escrito, es buena señal de que hace falta."
                  : undefined
              }
            />
            {resultados.length > 0 ? (
              <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {resultados.map((articulo) => (
                  <li key={articulo.slug}>
                    <Link
                      href={`/recursos/${articulo.slug}`}
                      className="flex h-full flex-col rounded-2xl border border-border bg-bg p-6 transition-colors hover:border-cyan/60 dark:hover:border-sky/60"
                    >
                      <span className="font-display text-base font-bold leading-snug text-fg">
                        {articulo.titulo}
                      </span>
                      <span className="mt-2.5 flex-1 text-[13px] leading-relaxed text-fg-muted">
                        {articulo.extracto}
                      </span>
                      {articulo.publicado ? (
                        <span className="mt-4 text-[12px] text-fg-subtle">
                          {new Date(articulo.publicado).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "long",
                          })}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-8">
              <Link
                href="/recursos"
                className="font-display text-sm font-semibold text-navy hover:text-cyan dark:text-sky"
              >
                Ver todo el archivo
              </Link>
            </p>
          </Container>
        </section>
      ) : null}

      {/* El muro */}
      <section className="border-b border-border bg-bg-soft py-14 lg:py-20">
        <Container>
          <EncabezadoSeccion
            antetitulo="Cómo funciona el muro"
            titulo="Abierto hasta donde se puede"
            entrada="Buena parte del archivo es de acceso libre. Lo que queda detrás del muro es el trabajo de la firma y se abre con la membresía."
          />
          <ol className="mt-12 grid gap-6 lg:grid-cols-3">
            {muro.map((paso, i) => (
              <li
                key={paso.titulo}
                className="rounded-2xl border border-border bg-bg p-7"
              >
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 place-items-center rounded-full bg-navy font-display text-sm font-bold text-white dark:bg-cyan dark:text-navy"
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-fg">
                  {paso.titulo}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                  {paso.texto}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Lo último publicado desde el panel */}
      {publicados.length > 0 ? (
        <section className="py-14 lg:py-20">
          <Container>
            <EncabezadoSeccion
              antetitulo="Lo más reciente"
              titulo="Recién salido del horno"
              entrada="Lo que el equipo de CEDEM publicó desde la plataforma. Los marcados como premium muestran solo el primer párrafo."
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {publicados.map((articulo) => (
                <article
                  key={articulo.slug}
                  className="flex flex-col rounded-2xl border border-border bg-bg p-6 transition-shadow hover:shadow-lg hover:shadow-navy/5"
                >
                  <ul className="flex flex-wrap gap-2">
                    <li className="rounded-full bg-sky/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-navy dark:bg-sky/20 dark:text-sky">
                      {articulo.visibilidad === "premium"
                        ? "Solo miembros"
                        : articulo.visibilidad === "free_registrado"
                          ? "Con cuenta gratis"
                          : "Abierto"}
                    </li>
                  </ul>
                  <h3 className="mt-4 font-display text-lg font-bold leading-snug text-fg">
                    {articulo.titulo}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-fg-muted">
                    {articulo.extracto}
                  </p>
                  <Link
                    href={`/recursos/${articulo.slug}`}
                    className="mt-5 inline-flex items-center gap-2 border-t border-border pt-4 font-display text-sm font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
                  >
                    Leer {articulo.esPremium ? "el inicio" : "completo"}
                    <IconoFlecha className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Artículos destacados */}
      <section className="py-14 lg:py-20">
        <Container>
          <EncabezadoSeccion
            antetitulo="Artículos"
            titulo="Tres piezas abiertas, completas"
            entrada="Esta selección se lee sin registro. El resto del archivo vive detrás del muro de miembros."
          />

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

                <p className="mt-5 border-t border-border pt-4 text-[12.5px] leading-relaxed text-fg-subtle">
                  {articulo.publicado ? fechaLegible(articulo.publicado.slice(0, 10)) : ""}
                  {articulo.minutos ? ` · ${articulo.minutos} min de lectura` : ""}
                </p>

                <Link
                  href={`/recursos/${articulo.slug}`}
                  className="mt-4 inline-flex items-center gap-2 font-display text-sm font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
                >
                  Leer el artículo
                  <IconoFlecha className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-bg-soft p-6">
            <p className="text-sm leading-relaxed text-fg-muted">
              Estos tres artículos son la puerta de entrada. El archivo completo se lee
              dentro de la plataforma: abres la pieza, ves el primer párrafo y, si
              quieres seguir,{" "}
              <Link
                href="/unete"
                className="font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
              >
                se te invita a registrarte
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>

      {/* Videos */}
      <section
        id="videos"
        className="scroll-mt-24 border-y border-border bg-bg-soft py-14 lg:py-20"
      >
        <Container>
          <EncabezadoSeccion
            antetitulo="Videos"
            titulo="Ocho webinars sobre el rol de dueño"
            entrada={`Serie «${serieWebinars}», completa y abierta en el canal de CEDEM. Cada sesión dura alrededor de una hora.`}
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {webinars.map((webinar) => (
              <TarjetaVideo
                key={webinar.titulo}
                titulo={webinar.titulo}
                duracion={webinar.duracion}
                serie={serieWebinars}
                href={canalYouTube}
              />
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <BotonEnlace href={canalYouTube} externo tamano="lg">
              <IconoYouTube className="h-4 w-4" />
              Ver el canal completo
            </BotonEnlace>
            <p className="text-[13px] leading-relaxed text-fg-subtle">
              Los webinars se transmiten en vivo y quedan publicados en el canal.
            </p>
          </div>
        </Container>
      </section>

      {/* Podcasts */}
      <section className="py-14 lg:py-20">
        <Container>
          <EncabezadoSeccion antetitulo="Podcasts" titulo="Todavía no hay podcasts" />
          <div className="mt-10 rounded-2xl border border-dashed border-border-strong bg-bg-soft p-8 text-center">
            <p className="mx-auto max-w-[46ch] text-[15px] leading-relaxed text-fg-muted">
              Todavía no publicamos podcasts. Esta sección está lista para cuando el
              equipo los produzca.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-fg-subtle">
              Mientras tanto, los webinars cubren los mismos temas y ya están disponibles.
            </p>
            <a
              href="#videos"
              className="mt-5 inline-flex items-center gap-2 font-display text-sm font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
            >
              Ir a los webinars
              <IconoFlecha className="h-4 w-4" />
            </a>
          </div>
        </Container>
      </section>

      {/* Biblioteca de miembros */}
      <section className="border-t border-border bg-bg-soft py-14 lg:py-20">
        <Container>
          <div className="grid gap-8 rounded-3xl border border-border bg-bg p-8 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:p-12">
            <div>
              <p className="tagline text-cyan dark:text-sky">Biblioteca de miembros</p>
              <h2 className="mt-3 text-h2 text-fg">
                {bibliotecaMiembros.documentos} documentos metodológicos, en PDF
              </h2>
              <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-fg-muted">
                {bibliotecaMiembros.texto} Se descargan desde la plataforma, junto con el
                archivo completo de artículos y los webinars.
              </p>
            </div>
            <div className="lg:justify-self-end">
              <BotonEnlace href="/unete" tamano="lg">
                Entrar a la biblioteca
                <IconoFlecha className="h-4 w-4" />
              </BotonEnlace>
            </div>
          </div>
        </Container>
      </section>

      {/* Cierre */}
      <section className="py-14 lg:py-20">
        <Container>
          <div className="relative overflow-hidden rounded-[32px] bg-navy px-7 py-14 text-white lg:px-16 lg:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-16 h-[380px] w-[380px] rounded-full bg-cyan/25 blur-3xl"
            />

            <div className="relative max-w-[46rem]">
              <p className="tagline text-sky">CEDEM 2.0</p>
              <h2 className="mt-4 text-h2 text-white">
                El archivo completo, con tu diagnóstico
              </h2>
              <p className="mt-5 text-lead text-white/80">
                La membresía abre la lectura completa de los artículos, los webinars y los
                once documentos metodológicos, y te da seguimiento en tu Camino del Dueño.
                Si ya eres cliente de CEDEM, entras por invitación.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <BotonEnlace href="/unete" variante="claro" tamano="lg">
                  Unirme a CEDEM 2.0
                  <IconoFlecha className="h-4 w-4" />
                </BotonEnlace>
                <BotonEnlace
                  href="/contacto"
                  variante="secundario"
                  tamano="lg"
                  className="border-white/40 text-white hover:border-sky hover:text-sky"
                >
                  Hablar con la firma
                </BotonEnlace>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
