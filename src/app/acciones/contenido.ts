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

/* -------------------------------------------------------------------------- */
/* Editar un contenido que ya existe                                          */
/* -------------------------------------------------------------------------- */

/**
 * Guarda los cambios de un contenido publicado o en borrador.
 *
 * QUÉ FALTABA
 *
 * El panel permitía crear, publicar, archivar y destacar, pero **no editar**: una
 * vez creado un contenido, su título, su cuerpo, su visibilidad y su tipo quedaban
 * congelados. Corregir una errata o pasar un artículo de público a premium exigía
 * tocar la base a mano.
 *
 * EL CAMBIO DE TIPO ES LO DELICADO
 *
 * Un contenido no es solo su fila en `contents`: cada tipo tiene su tabla —los
 * artículos su autoría, los documentos su archivo, los eventos su fecha, los videos
 * su proveedor—. Cambiar el tipo sin más dejaría la fila vieja apuntando a un
 * contenido que ya no es de ese tipo, y el panel mostraría datos fantasma.
 *
 * Por eso, al cambiar de tipo se retira la fila del tipo anterior y se crea la del
 * nuevo. Es lo que hace que un artículo pueda convertirse en documento sin dejar
 * basura por debajo.
 */
export async function guardarContenido(
  _estado: EstadoContenido,
  datos: FormData,
): Promise<EstadoContenido> {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return { error: "No tienes permisos para editar contenido." };

  const id = String(datos.get("id") ?? "");
  if (!id) return { error: "No sé qué contenido guardar." };

  const titulo = String(datos.get("titulo") ?? "").trim();
  const resumen = String(datos.get("resumen") ?? "").trim();
  const extracto = String(datos.get("extracto") ?? "").trim();
  const cuerpo = String(datos.get("cuerpo") ?? "").trim();
  const tipo = String(datos.get("tipo") ?? "articulo");
  const visibilidad = String(datos.get("visibilidad") ?? "publico");

  if (titulo.length < 4) return { error: "El título necesita al menos 4 caracteres." };

  const supabase = await crearClienteServidor();

  const { data: antes } = await supabase
    .from("contents")
    .select("content_type, slug, status")
    .eq("id", id)
    .maybeSingle();

  if (!antes) return { error: "Ese contenido ya no existe." };

  const tipoAnterior = antes.content_type as string;
  const cambioDeTipo = tipoAnterior !== tipo;

  // 1 · La ficha. El slug NO se recalcula al cambiar el título: cambiarlo rompería
  //     la dirección que ya se compartió y el posicionamiento en Google. Si hace
  //     falta otra dirección, se decide a conciencia y con una redirección.
  const { error: errorFicha } = await supabase
    .from("contents")
    .update({
      title: titulo,
      summary: resumen || null,
      excerpt: extracto || null,
      content_type: tipo,
      visibility: visibilidad,
    })
    .eq("id", id);

  if (errorFicha) return { error: `No se pudo guardar: ${errorFicha.message}` };

  // 2 · El cuerpo.
  const { error: errorCuerpo } = await supabase
    .from("content_bodies")
    .upsert(
      { content_id: id, body_md: cuerpo, word_count: cuerpo ? cuerpo.split(/\s+/).length : 0 },
      { onConflict: "content_id" },
    );

  if (errorCuerpo) {
    return { error: `La ficha se guardó, pero el cuerpo no: ${errorCuerpo.message}` };
  }

  // 3 · Los datos del tipo. Si cambió, se retira lo viejo y se prepara lo nuevo.
  if (cambioDeTipo) {
    const satelites: Record<string, string> = {
      articulo: "articles",
      documento: "documents",
      evento: "events",
      podcast: "podcasts",
      video: "videos",
    };

    const tablaAnterior = satelites[tipoAnterior];
    if (tablaAnterior) {
      await supabase.from(tablaAnterior).delete().eq("content_id", id);
    }

    if (tipo === "articulo") {
      const autorId = String(datos.get("autor") ?? "");
      await supabase.from("articles").upsert(
        {
          content_id: id,
          consultant_id: autorId && autorId !== "cedem" ? autorId : null,
          authored_by_cedem: !autorId || autorId === "cedem",
        },
        { onConflict: "content_id" },
      );
    }

    if (tipo === "documento") {
      // La fila del documento nace sin archivo: el PDF se sube después, y hasta
      // entonces la biblioteca muestra el texto pero no ofrece descarga.
      await supabase
        .from("documents")
        .upsert(
          { content_id: id, file_mime: null, is_downloadable: true },
          { onConflict: "content_id" },
        );
    }

    if (tipo === "video") {
      await supabase
        .from("videos")
        .upsert({ content_id: id, provider: "externo" }, { onConflict: "content_id" });
    }
  } else if (tipo === "articulo") {
    // Aunque el tipo no cambie, la autoría puede cambiar.
    const autorId = String(datos.get("autor") ?? "");
    if (autorId) {
      await supabase.from("articles").upsert(
        {
          content_id: id,
          consultant_id: autorId !== "cedem" ? autorId : null,
          authored_by_cedem: autorId === "cedem",
        },
        { onConflict: "content_id" },
      );
    }
  }

  revalidatePath("/app/admin/contenido");
  revalidatePath(`/app/admin/contenido/${id}`);
  revalidatePath("/app/biblioteca");
  revalidatePath("/recursos");
  revalidatePath("/");

  const aviso = cambioDeTipo
    ? `Guardado. Pasó de ${tipoAnterior} a ${tipo}: revisa que sus datos del nuevo tipo estén completos.`
    : "Cambios guardados.";

  return { ok: aviso };
}
