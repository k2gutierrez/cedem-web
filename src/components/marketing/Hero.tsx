import { ContadorAnimado, PalabraRotativa, Revelar, TarjetaInclinada } from "@/components/fx/Efectos";
import { MarcoFoto } from "@/components/marketing/MarcoFoto";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { datosDeMercado, procedenciaDatos } from "@/content/site";

/**
 * Hero de la home.
 *
 * TRES REGLAS QUE NO SE NEGOCIAN
 *
 * 1 · En cinco segundos el dueño tiene que reconocer su problema. Por eso el
 *    titular habla del rol y no de la empresa, y la palabra que rota mantiene la
 *    misma pregunta con tres objetos distintos: patrimonio, legado, futuro.
 * 2 · Nada que explicar. La entradilla son dos frases: la definición de Dueñez y
 *    la promesa. Lo demás lo cuenta la página más abajo.
 * 3 · El movimiento es decorativo. Todo el texto se renderiza en el servidor y se
 *    lee aunque el JavaScript no llegue.
 *
 * La foto se busca en `public/fotos/hero-consejo.jpg`. Mientras ese archivo no
 * exista, `MarcoFoto` dibuja el hueco de marca: el sitio se puede publicar sin
 * fotos y el día que lleguen basta con dejarlas en su carpeta.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-bg">
      {/* Rejilla técnica con la deriva lenta del sistema de diseño */}
      <div
        aria-hidden="true"
        className="rejilla-tecnica rejilla-viva pointer-events-none absolute inset-0 -z-10"
      />

      {/* Halos de marca: dan profundidad y sostienen la lectura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-40 -z-10 h-[560px] w-[560px] rounded-full bg-sky/25 blur-3xl dark:bg-cyan/12"
      />
      <div
        aria-hidden="true"
        className="latido pointer-events-none absolute -left-32 top-40 -z-10 h-[380px] w-[380px] rounded-full bg-blue/10 blur-3xl dark:bg-blue/20"
      />

      <Container className="relative grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
        <div>
          <Revelar>
            <p className="inline-flex items-center gap-3 rounded-full border border-border bg-bg/70 px-4 py-2 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
              </span>
              <span className="tagline text-xs text-cyan dark:text-sky">
                El valor de ser dueño · Desde 1985
              </span>
            </p>
          </Revelar>

          <Revelar retraso={0.08}>
            <h1 className="mt-6 text-display text-fg">
              Diriges una empresa.
              <br />
              ¿Gobiernas tu{" "}
              <PalabraRotativa
                palabras={["patrimonio?", "legado?", "futuro?", "empresa?"]}
              />
            </h1>
          </Revelar>

          <Revelar retraso={0.16}>
            <p className="mt-7 max-w-[46ch] text-lead text-fg-muted">
              La <strong className="font-semibold text-fg">Dueñez</strong> es el rol del
              dueño: definir para qué existe el negocio, a qué se renuncia y cómo se crea
              valor.{" "}
              <strong className="font-semibold text-fg">
                Se puede compartir, no se delega.
              </strong>{" "}
              Desde 1985 acompañamos a dueños y dueñas a ejercerlo con método.
            </p>
          </Revelar>

          <Revelar retraso={0.24}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <BotonEnlace href="/camino" tamano="lg" className="barrido">
                Hacer el Camino del Dueño
                <IconoFlecha className="h-4 w-4" />
              </BotonEnlace>
              <BotonEnlace href="/consulting" variante="secundario" tamano="lg">
                Ver Consulting
              </BotonEnlace>
            </div>

            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-subtle">
              <span>5 minutos</span>
              <span aria-hidden="true">·</span>
              <span>Gratis y sin registro</span>
              <span aria-hidden="true">·</span>
              <span>Con una lectura escrita para tu caso</span>
            </p>
          </Revelar>

          {/* Cifras de terceros: sostienen la urgencia sin autobombo */}
          <Revelar retraso={0.32}>
            <dl className="mt-12 grid gap-6 border-t border-border pt-8 sm:grid-cols-3">
              {datosDeMercado.map((dato) => {
                const numero = Number(dato.cifra.replace("%", ""));
                return (
                  <div key={dato.cifra} className="group">
                    <dt className="font-display text-3xl font-bold text-navy transition-colors group-hover:text-cyan dark:text-sky">
                      {Number.isFinite(numero) ? (
                        <ContadorAnimado valor={numero} sufijo="%" />
                      ) : (
                        dato.cifra
                      )}
                    </dt>
                    <dd className="mt-1.5 text-xs leading-snug text-fg-muted">
                      {dato.texto}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-3 text-xs uppercase tracking-wider text-fg-subtle">
              {procedenciaDatos}
            </p>
          </Revelar>
        </div>

        {/* Fotografía: `public/fotos/hero-consejo.jpg`. Mientras no exista, hueco
            de marca. Ver docs/07-imagenes-y-fotografia.md y docs/21-prompts-de-imagenes.md. */}
        <Revelar retraso={0.2} className="relative">
          <TarjetaInclinada>
            <MarcoFoto
              archivo="hero-consejo.jpg"
              alt="Dueña de empresa dirigiendo una reunión de consejo"
              prioridad
              proporcion="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]"
              className="w-full shadow-2xl shadow-navy/25"
            />
          </TarjetaInclinada>

          {/* Tarjeta de cristal con la promesa del método */}
          <figure className="cristal absolute -bottom-6 -left-4 max-w-[300px] rounded-2xl p-5 shadow-[var(--sombra-alta)] sm:left-6">
            <span className="brillo-borde absolute inset-x-5 -top-px h-px bg-gradient-to-r from-transparent via-cyan to-transparent" />
            <blockquote className="font-display text-sm font-semibold leading-snug text-fg">
              &ldquo;El éxito lo puede tener cualquiera con un poco de suerte, pero
              solo un buen dueño lo repite una y otra vez.&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-xs font-medium text-fg-subtle">
              Carlos A. Dumois · Presidente Fundador
            </figcaption>
          </figure>
        </Revelar>
      </Container>
    </section>
  );
}
