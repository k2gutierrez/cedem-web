import { Revelar } from "@/components/fx/Efectos";
import { BarraDeCrecimiento } from "@/components/marketing/graficos/BarraDeCrecimiento";
import { Container } from "@/components/ui/Container";
import { EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { casos } from "@/content/site";

/**
 * Casos en la estructura problema → solución → resultado.
 *
 * Las cifras son declaradas por CEDEM y así se presentan: con honestidad, porque
 * la credibilidad es el activo de la firma. Cada caso trae solo lo necesario para
 * entenderlo en cinco segundos; el detalle largo vive en la conversación.
 *
 * El gráfico de barras aparece únicamente cuando el caso tiene cifras públicas.
 */
export function Casos() {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        <EncabezadoSeccion
          antetitulo="Resultados"
          titulo="El problema, lo que hicimos, qué pasó después"
          entrada="Tres casos con nombre y apellido, y cifras declaradas por las propias empresas."
        />

        <div className="mt-12 space-y-6">
          {casos.map((caso, i) => {
            const crecimiento = "crecimiento" in caso ? caso.crecimiento : null;

            return (
              <Revelar key={caso.empresa} retraso={i * 0.08}>
                <article className="borde-vivo grid gap-6 rounded-3xl border border-border bg-bg p-7 lg:grid-cols-[1fr_1.6fr] lg:gap-10 lg:p-9">
                  <header className="lg:border-r lg:border-border lg:pr-8">
                    <h3 className="font-display text-xl font-bold text-fg">
                      {caso.empresa}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-fg-muted">
                      {caso.persona}
                    </p>
                    <p className="text-xs text-fg-subtle">{caso.cargo}</p>
                    <div className="regla-acento mt-5" />
                  </header>

                  <div>
                    <dl className="grid gap-5 sm:grid-cols-3">
                      <div>
                        <dt className="tagline text-xs text-fg-subtle">El problema</dt>
                        <dd className="mt-2 text-sm leading-relaxed text-fg-muted">
                          {caso.problema}
                        </dd>
                      </div>
                      <div>
                        <dt className="tagline text-xs text-fg-subtle">La solución</dt>
                        <dd className="mt-2 text-sm leading-relaxed text-fg-muted">
                          {caso.solucion}
                        </dd>
                      </div>
                      <div>
                        <dt className="tagline text-xs text-cyan dark:text-sky">
                          El resultado
                        </dt>
                        <dd className="mt-2 text-sm font-medium leading-relaxed text-fg">
                          {caso.resultado}
                        </dd>
                      </div>
                    </dl>

                    {crecimiento ? (
                      <BarraDeCrecimiento
                        inicio={crecimiento.inicio}
                        fin={crecimiento.fin}
                        unidad={crecimiento.unidad}
                        nota={crecimiento.nota}
                        className="border-t border-border pt-5"
                      />
                    ) : null}
                  </div>
                </article>
              </Revelar>
            );
          })}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-fg-subtle">
          * Las cifras de crecimiento son declaraciones de CEDEM y de las empresas
          citadas. El periodo de cada acompañamiento se detalla en cada caso completo.
        </p>
      </Container>
    </section>
  );
}
