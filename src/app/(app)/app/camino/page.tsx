import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { TarjetaDiagnostico } from "@/components/app/TarjetaDiagnostico";
import { obtenerSesion } from "@/lib/auth/sesion";
import { obtenerMisDiagnosticos } from "@/lib/datos/camino";
import { articulosDe } from "@/lib/datos/recomendaciones";

export const metadata: Metadata = {
  title: "Mi Camino",
  robots: { index: false, follow: false },
};

/**
 * El historial del Camino del Dueño.
 *
 * La plataforma promete «el seguimiento de tu Camino del Dueño» en media docena
 * de páginas del sitio: aquí es donde se cumple. Antes esta ruta no existía —el
 * menú del panel apuntaba a ella y daba 404— y el panel decía «todavía no has
 * hecho tu Camino» incluso a quien ya lo había hecho, porque nadie leía
 * `journey_sessions`.
 */
export default async function PaginaMiCamino() {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) redirect("/acceso?destino=/app/camino");

  const diagnosticos = await obtenerMisDiagnosticos();

  // Los artículos recomendados se resuelven una sola vez para todo el historial:
  // si el artículo ya vive en la plataforma se enlaza aquí dentro, y si no, se
  // deja el enlace al sitio anterior (que la plataforma redirige igual).
  const recomendaciones = await articulosDe(
    diagnosticos.map((d) => d.perfil.arquetipo),
  );

  return (
    <Container>
      <p className="tagline text-cyan dark:text-sky">CEDEM 2.0</p>
      <h1 className="mt-3 text-h1 text-fg">Mi Camino del Dueño</h1>
      <p className="mt-4 max-w-[58ch] text-lead text-fg-muted">
        Cada recorrido que haces queda aquí: en qué verbo se te está atorando el valor, qué
        lo está frenando y qué te llevaste para trabajar esa semana.
      </p>

      <div className="mt-8">
        <BotonEnlace href="/camino" tamano="lg">
          {diagnosticos.length ? "Volver a hacer el Camino" : "Hacer mi Camino del Dueño"}
          <IconoFlecha className="h-4 w-4" />
        </BotonEnlace>
      </div>

      {diagnosticos.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-bg p-8">
          <p className="font-display text-base font-bold text-fg">
            Todavía no has hecho tu Camino del Dueño
          </p>
          <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-fg-muted">
            Cinco minutos, quince preguntas y ninguna sobre tu contabilidad. Al terminar
            sabrás en qué verbo se te está atorando el valor y te llevas tres cosas para
            leer y tres para hacer esta semana.
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-5">
          {diagnosticos.map((diagnostico, indice) => (
            <TarjetaDiagnostico
              key={diagnostico.id}
              diagnostico={diagnostico}
              recomendaciones={recomendaciones.get(diagnostico.perfil.arquetipo) ?? []}
              abierto={indice === 0}
            />
          ))}
        </div>
      )}

      <p className="mt-10 text-xs leading-relaxed text-fg-subtle">
        Tus respuestas y tus lecturas quedan en tu perfil y puedes pedir que las borremos
        escribiéndonos. El Camino del Dueño es un apoyo para tu reflexión: no sustituye
        asesoría legal, fiscal ni financiera.
      </p>
    </Container>
  );
}
