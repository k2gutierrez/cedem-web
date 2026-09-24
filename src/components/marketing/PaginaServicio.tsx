import Link from "next/link";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { IconoFlecha } from "@/components/ui/Iconos";
import type { Servicio } from "@/content/servicios";
import { serviciosDetalle } from "@/content/servicios";

/**
 * Plantilla de las páginas de servicio.
 * Estructura común: para quién es → el problema → la solución → el resultado.
 * El contenido cambia por servicio; la estructura no, para que el visitante
 * reconozca el mismo recorrido en las tres puertas.
 */
export function PaginaServicio({ servicio }: { servicio: Servicio }) {
  const otros = Object.values(serviciosDetalle).filter((s) => s.slug !== servicio.slug);

  return (
    <>
      {/* Hero del servicio */}
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
            <span className="text-fg-muted">{servicio.nombre}</span>
          </nav>

          <p className="tagline mt-6 text-cyan dark:text-sky">{servicio.antetitulo}</p>
          <h1 className="mt-4 max-w-[46rem] text-h1 text-fg">{servicio.titulo}</h1>
          <p className="mt-5 max-w-[54ch] text-lead text-fg-muted">{servicio.entrada}</p>

          <p className="mt-6 inline-flex rounded-full border border-border bg-bg-soft px-4 py-2 text-sm font-medium text-fg-muted">
            {servicio.segmento}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BotonEnlace href="/contacto" tamano="lg">
              Solicitar información
              <IconoFlecha className="h-4 w-4" />
            </BotonEnlace>
            <BotonEnlace href="/unete" variante="secundario" tamano="lg">
              Hacer el diagnóstico
            </BotonEnlace>
          </div>

          <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {servicio.datosClave.map((dato) => (
              <div key={dato.etiqueta} className="bg-bg p-5">
                <dt className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
                  {dato.etiqueta}
                </dt>
                <dd className="mt-1.5 font-display text-[15px] font-semibold text-fg">
                  {dato.valor}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Para quién es */}
      <section className="py-14 lg:py-20">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <EncabezadoSeccion
            antetitulo="Para quién es"
            titulo="Esto es para ti si te reconoces aquí"
          />
          <div>
            <ul className="space-y-4">
              {servicio.paraQuien.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-fg-muted">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan dark:bg-sky"
                  />
                  {item}
                </li>
              ))}
            </ul>

            {servicio.noEsParaQuien ? (
              <div className="mt-8 rounded-2xl border border-border bg-bg-soft p-6">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-fg-subtle">
                  No es para ti si…
                </h3>
                <ul className="mt-4 space-y-3">
                  {servicio.noEsParaQuien.map((item) => (
                    <li key={item} className="text-sm leading-relaxed text-fg-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Container>
      </section>

      {/* El problema */}
      <section className="border-y border-border bg-bg-soft py-14 lg:py-20">
        <Container>
          <EncabezadoSeccion
            antetitulo="El problema"
            titulo="Lo que le pasa a un dueño que llega hasta aquí"
            entrada="No son problemas de gestión. Son problemas de Dueñez: de quién decide, con qué criterio y para qué."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {servicio.problema.map((item, i) => (
              <article
                key={item.titulo}
                className="rounded-2xl border border-border bg-bg p-7"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-sm font-bold text-cyan/70 dark:text-sky/70"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-lg font-bold text-fg">
                  {item.titulo}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">{item.texto}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* La solución */}
      <section className="py-14 lg:py-20">
        <Container>
          <EncabezadoSeccion
            antetitulo="La solución"
            titulo="Cómo trabajamos"
            entrada="El método es el mismo en toda la firma. Lo que cambia es la profundidad y quién lo aplica."
          />
          <ol className="mt-12 space-y-4">
            {servicio.solucion.map((paso, i) => (
              <li
                key={paso.titulo}
                className="grid gap-4 rounded-2xl border border-border bg-bg p-7 lg:grid-cols-[auto_1fr] lg:gap-8"
              >
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 place-items-center rounded-full bg-navy font-display text-sm font-bold text-white dark:bg-cyan dark:text-[#04102e]"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-fg">{paso.titulo}</h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-fg-muted">
                    {paso.texto}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* El resultado */}
      <section className="border-y border-border bg-bg-soft py-14 lg:py-20">
        <Container>
          <EncabezadoSeccion
            antetitulo="El resultado"
            titulo="Qué cambia cuando la Dueñez se ejerce"
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {servicio.resultados.map((resultado) => (
              <article
                key={resultado.cifra}
                className="rounded-2xl border border-border bg-bg p-7"
              >
                <p className="font-display text-3xl font-bold text-navy dark:text-sky">
                  {resultado.cifra}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  {resultado.texto}
                </p>
                <p className="mt-4 text-[11px] uppercase tracking-wider text-fg-subtle">
                  {resultado.fuente}
                </p>
              </article>
            ))}
          </div>

          {servicio.testimonio ? (
            <figure className="mt-10 rounded-3xl bg-navy p-8 text-white lg:p-12">
              <blockquote className="max-w-[52rem] font-display text-xl font-semibold leading-snug lg:text-2xl">
                &ldquo;{servicio.testimonio.texto}&rdquo;
              </blockquote>
              <figcaption className="mt-6 text-sm text-[#a9b8d6]">
                <span className="font-semibold text-white">
                  {servicio.testimonio.autor}
                </span>{" "}
                · {servicio.testimonio.cargo}
              </figcaption>
            </figure>
          ) : null}
        </Container>
      </section>

      {/* Cierre */}
      <section className="py-14 lg:py-20">
        <Container>
          <div className="rounded-[28px] border border-border bg-bg-soft p-8 lg:p-12">
            <h2 className="max-w-[38rem] text-h2 text-fg">{servicio.ctaTitulo}</h2>
            <p className="mt-4 max-w-[52ch] text-lead text-fg-muted">{servicio.ctaTexto}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <BotonEnlace href="/contacto" tamano="lg">
                Hablar con CEDEM
                <IconoFlecha className="h-4 w-4" />
              </BotonEnlace>
              <BotonEnlace href="/unete" variante="secundario" tamano="lg">
                Unirme a CEDEM 2.0
              </BotonEnlace>
            </div>
          </div>

          {/* Navegación entre puertas */}
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {otros.map((otro) => (
              <Link
                key={otro.slug}
                href={`/${otro.slug}`}
                className="group rounded-2xl border border-border p-6 transition-colors hover:border-cyan/60 dark:hover:border-sky/60"
              >
                <p className="tagline text-fg-subtle">{otro.antetitulo}</p>
                <p className="mt-2 font-display text-lg font-bold text-fg group-hover:text-cyan dark:group-hover:text-sky">
                  {otro.nombre}
                </p>
                <p className="mt-2 text-sm text-fg-muted">{otro.segmento}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
