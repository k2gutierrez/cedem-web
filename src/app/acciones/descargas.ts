"use server";

import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteAdmin } from "@/lib/supabase/cliente-admin";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/**
 * Descarga de un documento del método.
 *
 * POR QUÉ NO HAY UN ENLACE DIRECTO AL PDF
 *
 * El bucket `documents` es privado. Un enlace podría ser público y cualquiera
 * —con o sin cuenta— se llevaría el material: es justo lo que hay que evitar,
 * porque estos documentos son la razón de ser de la membresía.
 *
 * El camino es el que ya previó el esquema:
 *
 *   1. `get_download_path()` (RPC, definer) comprueba el derecho con
 *      `can_read_body()` y devuelve la ruta del archivo. Si no hay membresía,
 *      la función lanza y aquí no pasa nada más.
 *   2. Esa misma llamada deja constancia en `access_logs` con la acción
 *      `descarga`: quién, qué documento, cuándo y desde qué IP.
 *   3. El servidor firma una URL de 5 minutos con la llave de servicio. La URL
 *      caduca sola y no sirve para compartir.
 *
 * La comprobación se hace dos veces (en la sesión y dentro del RPC) a propósito:
 * la primera da un mensaje claro, la segunda es la que garantiza.
 */

const SEGUNDOS_DE_FIRMA = 300;

export async function descargarDocumento(datos: FormData): Promise<void> {
  const slug = String(datos.get("slug") ?? "").trim();
  const destino = "/app/biblioteca";

  const sesion = await obtenerSesion();
  if (!sesion.usuario) redirect(`/acceso?destino=${destino}`);

  if (!slug) redirect(`${destino}?aviso=documento-desconocido`);

  if (!sesion.esPremium) redirect(`${destino}?aviso=requiere-membresia`);

  const supabase = await crearClienteServidor();

  const { data: contenido, error: errorContenido } = await supabase
    .from("contents")
    .select("id")
    .eq("content_type", "documento")
    .eq("slug", slug)
    .eq("status", "publicado")
    .maybeSingle();

  if (errorContenido || !contenido) redirect(`${destino}?aviso=documento-desconocido`);

  const { data: ruta, error: errorRuta } = await supabase.rpc("get_download_path", {
    p_content_id: contenido.id,
  });

  if (errorRuta || !ruta) redirect(`${destino}?aviso=requiere-membresia`);

  // La firma se hace con la llave de servicio: el navegador nunca ve la ruta
  // permanente ni la llave, solo una URL que muere en cinco minutos.
  const admin = crearClienteAdmin();
  const { data: firma, error: errorFirma } = await admin.storage
    .from("documents")
    .createSignedUrl(ruta as string, SEGUNDOS_DE_FIRMA, { download: `${slug}.pdf` });

  if (errorFirma || !firma?.signedUrl) redirect(`${destino}?aviso=error-descarga`);

  redirect(firma.signedUrl);
}
