import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/brand/Logo";
import { contacto } from "@/content/site";

export const metadata: Metadata = {
  title: "Acceso a CEDEM 2.0",
  description:
    "Entra a la plataforma de CEDEM: tu Camino del Dueño, la biblioteca completa y el perfil de tu consultor.",
};

/**
 * Acceso a la plataforma.
 *
 * El formulario está maquetado pero todavía no autentica: la conexión con
 * Supabase Auth se activa en la Fase 3, cuando el proyecto esté creado.
 *
 * TODO (Fase 3): sustituir por el flujo real de Supabase Auth (correo y
 * contraseña + verificación + recuperación + acceso anónimo del Camino del Dueño).
 */
export default function PaginaAcceso() {
  const campo =
    "w-full rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
  const etiqueta = "mb-1.5 block text-[13px] font-medium text-fg-muted";

  return (
    <section className="py-14 lg:py-20">
      <Container size="estrecho">
        <div className="mx-auto max-w-[26rem]">
          <div className="flex justify-center">
            <Logo alto={34} />
          </div>

          <h1 className="mt-8 text-center text-h2 text-fg">Entra a CEDEM 2.0</h1>
          <p className="mt-3 text-center text-sm text-fg-muted">
            Tu Camino del Dueño, la biblioteca completa y el seguimiento de tu avance.
          </p>

          <div
            role="status"
            className="mt-8 rounded-2xl border border-cyan/40 bg-sky/10 p-5 text-[13px] leading-relaxed text-fg-muted dark:border-sky/40"
          >
            <strong className="font-semibold text-fg">La plataforma abre pronto.</strong>{" "}
            El registro y el acceso se activan en cuanto conectemos la base de datos. Si
            ya eres cliente de CEDEM,{" "}
            <a
              href={contacto.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-navy underline underline-offset-4 hover:text-cyan dark:text-sky"
            >
              pide tu invitación por WhatsApp
            </a>{" "}
            y te avisamos el día que abra.
          </div>

          <form className="mt-8 space-y-5" aria-describedby="aviso-plataforma">
            <div>
              <label htmlFor="correo" className={etiqueta}>
                Correo electrónico
              </label>
              <input
                id="correo"
                type="email"
                autoComplete="email"
                disabled
                className={`${campo} opacity-60`}
                placeholder="tucorreo@empresa.com"
              />
            </div>
            <div>
              <label htmlFor="contrasena" className={etiqueta}>
                Contraseña
              </label>
              <input
                id="contrasena"
                type="password"
                autoComplete="current-password"
                disabled
                className={`${campo} opacity-60`}
                placeholder="••••••••"
              />
            </div>

            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-full bg-navy px-6 py-3.5 font-display text-base font-semibold text-white opacity-50 dark:bg-cyan dark:text-[#04102e]"
            >
              Entrar
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-fg-subtle">
            ¿Todavía no tienes cuenta?{" "}
            <Link
              href="/unete"
              className="font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
            >
              Conoce CEDEM 2.0
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
