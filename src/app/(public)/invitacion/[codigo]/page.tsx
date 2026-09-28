import type { Metadata } from "next";
import { FormularioCanje } from "@/components/admin/Invitaciones";
import { Container } from "@/components/ui/Container";
import { obtenerSesion } from "@/lib/auth/sesion";

export const metadata: Metadata = {
  title: "Tu invitación a CEDEM 2.0",
  description:
    "Canjea la invitación que te dio CEDEM y activa tu acceso completo a la plataforma.",
  robots: { index: false, follow: false },
};

/**
 * Canje de una invitación.
 *
 * Se necesita sesión porque la función de la base lo exige (la invitación queda
 * ligada a una persona, no a un enlace suelto que se pueda reenviar). Si el
 * dueño llega sin cuenta, se le invita a crearla y se conserva el código para
 * que lo canjee al entrar.
 */
export default async function PaginaInvitacion(props: PageProps<"/invitacion/[codigo]">) {
  const { codigo } = await props.params;
  const sesion = await obtenerSesion();
  const destino = `/invitacion/${encodeURIComponent(codigo)}`;

  return (
    <section className="py-14 lg:py-20">
      <Container size="estrecho">
        <div className="mx-auto max-w-[30rem]">
          <p className="tagline text-cyan dark:text-sky">CEDEM 2.0</p>
          <h1 className="mt-4 text-h2 text-fg">Tu invitación</h1>
          <p className="mt-4 text-lead text-fg-muted">
            Esta invitación te da acceso completo a la plataforma: la biblioteca entera,
            tu Camino del Dueño y el seguimiento. Sin costo, porque ya eres cliente de
            CEDEM.
          </p>

          <div className="mt-8 rounded-3xl border border-border bg-bg p-7">
            {sesion.usuario ? (
              <>
                <p className="mb-5 text-sm text-fg-muted">
                  Entraste como <strong className="font-semibold text-fg">{sesion.usuario.email}</strong>.
                  Confirma para activar tu acceso.
                </p>
                <FormularioCanje codigoInicial={codigo} />
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-fg-muted">
                  Para canjearla necesitas una cuenta: así tu acceso queda a tu nombre y
                  puedes entrar desde cualquier dispositivo. Crear la cuenta es gratis.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <a
                    href={`/registro?destino=${encodeURIComponent(destino)}`}
                    className="inline-flex items-center justify-center rounded-full bg-navy px-6 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-[#0b1856] dark:bg-cyan dark:text-[#04102e]"
                  >
                    Crear mi cuenta y canjear
                  </a>
                  <a
                    href={`/acceso?destino=${encodeURIComponent(destino)}`}
                    className="inline-flex items-center justify-center rounded-full border border-border-strong px-6 py-3 font-display text-sm font-semibold text-fg transition-colors hover:border-cyan hover:text-cyan dark:hover:border-sky dark:hover:text-sky"
                  >
                    Ya tengo cuenta
                  </a>
                </div>
                <p className="mt-5 text-center text-xs text-fg-subtle">
                  Tu código se conserva: <span className="font-mono">{codigo}</span>
                </p>
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
