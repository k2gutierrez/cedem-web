import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioRestablecer } from "@/components/auth/FormularioRecuperar";
import { MarcoAcceso } from "@/components/auth/MarcoAcceso";
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
    <MarcoAcceso
      titulo="Elige tu contraseña nueva"
      entrada="Ya validamos tu enlace. Escribe la contraseña que quieras usar de ahora en adelante."
    >
      <FormularioRestablecer />
    </MarcoAcceso>
  );
}
