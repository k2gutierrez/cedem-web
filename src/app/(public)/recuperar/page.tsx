import type { Metadata } from "next";
import Link from "next/link";
import { FormularioRecuperar } from "@/components/auth/FormularioRecuperar";
import { MarcoAcceso } from "@/components/auth/MarcoAcceso";

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
    <MarcoAcceso
      titulo="Recuperar tu contraseña"
      entrada="Escribe el correo con el que te registraste y te mandamos un enlace para crear una contraseña nueva."
      pie={
        <p className="text-[12.5px] leading-relaxed text-fg-subtle">
          Si el correo no llega en unos minutos, revisa la carpeta de no deseados. Y si
          sigue sin aparecer,{" "}
          <Link href="/contacto" className="font-medium text-navy dark:text-sky">
            escríbenos
          </Link>
          .
        </p>
      }
    >
      <FormularioRecuperar />
    </MarcoAcceso>
  );
}
