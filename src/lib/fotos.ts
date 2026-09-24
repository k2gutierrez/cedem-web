/**
 * Las fotos de las personas: consultores y miembros.
 *
 * DÓNDE VIVEN
 *
 * En el bucket `avatars`, que es **público**. Es deliberado: la foto de un
 * consultor se ve en la página de Equipo sin que nadie tenga sesión, así que
 * tiene que poder servirse por URL directa. En un bucket público cualquiera con
 * la dirección ve el archivo, y por eso aquí solo van fotos de perfil: nada
 * reservado ni datos que dependan de la membresía.
 *
 * CÓMO SE ORDENAN
 *
 * La carpeta es el identificador de la persona (`{user_id}/…`), que es lo que
 * exige la política de Storage: cada quien escribe en la suya, y el staff puede
 * escribir en cualquiera. El nombre del archivo lleva la fecha para que subir una
 * foto nueva no choque con la anterior ni dependa de la caché del navegador.
 */

export const BUCKET_FOTOS = "avatars";

/** Lo que acepta el bucket, según la configuración de Storage. */
export const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** 5 MB es el límite del bucket. Se comprueba antes de subir para dar un mensaje claro. */
export const TAMANO_MAXIMO = 5 * 1024 * 1024;

export type ValidacionFoto = { ok: true; extension: string } | { ok: false; error: string };

/** Comprueba que el archivo sirve antes de gastar una subida. */
export function validarFoto(archivo: File | null): ValidacionFoto {
  if (!archivo || !(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, error: "Elige una foto." };
  }

  if (!TIPOS_ACEPTADOS.includes(archivo.type)) {
    return {
      ok: false,
      error: "La foto tiene que ser JPG, PNG, WebP o AVIF.",
    };
  }

  if (archivo.size > TAMANO_MAXIMO) {
    const mb = (archivo.size / 1024 / 1024).toFixed(1);
    return { ok: false, error: `La foto pesa ${mb} MB y el límite son 5 MB.` };
  }

  const extension = archivo.type === "image/jpeg" ? "jpg" : archivo.type.split("/")[1];
  return { ok: true, extension };
}

/** La ruta dentro del bucket: la carpeta es la persona, el nombre lleva la fecha. */
export function rutaDeFoto(userId: string, extension: string): string {
  return `${userId}/foto-${Date.now()}.${extension}`;
}

/**
 * La dirección pública de una foto guardada.
 *
 * Devuelve `null` si no hay ruta, para que quien la use pueda decidir qué mostrar
 * en su lugar (hoy, las iniciales de la persona).
 */
export function urlDeFoto(ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  if (ruta.startsWith("http")) return ruta;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;

  return `${base}/storage/v1/object/public/${BUCKET_FOTOS}/${ruta}`;
}
