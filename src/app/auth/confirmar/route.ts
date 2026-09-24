import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/**
 * Confirmación de un enlace de correo (recuperación de contraseña, invitación o
 * cambio de correo).
 *
 * POR QUÉ EXISTE ESTA RUTA Y NO UN ENLACE DIRECTO
 *
 * Supabase puede mandar el enlace de dos maneras:
 *
 *   · con los tokens en el `#hash` de la URL, que el navegador tiene que leer y
 *     convertir en sesión. Funciona, pero deja los tokens en el historial y en
 *     cualquier registro del navegador, y no funciona si el cliente abre el
 *     enlace en otro navegador;
 *   · con un `token_hash` en la query, que se canjea **en el servidor** con
 *     `verifyOtp()`. El token no llega al navegador como credencial y la sesión
 *     queda en una cookie httpOnly.
 *
 * Aquí se usa la segunda. La plantilla del correo en Supabase tiene que apuntar
 * a esta ruta (ver docs/15-correos-y-plantillas.md).
 *
 * El parámetro `tipo` decide qué flujo se confirma; `destino` solo se acepta si
 * es una ruta interna, para que un enlace manipulado no pueda mandar a nadie
 * fuera del sitio.
 */
export async function GET(peticion: NextRequest) {
  const url = new URL(peticion.url);
  const tokenHash = url.searchParams.get("token_hash") ?? url.searchParams.get("token");
  const tipo = url.searchParams.get("tipo") ?? url.searchParams.get("type") ?? "recovery";
  const destinoPedido = url.searchParams.get("destino") ?? url.searchParams.get("next") ?? "/app";
  const destino = destinoPedido.startsWith("/") ? destinoPedido : "/app";

  if (!tokenHash) {
    return NextResponse.redirect(new URL("/acceso?aviso=enlace-invalido", url.origin));
  }

  const supabase = await crearClienteServidor();

  const { error } = await supabase.auth.verifyOtp({
    type: tipo as "recovery" | "invite" | "email_change" | "email",
    token_hash: tokenHash,
  });

  if (error) {
    console.error("[auth] confirmación de enlace:", error.message);
    return NextResponse.redirect(new URL("/acceso?aviso=enlace-invalido", url.origin));
  }

  return NextResponse.redirect(new URL(destino, url.origin));
}
