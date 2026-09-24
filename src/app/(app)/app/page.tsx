import type { Metadata } from "next";
import Link from "next/link";
import { AvisoDiagnosticos } from "@/components/app/AvisoDiagnosticos";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { nombreDe, obtenerSesion } from "@/lib/auth/sesion";

export const metadata: Metadata = {
  title: "Mi panel",
  robots: { index: false, follow: false },
};

/**
 * Panel del miembro.
 *
 * TODO (Fase 4): leer de `journey_sessions` el avance real del Camino del Dueño
 * y mostrar aquí el último diagnóstico, en lugar del estado vacío.
 */
export default async function PaginaPanel() {
  const sesion = await obtenerSesion();
  const nombre = nombreDe(sesion);
  const perfilIncompleto = !sesion.perfil?.profile_completed_at;

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
        <article className="flex flex-col rounded-2xl border border-border bg-bg p-7 lg:col-span-2">
          <p className="tagline text-fg-subtle">Tu diagnóstico</p>
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
        </article>

        {/* Perfil */}
        <article className="flex flex-col rounded-2xl border border-border bg-bg p-7">
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

        {/* Biblioteca */}
        <article className="rounded-2xl border border-border bg-bg p-7">
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

        {/* Membresía */}
        <article className="rounded-2xl border border-border bg-bg p-7 lg:col-span-2">
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
