"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { obtenerSesion } from "@/lib/auth/sesion";

export type EstadoContenido = { error?: string; ok?: string };

/** Convierte un título en slug: minúsculas, sin acentos y con guiones. */
function aSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/**
 * Crea un contenido (artículo, podcast, video o evento).
 *
 * La base impone sus propias reglas y aquí se respetan en vez de esquivarlas:
 * el contenido nace en **borrador** (el trigger no permite crear publicado), el
 * cuerpo se guarda antes de publicar y un artículo necesita autoría declarada.
 * Si alguna de esas reglas no se cumple, la base rechaza la operación y ese
 * mensaje se le muestra al administrador tal cual: es la mejor explicación.
 */
export async function crearContenido(
  _estado: EstadoContenido,
  datos: FormData,
): Promise<EstadoContenido> {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return { error: "No tienes permisos para publicar contenido." };

  const titulo = String(datos.get("titulo") ?? "").trim();
  const resumen = String(datos.get("resumen") ?? "").trim();
  const cuerpo = String(datos.get("cuerpo") ?? "").trim();
  const tipo = String(datos.get("tipo") ?? "articulo");
  const visibilidad = String(datos.get("visibilidad") ?? "publico");
  const publicar = datos.get("accion") === "publicar";

  if (titulo.length < 4) return { error: "El título necesita al menos 4 caracteres." };
  if (publicar && cuerpo.length < 40) {
    return { error: "Para publicar hace falta el cuerpo del contenido." };
  }

  const supabase = await crearClienteServidor();

  // 1. El contenido nace en borrador: es lo que valida el esquema.
  const { data: creado, error: errorContenido } = await supabase
    .from("contents")
    .insert({
      content_type: tipo,
      slug: aSlug(titulo),
      title: titulo,
      summary: resumen || null,
      visibility: visibilidad,
      status: "borrador",
      locale: "es-MX",
    })
    .select("id")
    .single();

  if (errorContenido || !creado) {
    const repetido = errorContenido?.code === "23505";
    return {
      error: repetido
        ? "Ya existe un contenido con ese título. Cambia el título para que la dirección sea distinta."
        : `No se pudo guardar: ${errorContenido?.message ?? "error desconocido"}`,
    };
  }

  // 2. El cuerpo, si lo hay (el trigger ya creó la fila: se actualiza).
  if (cuerpo) {
    const { error: errorCuerpo } = await supabase
      .from("content_bodies")
      .upsert({ content_id: creado.id, body_md: cuerpo }, { onConflict: "content_id" });
    if (errorCuerpo) {
      return { error: `Se creó el borrador pero falló el cuerpo: ${errorCuerpo.message}` };
    }
  }

  // 3. La autoría, obligatoria para publicar un artículo.
  if (tipo === "articulo") {
    const autorId = String(datos.get("autor") ?? "");
    const { error: errorAutor } = await supabase.from("articles").upsert(
      {
        content_id: creado.id,
        consultant_id: autorId && autorId !== "cedem" ? autorId : null,
        authored_by_cedem: !autorId || autorId === "cedem",
      },
      { onConflict: "content_id" },
    );
    if (errorAutor) {
      return { error: `Se creó el borrador pero falló la autoría: ${errorAutor.message}` };
    }
  }

  // 4. Publicar, si se pidió. Aquí la base vuelve a validar todo.
  if (publicar) {
    const { error: errorPublicar } = await supabase
      .from("contents")
      .update({ status: "publicado", published_at: new Date().toISOString() })
      .eq("id", creado.id);

    if (errorPublicar) {
      return {
        error: `Quedó como borrador: la base no permitió publicarlo. ${errorPublicar.message}`,
      };
    }
  }

  revalidatePath("/app/admin/contenido");
  revalidatePath("/recursos");
  redirect("/app/admin/contenido?creado=1");
}

/** Cambia el estado de un contenido ya existente. */
export async function cambiarEstado(formData: FormData) {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return;

  const id = String(formData.get("id") ?? "");
  const nuevo = String(formData.get("estado") ?? "");
  if (!id || !["borrador", "programado", "publicado", "archivado"].includes(nuevo)) return;

  const supabase = await crearClienteServidor();
  await supabase
    .from("contents")
    .update({
      status: nuevo,
      published_at: nuevo === "publicado" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  revalidatePath("/app/admin/contenido");
  revalidatePath("/recursos");
}

/** Alterna si un contenido aparece destacado en portada. */
export async function alternarDestacado(formData: FormData) {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return;

  const id = String(formData.get("id") ?? "");
  const destacado = formData.get("destacado") === "true";
  if (!id) return;

  const supabase = await crearClienteServidor();
  await supabase.from("contents").update({ is_featured: !destacado }).eq("id", id);

  revalidatePath("/app/admin/contenido");
  revalidatePath("/");
}
