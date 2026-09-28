import type { Metadata } from "next";
import Link from "next/link";
import { AvisoDiagnosticos } from "@/components/app/AvisoDiagnosticos";
import { Revelar } from "@/components/fx/Efectos";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { nombreDe, obtenerSesion } from "@/lib/auth/sesion";
import { obtenerMisDiagnosticos } from "@/lib/datos/camino";

export const metadata: Metadata = {
  title: "Mi panel",
  robots: { index: false, follow: false },
};

/**
 * Panel del miembro.
 *
 * La tarjeta del diagnóstico lee de `journey_sessions`: antes decía «todavía no
 * has hecho tu Camino del Dueño» a todo el mundo, incluso a quien ya lo había
 * hecho, porque el estado estaba escrito a mano en el marcado.
 */
export default async function PaginaPanel() {
  const sesion = await obtenerSesion();
  const nombre = nombreDe(sesion);
  const perfilIncompleto = !sesion.perfil?.profile_completed_at;

  const [ultimo] = await obtenerMisDiagnosticos(1);

  return (
    <Container>
      <p className="tagline text-cyan dark:text-sky">CEDEM 2.0</p>
      <h1 className="mt-3 text-h1 text-fg">Hola, {nombre}</h1>
      <p className="mt-4 max-w-[52ch] text-lead text-fg-muted">
        Aquí vive tu Camino del Dueño, tu perfil y lo que CEDEM tiene para ti.
      </p>

      {sesion.esAdmin ? (
        <div className="mt-8">
          <AvisoDiagnosticos />
        </div>
      ) : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* Camino del Dueño */}
        <Revelar className="flex lg:col-span-2">
        <article className="borde-vivo flex w-full flex-col rounded-2xl border border-border bg-bg p-7">
          <p className="tagline text-fg-subtle">Tu Camino del Dueño</p>

          {ultimo ? (
            <>
              <h2 className="mt-3 font-display text-xl font-bold text-fg">
                {ultimo.lectura.titular}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-fg-muted">
                {ultimo.lectura.observacion[0]}
              </p>
              <p className="mt-3 text-sm text-fg-subtle">
                {ultimo.completadaEn
                  ? `Lo hiciste el ${new Date(ultimo.completadaEn).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}.`
                  : ""}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <BotonEnlace href="/app/camino" tamano="lg">
                  Ver mi lectura
                  <IconoFlecha className="h-4 w-4" />
                </BotonEnlace>
                <BotonEnlace href="/camino" variante="secundario" tamano="lg">
                  Volver a hacerlo
                </BotonEnlace>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-3 font-display text-xl font-bold text-fg">
                Todavía no has hecho tu Camino del Dueño
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-fg-muted">
                Cinco minutos, quince preguntas. Al terminar sabrás en qué verbo se te está
                atorando el valor —generar, multiplicar o capturar— y te llevas tres cosas
                para leer y tres para hacer esta semana.
              </p>
              <div className="mt-6">
                <BotonEnlace href="/camino" tamano="lg">
                  Empezar ahora
                  <IconoFlecha className="h-4 w-4" />
                </BotonEnlace>
              </div>
            </>
          )}
        </article>
        </Revelar>

        {/* Perfil */}
        <Revelar retraso={0.08} className="flex">
        <article className="borde-vivo flex w-full flex-col rounded-2xl border border-border bg-bg p-7">
          <p className="tagline text-fg-subtle">Tu perfil</p>
          <h2 className="mt-3 font-display text-lg font-bold text-fg">
            {perfilIncompleto ? "Falta completarlo" : "Completo"}
          </h2>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-fg-muted">
            {perfilIncompleto
              ? "Con tu empresa y tu cargo podemos darte mejores recomendaciones y avisarte de lo que te toca."
              : "Gracias. Con esto podemos afinar tus recomendaciones."}
          </p>
          <div className="mt-6">
            <BotonEnlace href="/app/perfil" variante="secundario">
              {perfilIncompleto ? "Completar mi perfil" : "Ver mi perfil"}
            </BotonEnlace>
          </div>
        </article>
        </Revelar>

        {/* Biblioteca */}
        <Revelar retraso={0.12} className="flex">
        <article className="borde-vivo w-full rounded-2xl border border-border bg-bg p-7">
          <p className="tagline text-fg-subtle">Biblioteca</p>
          <h2 className="mt-3 font-display text-lg font-bold text-fg">
            Artículos y webinars
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            El archivo completo de CEDEM: {sesion.esPremium ? "acceso total" : "con tu membresía se abre completo"}.
          </p>
          <Link
            href="/recursos"
            className="mt-6 inline-flex items-center gap-2 font-display text-sm font-semibold text-navy hover:text-cyan dark:text-sky"
          >
            Ir a recursos
            <IconoFlecha className="h-4 w-4" />
          </Link>
        </article>
        </Revelar>

        {/* Membresía */}
        <Revelar retraso={0.16} className="flex lg:col-span-2">
        <article className="borde-vivo w-full rounded-2xl border border-border bg-bg p-7">
          <p className="tagline text-fg-subtle">Tu membresía</p>
          <h2 className="mt-3 font-display text-lg font-bold text-fg">
            {sesion.esPremium ? "Acceso completo" : "Cuenta gratuita"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            {sesion.esPremium
              ? "Tienes acceso a todo el contenido y al seguimiento de tu Camino del Dueño."
              : "Puedes leer el primer párrafo de todo el contenido. La membresía abre el resto y el seguimiento con IA."}
          </p>
          {!sesion.esPremium ? (
            <div className="mt-6">
              <BotonEnlace href="/unete" variante="secundario">
                Ver qué incluye la membresía
              </BotonEnlace>
            </div>
          ) : null}
        </article>
        </Revelar>
      </div>

      {sesion.esAdmin ? (
        <div className="mt-10 rounded-2xl border border-cyan/40 bg-sky/10 p-7 dark:border-sky/40">
          <h2 className="font-display text-lg font-bold text-fg">
            Tienes permisos de administración
          </h2>
          <p className="mt-2 text-sm text-fg-muted">
            Puedes publicar artículos, podcasts, videos y eventos, y gestionar el equipo,
            los clientes y el mapa de presencia.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <BotonEnlace href="/app/admin/contenido">Administrar contenido</BotonEnlace>
          </div>
        </div>
      ) : null}
    </Container>
  );
}
