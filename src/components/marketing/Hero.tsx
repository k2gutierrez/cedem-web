import { ContadorAnimado, PalabraRotativa, Revelar, TarjetaInclinada } from "@/components/fx/Efectos";
import { MarcoFoto } from "@/components/marketing/MarcoFoto";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { datosDeMercado, procedenciaDatos } from "@/content/site";

/**
 * Hero de la home.
 *
 * DOS REGLAS QUE NO SE NEGOCIAN
 *
 * 1 · En cinco segundos el dueño tiene que reconocer su problema. Por eso el
 *    titular habla del rol y no de la empresa, y la palabra que rota mantiene la
 *    misma pregunta con tres objetos distintos: patrimonio, legado, empresa.
 * 2 · El movimiento es decorativo. Todo el texto se renderiza en el servidor y se
 *    lee aunque el JavaScript no llegue; lo que añaden los efectos es jerarquía,
 *    no contenido.
 *
 * El fondo es una rejilla técnica que se desplaza muy despacio y un halo de marca.
 * Nada de vídeos ni de imágenes pesadas: la primera pintura sigue siendo texto.
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
              <span className="tagline text-[11px] text-cyan dark:text-sky">
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
            <p className="mt-7 max-w-[52ch] text-lead text-fg-muted">
              La <strong className="font-semibold text-fg">Dueñez</strong> es el rol del
              dueño: definir la razón de ser del negocio, decidir a qué se renuncia y
              asegurar que se cree valor.{" "}
              <strong className="font-semibold text-fg">
                Se puede compartir, pero no se delega.
              </strong>{" "}
              Nadie te enseñó a ejercerlo. Desde 1985 acompañamos a dueños y dueñas a
              hacerlo con método.
            </p>
          </Revelar>

          <Revelar retraso={0.24}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <BotonEnlace href="/camino" tamano="lg" className="barrido">
                Empieza tu Camino del Dueño
                <IconoFlecha className="h-4 w-4" />
              </BotonEnlace>
              <BotonEnlace href="/consulting" variante="secundario" tamano="lg">
                Ver Consulting
              </BotonEnlace>
            </div>

            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-subtle">
              <span>Diagnóstico gratuito de 5 minutos</span>
              <span aria-hidden="true">·</span>
              <span>Sin registro para empezar</span>
              <span aria-hidden="true">·</span>
              <span>Con lectura escrita para tu caso</span>
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
                    <dd className="mt-1.5 text-[13px] leading-snug text-fg-muted">
                      {dato.texto}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-3 text-[11px] uppercase tracking-wider text-fg-subtle">
              {procedenciaDatos}
            </p>
          </Revelar>
        </div>

        {/* Fotografía. Hoy es un hueco de marca: CEDEM entregará foto propia.
            Ver `MarcoFoto` y docs/07-imagenes-y-fotografia.md. */}
        <Revelar retraso={0.2} className="relative">
          <TarjetaInclinada>
            <MarcoFoto
              alt="Dueña de empresa dirigiendo una reunión de consejo"
              prioridad
              proporcion="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]"
              className="w-full shadow-2xl shadow-navy/25"
            />
          </TarjetaInclinada>

          {/* Tarjeta de cristal con la promesa del método */}
          <figure className="cristal absolute -bottom-6 -left-4 max-w-[300px] rounded-2xl p-5 shadow-[var(--sombra-alta)] sm:left-6">
            <span className="brillo-borde absolute inset-x-5 -top-px h-px bg-gradient-to-r from-transparent via-cyan to-transparent" />
            <blockquote className="font-display text-[15px] font-semibold leading-snug text-fg">
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
