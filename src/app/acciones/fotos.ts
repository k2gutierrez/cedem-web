"use server";

import { revalidatePath } from "next/cache";
import { obtenerSesion } from "@/lib/auth/sesion";
import { BUCKET_FOTOS, rutaDeFoto, validarFoto } from "@/lib/fotos";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/**
 * Subir la foto de una persona.
 *
 * QUIÉN PUEDE SUBIR QUÉ
 *
 * Cada quien sube la suya: el archivo va a una carpeta con su propio
 * identificador, y la política del bucket comprueba justo eso. El staff
 * (`admin`, `super_admin`, `consultor` con permiso de edición) puede subir la de
 * cualquier persona del equipo, que es lo que hace falta cuando alguien manda la
 * foto por WhatsApp en vez de entrar a subirla.
 *
 * SI LA PERSONA ES CONSULTORA, LA FOTO SE GUARDA EN DOS SITIOS
 *
 *   · `profiles.avatar_path` — su foto de cuenta, la que ve dentro de la plataforma.
 *   · `consultants.photo_path` — su foto pública, la que sale en la página de Equipo.
 *
 * Son la misma imagen, pero los campos son distintos porque responden a cosas
 * distintas: el perfil puede tener foto sin ser consultor, y la ficha pública
 * puede quedarse sin foto aunque la persona tenga cuenta. Se escribe en los dos
 * para que subir una vez baste.
 */
export async function subirFoto(datos: FormData): Promise<{ ok?: string; error?: string }> {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) return { error: "Inicia sesión para subir tu foto." };

  const archivo = datos.get("foto");
  if (!(archivo instanceof File)) return { error: "No llegó ninguna foto." };

  const revision = validarFoto(archivo);
  if (!revision.ok) return { error: revision.error };

  // A quién pertenece la foto: por omisión, a quien la sube.
  const destinatario = String(datos.get("persona") ?? "").trim() || sesion.usuario.id;
  const esPropia = destinatario === sesion.usuario.id;

  if (!esPropia && !sesion.esAdmin) {
    return { error: "Solo el equipo de CEDEM puede cambiar la foto de otra persona." };
  }

  const supabase = await crearClienteServidor();
  const ruta = rutaDeFoto(destinatario, revision.extension);

  const { error: errorSubida } = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(ruta, archivo, { contentType: archivo.type, upsert: false });

  if (errorSubida) {
    console.error("[fotos] no se pudo subir:", errorSubida.message);
    return {
      error: /row-level security|policy/i.test(errorSubida.message)
        ? "No tienes permiso para cambiar esa foto."
        : "No pudimos guardar la foto. Vuelve a intentarlo.",
    };
  }

  // La foto anterior se retira para no ir acumulando archivos huérfanos.
  const { data: anterior } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", destinatario)
    .maybeSingle();

  if (anterior?.avatar_path && anterior.avatar_path !== ruta) {
    await supabase.storage.from(BUCKET_FOTOS).remove([anterior.avatar_path as string]);
  }

  const { error: errorPerfil } = await supabase
    .from("profiles")
    .update({ avatar_path: ruta })
    .eq("id", destinatario);

  if (errorPerfil) {
    console.error("[fotos] no se pudo guardar en el perfil:", errorPerfil.message);
    return { error: "La foto se subió, pero no pudimos asociarla a tu perfil." };
  }

  // Y si es consultora, también a su ficha pública. La política de `consultants`
  // deja que cada quien edite la suya, así que no hace falta nada más.
  const { data: ficha } = await supabase
    .from("consultants")
    .select("id")
    .eq("profile_id", destinatario)
    .maybeSingle();

  if (ficha) {
    await supabase.from("consultants").update({ photo_path: ruta }).eq("id", ficha.id);
  }

  revalidatePath("/app/perfil");
  revalidatePath("/app/mi-ficha");
  revalidatePath("/app/admin/equipo");
  revalidatePath("/equipo");

  return { ok: "Foto actualizada." };
}

/** Retira la foto: vuelve a mostrarse el marco con las iniciales. */
export async function quitarFoto(datos: FormData): Promise<void> {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) return;

  const destinatario = String(datos.get("persona") ?? "").trim() || sesion.usuario.id;
  if (destinatario !== sesion.usuario.id && !sesion.esAdmin) return;

  const supabase = await crearClienteServidor();

  const { data: perfil } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", destinatario)
    .maybeSingle();

  if (perfil?.avatar_path) {
    await supabase.storage.from(BUCKET_FOTOS).remove([perfil.avatar_path as string]);
  }

  await supabase.from("profiles").update({ avatar_path: null }).eq("id", destinatario);
  await supabase.from("consultants").update({ photo_path: null }).eq("profile_id", destinatario);

  revalidatePath("/app/perfil");
  revalidatePath("/app/mi-ficha");
  revalidatePath("/equipo");
}
