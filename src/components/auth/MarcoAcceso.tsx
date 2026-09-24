import type { ReactNode } from "react";
import { Revelar } from "@/components/fx/Efectos";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";

/**
 * Marco de las páginas de acceso (entrar, crear cuenta, recuperar contraseña).
 *
 * POR QUÉ UN COMPONENTE Y NO CUATRO MAQUETACIONES
 *
 * Las cuatro pantallas son la misma escena: el logotipo, un titular, un formulario
 * y una salida. Tenían cuatro versiones del mismo fondo con ligeras diferencias,
 * así que cualquier cambio había que hacerlo cuatro veces y siempre quedaba una
 * distinta. Aquí se decide una vez.
 *
 * El fondo es el mismo del sitio público —rejilla técnica y halos de marca— pero
 * más contenido: quien está aquí viene a hacer una cosa concreta y la pantalla no
 * debe distraer.
 */
export function MarcoAcceso({
  titulo,
  entrada,
  children,
  pie,
  ancho = "estrecho",
}: {
  titulo: string;
  entrada?: string;
  children: ReactNode;
  pie?: ReactNode;
  /** `ancho` para el registro, que lleva la lista de beneficios al lado. */
  ancho?: "estrecho" | "ancho";
}) {
  return (
    <section className="relative isolate overflow-hidden py-14 lg:py-20">
      <div
        aria-hidden="true"
        className="rejilla-tecnica rejilla-viva pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky/20 blur-3xl dark:bg-cyan/12"
      />

      <Container size={ancho === "ancho" ? "ancho" : "estrecho"}>
        {ancho === "ancho" ? (
          children
        ) : (
          <Revelar className="mx-auto max-w-[26rem]">
            <div className="flex justify-center">
              <Logo alto={34} />
            </div>

            <h1 className="mt-8 text-center text-h2 text-fg">{titulo}</h1>
            {entrada ? (
              <p className="mt-3 text-center text-sm leading-relaxed text-fg-muted">
                {entrada}
              </p>
            ) : null}

            <div className="cristal mt-8 rounded-3xl p-6 shadow-[var(--sombra-suave)] sm:p-7">
              {children}
            </div>

            {pie ? <div className="mt-8 text-center">{pie}</div> : null}
          </Revelar>
        )}
      </Container>
    </section>
  );
}
