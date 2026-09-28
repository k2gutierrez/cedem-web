import { Revelar } from "@/components/fx/Efectos";
import { Container } from "@/components/ui/Container";
import { EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { viajeDelDueno } from "@/content/site";

/**
 * Los cuatro momentos del Viaje del Dueño.
 *
 * Es la sección de reconocimiento: el dueño tiene que verse en al menos uno. Por
 * eso cada momento lleva una sola línea y el número va dentro de un nodo, con un
 * segmento de línea que sale hacia el siguiente: en escritorio se lee como una
 * línea de tiempo, no como cuatro tarjetas sueltas.
 */
export function ViajeDelDueno() {
  return (
    <section className="border-y border-border bg-bg-soft py-16 lg:py-24">
      <Container>
        <EncabezadoSeccion
          antetitulo="El viaje del dueño"
          titulo="¿En qué punto estás?"
          entrada="Cuatro momentos. En los cuatro hay método, y en los cuatro el dueño es el mismo."
        />

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {viajeDelDueno.map((momento, i) => (
            <Revelar
              key={momento.titulo}
              como="li"
              retraso={i * 0.08}
              className="group relative flex flex-col rounded-2xl border border-border bg-bg p-6 transition-all hover:-translate-y-1 hover:border-cyan/60 hover:shadow-[var(--sombra-suave)] dark:hover:border-sky/60"
            >
              {/* Nodo + segmento: la línea de tiempo del viaje */}
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cyan/40 bg-bg font-display text-sm font-bold text-cyan dark:border-sky/40 dark:text-sky">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden="true"
                  className="hidden h-px flex-1 bg-gradient-to-r from-cyan/40 to-transparent lg:block"
                />
              </span>

              <h3 className="mt-4 font-display text-lg font-bold text-fg">
                {momento.titulo}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                {momento.texto}
              </p>
            </Revelar>
          ))}
        </ol>
      </Container>
    </section>
  );
}
