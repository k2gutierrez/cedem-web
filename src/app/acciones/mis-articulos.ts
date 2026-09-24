"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/**
 * El espacio de escritura de los consultores.
 *
 * POR QUÉ EL CONSULTOR NO PUBLICA DIRECTO
 *
 * Un artículo con la firma de CEDEM es la voz de la firma. Un consultor **escribe y
 * propone**; publicar es de quien responde por el criterio editorial. No es
 * desconfianza: es que si algo sale mal, el nombre que queda en juego es el de
 * CEDEM, y la decisión tiene que ser de quien la asume.
 *
 * Por eso todo lo que crea un consultor nace en **borrador** y espera la
 * publicación desde el panel de contenido, donde el equipo lo revisa con el mismo
 * editor que cualquier otro.
 *
 * LO QUE SÍ PUEDE HACER SIN PERMISO
 *
 * Escribir, guardar a medias y volver cuando quiera. Corregir lo suyo mientras siga
 * en borrador. Y ver en todo momento en qué estado está. Nada de eso depende de
 * nadie, y es lo que hace que la herramienta sirva.
 */

export type EstadoArticulo = { error?: string; ok?: string; id?: string };

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
 * Guarda un artículo del consultor.
 *
 * Sin `id` crea uno nuevo; con `id` edita el suyo. La comprobación de propiedad no
 * es cosmética: sin ella, cualquiera con cuenta podría editar el artículo de otro
 * pasando su identificador.
 */
export async function guardarMiArticulo(
  _estado: EstadoArticulo,
  datos: FormData,
): Promise<EstadoArticulo> {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) return { error: "Inicia sesión." };

  const supabase = await crearClienteServidor();

  // La ficha de consultor de quien escribe: es la que firma el artículo.
  const { data: ficha } = await supabase
    .from("consultants")
    .select("id, full_name")
    .eq("profile_id", sesion.usuario.id)
    .maybeSingle();

  if (!ficha) {
    return {
      error:
        "Tu cuenta no está ligada a una ficha de consultor. Pídele al equipo de CEDEM que la cree.",
    };
  }

  const id = String(datos.get("id") ?? "").trim();
  const titulo = String(datos.get("titulo") ?? "").trim();
  const resumen = String(datos.get("resumen") ?? "").trim();
  const extracto = String(datos.get("extracto") ?? "").trim();
  const cuerpo = String(datos.get("cuerpo") ?? "").trim();

  if (titulo.length < 4) return { error: "El título necesita al menos 4 caracteres." };

  /* --- Editar algo que ya es suyo ---------------------------------------- */

  if (id) {
    const { data: existente } = await supabase
      .from("contents")
      .select("id, status, articles(consultant_id)")
      .eq("id", id)
      .maybeSingle();

    const articulo = existente
      ? (Array.isArray(existente.articles) ? existente.articles[0] : existente.articles)
      : null;

    if (!existente || (articulo as { consultant_id?: string } | null)?.consultant_id !== ficha.id) {
      return { error: "Ese artículo no es tuyo." };
    }

    if (existente.status === "publicado") {
      return {
        error:
          "Tu artículo ya está publicado. Para corregirlo, escríbele al equipo de CEDEM: los cambios en algo publicado los revisa la firma.",
      };
    }

    const { error: errorFicha } = await supabase
      .from("contents")
      .update({
        title: titulo,
        summary: resumen || null,
        excerpt: extracto || null,
        updated_by: sesion.usuario.id,
      })
      .eq("id", id);

    if (errorFicha) return { error: `No se pudo guardar: ${errorFicha.message}` };

    // El cuerpo se ACTUALIZA, no se crea: la fila ya existe desde que se creó el
    // contenido (la crea un disparador). Un consultor no tiene permiso de INSERT
    // sobre `content_bodies`, y no lo necesita.
    const { error: errorCuerpo } = await supabase
      .from("content_bodies")
      .update({ body_md: cuerpo, updated_by: sesion.usuario.id })
      .eq("content_id", id);

    if (errorCuerpo) return { error: `El texto no se guardó: ${errorCuerpo.message}` };

    revalidatePath("/app/mis-articulos");
    return { ok: "Guardado. Sigue en borrador hasta que CEDEM lo publique.", id };
  }

  /* --- Uno nuevo ---------------------------------------------------------- */

  const { data: creado, error: errorFicha } = await supabase
    .from("contents")
    .insert({
      content_type: "articulo",
      slug: aSlug(titulo),
      title: titulo,
      summary: resumen || null,
      excerpt: extracto || null,
      // Nace público: el artículo de un consultor es abierto, y lo que decide si se
      // ve o no es el estado (borrador), no la visibilidad. Si CEDEM prefiere
      // reservarlo para miembros, lo cambia al publicarlo desde el panel.
      visibility: "publico",
      status: "borrador",
      locale: "es-MX",
      // `created_by` no es decorativo: la política que deja a un consultor crear
      // artículos exige que sea él quien lo crea. Sin este campo, la base rechaza
      // la inserción y el guardado falla sin decir por qué.
      created_by: sesion.usuario.id,
      updated_by: sesion.usuario.id,
    })
    .select("id")
    .single();

  if (errorFicha || !creado) {
    const repetido = errorFicha?.code === "23505";
    return {
      error: repetido
        ? "Ya hay un artículo con un título muy parecido. Cambia el título y vuelve a intentarlo."
        : `No se pudo crear: ${errorFicha?.message}`,
    };
  }

  const { error: errorCuerpo } = await supabase
    .from("content_bodies")
    .update({ body_md: cuerpo, updated_by: sesion.usuario.id })
    .eq("content_id", creado.id);

  if (errorCuerpo) return { error: `No se guardó el texto: ${errorCuerpo.message}` };

  // La autoría: el artículo queda firmado por quien lo escribió, y por eso aparece
  // en su ficha pública en cuanto se publique.
  const { error: errorAutor } = await supabase.from("articles").upsert(
    { content_id: creado.id, consultant_id: ficha.id, authored_by_cedem: false },
    { onConflict: "content_id" },
  );

  if (errorAutor) {
    return { error: `El texto se guardó, pero falló la autoría: ${errorAutor.message}` };
  }

  revalidatePath("/app/mis-articulos");
  revalidatePath("/app/admin/contenido");

  return {
    ok: "Artículo guardado como borrador. El equipo de CEDEM lo revisa y lo publica.",
    id: creado.id,
  };
}

/** Retira un borrador propio que no va a ninguna parte. */
export async function descartarMiArticulo(datos: FormData): Promise<void> {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) return;

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const supabase = await crearClienteServidor();
  const { data: ficha } = await supabase
    .from("consultants")
    .select("id")
    .eq("profile_id", sesion.usuario.id)
    .maybeSingle();

  if (!ficha) return;

  const { data: existente } = await supabase
    .from("contents")
    .select("id, status, articles(consultant_id)")
    .eq("id", id)
    .maybeSingle();

  const articulo = existente
    ? (Array.isArray(existente.articles) ? existente.articles[0] : existente.articles)
    : null;

  // Solo se descarta lo propio y lo que sigue en borrador.
  if (
    !existente ||
    existente.status !== "borrador" ||
    (articulo as { consultant_id?: string } | null)?.consultant_id !== ficha.id
  ) {
    return;
  }

  await supabase.from("contents").delete().eq("id", id);
  revalidatePath("/app/mis-articulos");
  redirect("/app/mis-articulos");
}
