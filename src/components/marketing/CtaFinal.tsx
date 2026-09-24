import { Revelar } from "@/components/fx/Efectos";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";

/**
 * Cierre de la home: la conversión principal.
 * Dos caminos: unirse a CEDEM 2.0 (pago o invitación) o hablar con la firma.
 */
export function CtaFinal() {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        <Revelar>
        <div className="relative overflow-hidden rounded-[32px] bg-navy px-7 py-14 text-white lg:px-16 lg:py-20">
          <div
            aria-hidden="true"
            className="rejilla-tecnica pointer-events-none absolute inset-0 opacity-50 [--rejilla:rgba(255,255,255,0.06)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-16 h-[380px] w-[380px] rounded-full bg-cyan/25 blur-3xl"
          />

          <div className="relative max-w-[46rem]">
            <p className="tagline text-sky">CEDEM 2.0</p>
            <h2 className="mt-4 text-h2 text-white">
              Empieza por tu Camino del Dueño
            </h2>
            <p className="mt-5 text-lead text-[#c7d2e8]">
              Un recorrido de cinco minutos que te ayuda a identificar en qué verbo
              estás fallando —generar, multiplicar o capturar valor— y te entrega tus
              primeros pasos concretos. Gratis y sin registro para empezar.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <BotonEnlace href="/camino" variante="claro" tamano="lg">
                Hacer el diagnóstico
                <IconoFlecha className="h-4 w-4" />
              </BotonEnlace>
              <BotonEnlace
                href="/contacto"
                variante="secundario"
                tamano="lg"
                className="border-white/40 text-white hover:border-sky hover:text-sky"
              >
                Hablar con un socio
              </BotonEnlace>
            </div>

            <p className="mt-6 text-sm text-[#a9b8d6]">
              ¿Ya eres cliente de CEDEM? Puedes entrar por invitación.
            </p>
          </div>
        </div>
        </Revelar>
      </Container>
    </section>
  );
}
