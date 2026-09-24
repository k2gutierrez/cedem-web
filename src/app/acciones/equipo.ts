"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { obtenerSesion } from "@/lib/auth/sesion";

export type EstadoAdmin = { error?: string; ok?: string };

/** Convierte un nombre en slug para la URL del perfil. */
function aSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Acepta una lista escrita con comas y la convierte en arreglo limpio. */
function aLista(texto: FormDataEntryValue | null): string[] {
  return String(texto ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/* Equipo                                                                     */
/* -------------------------------------------------------------------------- */

export async function guardarConsultor(
  _estado: EstadoAdmin,
  datos: FormData,
): Promise<EstadoAdmin> {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return { error: "No tienes permisos para editar el equipo." };

  const id = String(datos.get("id") ?? "");
  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 4) return { error: "Escribe el nombre completo." };

  const registro = {
    full_name: nombre,
    slug: aSlug(nombre),
    headline: String(datos.get("cargo") ?? "").trim() || null,
    location: String(datos.get("locacion") ?? "").trim() || null,
    bio_md: String(datos.get("bio") ?? "").trim() || null,
    linkedin_url: String(datos.get("linkedin") ?? "").trim() || null,
    x_url: String(datos.get("x") ?? "").trim() || null,
    email_public: String(datos.get("correo") ?? "").trim() || null,
    specialties: aLista(datos.get("especialidades")),
    is_founder: datos.get("fundador") === "on",
    is_active: datos.get("activo") !== "off",
    sort_order: Number(datos.get("orden") ?? 100) || 100,
  };

  const supabase = await crearClienteServidor();
  const { error } = id
    ? await supabase.from("consultants").update(registro).eq("id", id)
    : await supabase.from("consultants").insert(registro);

  if (error) {
    const repetido = error.code === "23505";
    return {
      error: repetido
        ? "Ya existe alguien con ese nombre en el equipo."
        : `No se pudo guardar: ${error.message}`,
    };
  }

  revalidatePath("/app/admin/equipo");
  revalidatePath("/equipo");
  return { ok: id ? "Perfil actualizado." : "Se agregó al equipo." };
}

export async function alternarConsultor(formData: FormData) {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return;

  const id = String(formData.get("id") ?? "");
  const activo = formData.get("activo") === "true";
  if (!id) return;

  const supabase = await crearClienteServidor();
  await supabase.from("consultants").update({ is_active: !activo }).eq("id", id);

  revalidatePath("/app/admin/equipo");
  revalidatePath("/equipo");
}

/* -------------------------------------------------------------------------- */
/* Clientes y mapa                                                            */
/* -------------------------------------------------------------------------- */

export async function guardarCliente(
  _estado: EstadoAdmin,
  datos: FormData,
): Promise<EstadoAdmin> {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return { error: "No tienes permisos para editar clientes." };

  const id = String(datos.get("id") ?? "");
  const nombre = String(datos.get("nombre") ?? "").trim();
  const pais = String(datos.get("pais") ?? "").trim();

  if (nombre.length < 2) return { error: "Escribe el nombre de la empresa." };
  if (pais.length !== 2) return { error: "Elige el país." };

  const autorizado = datos.get("autorizado") === "on";

  const registro = {
    name: nombre,
    slug: aSlug(nombre),
    country_code: pais,
    city: String(datos.get("ciudad") ?? "").trim() || null,
    sector: String(datos.get("sector") ?? "").trim() || null,
    relationship_since: Number(datos.get("desde") ?? 0) || null,
    // La autorización de uso de marca se registra con fecha y quién la dio:
    // es lo que permite publicar el logo sin riesgo.
    brand_authorized: autorizado,
    brand_authorized_at: autorizado ? new Date().toISOString() : null,
    brand_authorized_by: autorizado ? sesion.usuario?.id : null,
    show_on_map: datos.get("en_mapa") !== "off",
    is_featured: datos.get("destacado") === "on",
    is_active: datos.get("activo") !== "off",
    notes_internal: String(datos.get("notas") ?? "").trim() || null,
  };

  const supabase = await crearClienteServidor();
  const { error } = id
    ? await supabase.from("clients").update(registro).eq("id", id)
    : await supabase.from("clients").insert(registro);

  if (error) {
    const repetido = error.code === "23505";
    return {
      error: repetido
        ? "Ya existe un cliente con ese nombre."
        : `No se pudo guardar: ${error.message}`,
    };
  }

  revalidatePath("/app/admin/clientes");
  revalidatePath("/nosotros");
  return { ok: id ? "Cliente actualizado." : "Se agregó el cliente." };
}

export async function alternarCliente(formData: FormData) {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return;

  const id = String(formData.get("id") ?? "");
  const campo = String(formData.get("campo") ?? "");
  const valor = formData.get("valor") === "true";
  if (!id || !["show_on_map", "brand_authorized", "is_active", "is_featured"].includes(campo)) {
    return;
  }

  const supabase = await crearClienteServidor();
  await supabase
    .from("clients")
    .update({
      [campo]: !valor,
      ...(campo === "brand_authorized"
        ? {
            brand_authorized_at: !valor ? new Date().toISOString() : null,
            brand_authorized_by: !valor ? sesion.usuario?.id : null,
          }
        : {}),
    })
    .eq("id", id);

  revalidatePath("/app/admin/clientes");
  revalidatePath("/nosotros");
}

/** Marca un país como activo o inactivo para el mapa de presencia. */
export async function alternarPais(formData: FormData) {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return;

  const code = String(formData.get("code") ?? "");
  const activo = formData.get("activo") === "true";
  if (code.length !== 2) return;

  const supabase = await crearClienteServidor();
  await supabase.from("countries").update({ is_active: !activo }).eq("code", code);

  revalidatePath("/app/admin/clientes");
  revalidatePath("/nosotros");
}

/* -------------------------------------------------------------------------- */
/* Testimonios                                                                */
/* -------------------------------------------------------------------------- */

export async function guardarTestimonio(
  _estado: EstadoAdmin,
  datos: FormData,
): Promise<EstadoAdmin> {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return { error: "No tienes permisos." };

  const persona = String(datos.get("persona") ?? "").trim();
  const cita = String(datos.get("cita") ?? "").trim();
  if (persona.length < 3) return { error: "Escribe el nombre de la persona." };
  if (cita.length < 20) return { error: "La cita es demasiado corta." };

  const autorizado = datos.get("autorizado") === "on";

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("testimonials").insert({
    person_name: persona,
    person_role: String(datos.get("cargo") ?? "").trim() || null,
    person_company: String(datos.get("empresa") ?? "").trim() || null,
    quote: cita,
    authorized: autorizado,
    // Solo se publica lo que está autorizado por escrito: es el mismo criterio
    // que con los logos.
    is_published: autorizado,
    locale: "es-MX",
    sort_order: Number(datos.get("orden") ?? 100) || 100,
  });

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/app/admin/clientes");
  revalidatePath("/nosotros");
  return { ok: "Testimonio agregado." };
}

export async function alternarTestimonio(formData: FormData) {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return;

  const id = String(formData.get("id") ?? "");
  const publicado = formData.get("publicado") === "true";
  if (!id) return;

  const supabase = await crearClienteServidor();
  await supabase.from("testimonials").update({ is_published: !publicado }).eq("id", id);

  revalidatePath("/app/admin/clientes");
  revalidatePath("/nosotros");
}
