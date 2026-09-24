import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioRestablecer } from "@/components/auth/FormularioRecuperar";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { obtenerSesion } from "@/lib/auth/sesion";

export const metadata: Metadata = {
  title: "Elige tu contraseña nueva",
  robots: { index: false, follow: false },
};

/**
 * Elegir la contraseña nueva.
 *
 * Se llega aquí desde el enlace del correo, ya con una sesión de recuperación
 * creada por `/auth/confirmar`. Sin esa sesión no tiene sentido mostrar el
 * formulario: se manda a pedir un enlace nuevo, que es lo que la persona
 * necesita en ese caso.
 */
export default async function PaginaRestablecer() {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) redirect("/recuperar?aviso=sin-sesion");

  return (
    <section className="py-14 lg:py-20">
      <Container size="estrecho">
        <div className="mx-auto max-w-[26rem]">
          <div className="flex justify-center">
            <Logo alto={34} />
          </div>

          <h1 className="mt-8 text-center text-h2 text-fg">Elige tu contraseña nueva</h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-fg-muted">
            Ya validamos tu enlace. Escribe la contraseña que quieras usar de ahora en
            adelante.
          </p>

          <div className="mt-8">
            <FormularioRestablecer />
          </div>
        </div>
      </Container>
    </section>
  );
}
