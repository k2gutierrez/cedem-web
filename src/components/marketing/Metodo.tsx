import { Revelar } from "@/components/fx/Efectos";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { metodo } from "@/content/site";

/**
 * El método: los tres verbos.
 * Va sobre fondo navy a sangre porque es el bloque que declara la categoría.
 */
export function Metodo() {
  return (
    <section className="relative overflow-hidden bg-navy py-16 text-white lg:py-24">
      {/* Rejilla técnica clara: en navy da el aire de sistema, no de decoración */}
      <div
        aria-hidden="true"
        className="rejilla-tecnica rejilla-viva pointer-events-none absolute inset-0 opacity-40 [--rejilla:rgba(255,255,255,0.07)]"
      />
      {/* Isotipo a gran escala como elemento gráfico, tal como lo usa el manual */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-1/2 hidden -translate-y-1/2 opacity-[0.07] lg:block"
      >
        <svg viewBox="0 0 300 300" className="h-[420px] w-[420px] fill-white">
          <path d="M40 20v260l150-130z" />
          <path d="M190 20v260l70-130z" />
        </svg>
      </div>

      <Container className="relative">
        <Revelar>
        <p className="tagline text-sky">La metodología</p>
        <h2 className="mt-3 max-w-[38rem] text-h2 text-white">
          Generar, multiplicar y capturar valor
        </h2>
        <p className="mt-4 max-w-[52ch] text-lead text-[#c7d2e8]">
          El valor no se crea de una sola vez. Primero se genera en el mercado, luego se
          multiplica en la organización y por último se captura. La Dueñez es quien
          responde por los tres movimientos.
        </p>
        </Revelar>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-white/15 lg:grid-cols-3">
          {metodo.map((paso, i) => (
            <Revelar key={paso.verbo} retraso={i * 0.12} className="bg-navy">
            <li className="group h-full bg-navy p-7 transition-colors duration-500 hover:bg-navy-deep lg:p-8">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-xs font-bold text-sky">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-2xl font-bold text-white">
                  {paso.verbo}
                </h3>
              </div>
              <p className="mt-2 text-[13px] uppercase tracking-[0.14em] text-sky">
                {paso.marco}
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-white/15 pt-5">
                {paso.componentes.map((componente) => (
                  <li
                    key={componente}
                    className="flex items-start gap-2.5 text-sm text-[#dbe4f7]"
                  >
                    <IconoFlecha
                      className="mt-[3px] h-4 w-4 shrink-0 text-sky"
                      aria-hidden="true"
                    />
                    {componente}
                  </li>
                ))}
              </ul>

              <p className="mt-6 border-l-2 border-cyan pl-4 font-display text-sm italic leading-relaxed text-white/90">
                {paso.idea}
              </p>
            </li>
            </Revelar>
          ))}
        </ol>

        <p className="mt-10 max-w-[60ch] text-sm text-[#a9b8d6]">
          &ldquo;Dueñez®&rdquo; es una marca registrada por Carlos A. Dumois Núñez.
        </p>
      </Container>
    </section>
  );
}
