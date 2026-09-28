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
/** Los avisos con los que se puede llegar aquí desde otra pantalla. */
const AVISOS: Record<string, string> = {
  "sin-sesion":
    "Para cambiar la contraseña hay que abrir el enlace que llega al correo. Si escribiste la dirección a mano, o el enlace ya se usó una vez, pide uno nuevo aquí abajo.",
  "enlace-usado":
    "Ese enlace ya se usó. Cada uno sirve una sola vez: pide otro aquí abajo.",
};

export default async function PaginaRecuperar(props: PageProps<"/recuperar">) {
  const parametros = await props.searchParams;
  const aviso = typeof parametros.aviso === "string" ? AVISOS[parametros.aviso] : null;

  return (
    <MarcoAcceso
      titulo="Recuperar tu contraseña"
      entrada="Escribe el correo con el que te registraste y te mandamos un enlace para crear una contraseña nueva."
      pie={
        <p className="text-xs leading-relaxed text-fg-subtle">
          Si el correo no llega en unos minutos, revisa la carpeta de no deseados. Y si
          sigue sin aparecer,{" "}
          <Link href="/contacto" className="font-medium text-navy dark:text-sky">
            escríbenos
          </Link>
          .
        </p>
      }
    >
      {aviso ? (
        <p
          role="status"
          className="mb-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
        >
          {aviso}
        </p>
      ) : null}

      <FormularioRecuperar />
    </MarcoAcceso>
  );
}
