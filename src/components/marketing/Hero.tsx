import { MarcoFoto } from "@/components/marketing/MarcoFoto";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { datosDeMercado, procedenciaDatos } from "@/content/site";

/**
 * Hero de la home.
 *
 * Regla: en 5 segundos el dueño tiene que reconocer su problema. Por eso el
 * titular habla del rol (no de la empresa) y el subtítulo nombra la categoría
 * que CEDEM creó: la Dueñez.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-bg">
      {/* Halo de marca: da profundidad sin ensuciar la legibilidad */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-32 h-[520px] w-[520px] rounded-full bg-sky/20 blur-3xl dark:bg-cyan/10"
      />

      <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
        <div>
          <p className="tagline text-cyan dark:text-sky">El valor de ser dueño</p>

          <h1 className="mt-5 text-display text-fg">
            Diriges una empresa.
            <br />
            <span className="text-navy dark:text-sky">¿Gobiernas tu patrimonio?</span>
          </h1>

          <p className="mt-6 max-w-[52ch] text-lead text-fg-muted">
            La <strong className="font-semibold text-fg">Dueñez</strong> es el rol del
            dueño: definir la razón de ser del negocio, decidir a qué se renuncia y
            asegurar que se cree valor.{" "}
            <strong className="font-semibold text-fg">
              Se puede compartir, pero no se delega.
            </strong>{" "}
            Nadie te enseñó a ejercerlo. Desde 1985 acompañamos a dueños y dueñas a
            hacerlo con método.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <BotonEnlace href="/camino" tamano="lg">
              Empieza tu Camino del Dueño
              <IconoFlecha className="h-4 w-4" />
            </BotonEnlace>
            <BotonEnlace href="/consulting" variante="secundario" tamano="lg">
              Ver Consulting
            </BotonEnlace>
          </div>

          <p className="mt-4 text-sm text-fg-subtle">
            Diagnóstico gratuito de 5 minutos · Sin registro para empezar
          </p>

          {/* Cifras de terceros: sostienen la urgencia sin autobombo */}
          <dl className="mt-12 grid gap-6 border-t border-border pt-8 sm:grid-cols-3">
            {datosDeMercado.map((dato) => (
              <div key={dato.cifra}>
                <dt className="font-display text-3xl font-bold text-navy dark:text-sky">
                  {dato.cifra}
                </dt>
                <dd className="mt-1.5 text-[13px] leading-snug text-fg-muted">
                  {dato.texto}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] uppercase tracking-wider text-fg-subtle">
            {procedenciaDatos}
          </p>
        </div>

        {/* Fotografía. Hoy es un hueco de marca: CEDEM entregará foto propia.
            Ver `MarcoFoto` y docs/07-imagenes-y-fotografia.md. */}
        <div className="relative">
          <MarcoFoto
            alt="Dueña de empresa dirigiendo una reunión de consejo"
            prioridad
            proporcion="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]"
            className="w-full shadow-2xl shadow-navy/25"
          />

          {/* Tarjeta flotante con la promesa del método */}
          <figure className="absolute -bottom-6 -left-4 max-w-[290px] rounded-2xl border border-border bg-bg/95 p-5 shadow-xl backdrop-blur sm:left-6">
            <blockquote className="font-display text-[15px] font-semibold leading-snug text-fg">
              &ldquo;El éxito lo puede tener cualquiera con un poco de suerte, pero
              solo un buen dueño lo repite una y otra vez.&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-xs font-medium text-fg-subtle">
              Carlos A. Dumois · Presidente Fundador
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
