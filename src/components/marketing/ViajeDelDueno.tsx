import { Container } from "@/components/ui/Container";
import { EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { viajeDelDueno } from "@/content/site";

/**
 * Los cuatro momentos del Viaje del Dueño.
 * Es la sección de reconocimiento: el dueño tiene que verse en al menos uno.
 */
export function ViajeDelDueno() {
  return (
    <section className="border-y border-border bg-bg-soft py-16 lg:py-24">
      <Container>
        <EncabezadoSeccion
          antetitulo="El viaje del dueño"
          titulo="¿En qué punto de tu viaje estás?"
          entrada="Acompañamos al dueño en todas las etapas. Si te reconoces en alguno de estos momentos, hay método para salir."
        />

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {viajeDelDueno.map((momento, i) => (
            <li
              key={momento.titulo}
              className="group relative flex flex-col rounded-2xl border border-border bg-bg p-6 transition-colors hover:border-cyan/60 dark:hover:border-sky/60"
            >
              <span
                aria-hidden="true"
                className="font-display text-sm font-bold text-cyan/70 dark:text-sky/70"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold text-fg">
                {momento.titulo}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                {momento.texto}
              </p>
              <span
                aria-hidden="true"
                className="mt-5 h-[3px] w-10 rounded-full bg-gradient-to-r from-cyan to-sky transition-all duration-300 group-hover:w-16"
              />
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
