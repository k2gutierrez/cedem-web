import type { Metadata } from "next";
import Link from "next/link";
import { FormularioRecuperar } from "@/components/auth/FormularioRecuperar";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Recuperar tu contraseña",
  description:
    "Te mandamos un enlace para crear una contraseña nueva y volver a entrar a CEDEM 2.0.",
  robots: { index: false, follow: false },
};

/**
 * Recuperación de contraseña.
 *
 * No existía: si un dueño olvidaba su contraseña, la única salida era escribirle
 * a CEDEM. La respuesta es siempre la misma —haya o no cuenta con ese correo—
 * para que nadie pueda averiguar quién es cliente probando direcciones.
 */
export default function PaginaRecuperar() {
  return (
    <section className="py-14 lg:py-20">
      <Container size="estrecho">
        <div className="mx-auto max-w-[26rem]">
          <div className="flex justify-center">
            <Logo alto={34} />
          </div>

          <h1 className="mt-8 text-center text-h2 text-fg">Recuperar tu contraseña</h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-fg-muted">
            Escribe el correo con el que te registraste y te mandamos un enlace para crear
            una contraseña nueva.
          </p>

          <div className="mt-8">
            <FormularioRecuperar />
          </div>

          <p className="mt-8 text-center text-[12.5px] leading-relaxed text-fg-subtle">
            Si el correo no llega en unos minutos, revisa la carpeta de no deseados. Y si
            sigue sin aparecer,{" "}
            <Link href="/contacto" className="font-medium text-navy dark:text-sky">
              escríbenos
            </Link>
            .
          </p>
        </div>
      </Container>
    </section>
  );
}
