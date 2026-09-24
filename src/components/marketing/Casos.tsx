import { Revelar } from "@/components/fx/Efectos";
import { Container } from "@/components/ui/Container";
import { EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { casos } from "@/content/site";

/**
 * Casos en la estructura problema → solución → resultado.
 * Las cifras son declaradas por CEDEM y así se presentan: con honestidad,
 * porque la credibilidad es el activo de la firma.
 */
export function Casos() {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        <EncabezadoSeccion
          antetitulo="Resultados"
          titulo="El problema, lo que hicimos y qué pasó después"
          entrada="Tres casos con nombre y apellido. Los resultados son los que reportan las propias empresas y CEDEM."
        />

        <div className="mt-12 space-y-6">
          {casos.map((caso, i) => (
            <Revelar key={caso.empresa} retraso={i * 0.08}>
            <article
              className="borde-vivo grid gap-6 rounded-3xl border border-border bg-bg p-7 lg:grid-cols-[1fr_1.6fr] lg:gap-10 lg:p-9"
            >
              <header className="lg:border-r lg:border-border lg:pr-8">
                <h3 className="font-display text-xl font-bold text-fg">
                  {caso.empresa}
                </h3>
                <p className="mt-2 text-sm font-medium text-fg-muted">
                  {caso.persona}
                </p>
                <p className="text-[13px] text-fg-subtle">{caso.cargo}</p>
                <div className="regla-acento mt-5" />
              </header>

              <dl className="grid gap-5 sm:grid-cols-3">
                <div>
                  <dt className="tagline text-fg-subtle">El problema</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-fg-muted">
                    {caso.problema}
                  </dd>
                </div>
                <div>
                  <dt className="tagline text-fg-subtle">La solución</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-fg-muted">
                    {caso.solucion}
                  </dd>
                </div>
                <div>
                  <dt className="tagline text-cyan dark:text-sky">El resultado</dt>
                  <dd className="mt-2 text-sm font-medium leading-relaxed text-fg">
                    {caso.resultado}
                  </dd>
                </div>
              </dl>
            </article>
            </Revelar>
          ))}
        </div>

        <p className="mt-6 text-[12.5px] leading-relaxed text-fg-subtle">
          * Las cifras de crecimiento son declaraciones de CEDEM y de las empresas
          citadas. El periodo de cada acompañamiento se detalla en cada caso completo.
        </p>
      </Container>
    </section>
  );
}
