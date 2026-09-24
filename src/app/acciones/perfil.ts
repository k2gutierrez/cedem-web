"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { obtenerSesion } from "@/lib/auth/sesion";

export type EstadoPerfil = { error?: string; ok?: string };

/**
 * Guarda el perfil del miembro.
 *
 * El segmento (Consulting o PCE) se deduce de la facturación anual declarada:
 * es el mismo criterio con el que la firma reparte el acompañamiento, y así el
 * equipo comercial ve de un vistazo con quién está hablando.
 */
export async function guardarPerfil(
  _estado: EstadoPerfil,
  datos: FormData,
): Promise<EstadoPerfil> {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) return { error: "Tu sesión caducó. Vuelve a entrar." };

  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 2) return { error: "Escribe tu nombre." };

  const facturacion = Number(datos.get("facturacion") ?? 0) || null;
  const segmento =
    facturacion === null
      ? "desconocido"
      : facturacion >= 5_000_000
        ? "consulting"
        : "pce";

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: nombre,
      display_name: nombre.split(/\s+/)[0],
      phone: String(datos.get("telefono") ?? "").trim() || null,
      company_name: String(datos.get("empresa") ?? "").trim() || null,
      job_title: String(datos.get("cargo") ?? "").trim() || null,
      company_country_code: String(datos.get("pais") ?? "").trim() || null,
      company_city: String(datos.get("ciudad") ?? "").trim() || null,
      company_sector: String(datos.get("sector") ?? "").trim() || null,
      employees_count: Number(datos.get("empleados") ?? 0) || null,
      annual_revenue_usd: facturacion,
      segment: segmento,
      profile_completed_at: new Date().toISOString(),
    })
    .eq("id", sesion.usuario.id);

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/app");
  revalidatePath("/app/perfil");
  return { ok: "Perfil guardado." };
}

/** Guarda la preferencia de tema para que viaje con la cuenta. */
export async function guardarTema(tema: "claro" | "oscuro" | "sistema") {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) return;

  const supabase = await crearClienteServidor();
  await supabase.from("profiles").update({ theme: tema }).eq("id", sesion.usuario.id);
}
