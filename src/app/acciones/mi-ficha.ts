"use server";

import { revalidatePath } from "next/cache";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/**
 * El consultor edita su propia ficha pública.
 *
 * QUÉ PUEDE CAMBIAR Y QUÉ NO
 *
 * La lista de campos editables **no está aquí**: la impone un disparador de la base
 * (`consultants_guard`). Un consultor puede cambiar su nombre, su cargo, su
 * biografía, su ubicación, su foto, su CV, sus enlaces, sus especialidades, sus
 * idiomas y el año en que empezó; y **no** puede tocarse el `slug`, el orden, si
 * aparece o no en la página, ni si es fundador. Eso es de la firma.
 *
 * Repetir esa lista en TypeScript habría sido tener dos versiones de la misma
 * regla, y la que se olvidaría de actualizar es esta. Aquí solo se envían los
 * campos del formulario; si alguno no estuviera permitido, la base lo rechaza con
 * un mensaje que dice exactamente cuál.
 */
export type EstadoFicha = { error?: string; ok?: string };

/** Convierte "uno, dos ; tres" en una lista limpia. */
function aLista(valor: FormDataEntryValue | null): string[] | null {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;

  return texto
    .split(/[,;\n]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export async function guardarMiFicha(
  _estado: EstadoFicha,
  datos: FormData,
): Promise<EstadoFicha> {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) return { error: "Inicia sesión." };

  const supabase = await crearClienteServidor();

  // Se busca la ficha por el perfil de quien está dentro: no se acepta un id del
  // formulario, para que nadie pueda editar la ficha de otro cambiando un campo.
  const { data: ficha } = await supabase
    .from("consultants")
    .select("id")
    .eq("profile_id", sesion.usuario.id)
    .maybeSingle();

  if (!ficha) {
    return {
      error:
        "Tu cuenta no está ligada a una ficha de consultor. Pídele al equipo de CEDEM que la cree desde el panel.",
    };
  }

  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 4) return { error: "Escribe tu nombre completo." };

  const anio = Number(datos.get("inicio") ?? 0);

  const cambios = {
    full_name: nombre,
    headline: String(datos.get("cargo") ?? "").trim() || null,
    location: String(datos.get("ubicacion") ?? "").trim() || null,
    bio_md: String(datos.get("bio") ?? "").trim() || null,
    linkedin_url: String(datos.get("linkedin") ?? "").trim() || null,
    x_url: String(datos.get("x") ?? "").trim() || null,
    website_url: String(datos.get("sitio") ?? "").trim() || null,
    email_public: String(datos.get("correo") ?? "").trim() || null,
    specialties: aLista(datos.get("especialidades")),
    languages: aLista(datos.get("idiomas")),
    started_year: Number.isFinite(anio) && anio > 1900 && anio < 2100 ? anio : null,
  };

  const { error } = await supabase.from("consultants").update(cambios).eq("id", ficha.id);

  if (error) {
    console.error("[mi-ficha] no se pudo guardar:", error.message);

    // El disparador de la base explica qué campo no se puede tocar: se muestra.
    if (/no puede modificar|Solo puedes editar/i.test(error.message)) {
      return { error: error.message };
    }
    return { error: "No pudimos guardar tu ficha. Vuelve a intentarlo." };
  }

  revalidatePath("/app/mi-ficha");
  revalidatePath("/equipo");
  revalidatePath(`/equipo/${datos.get("slug") ?? ""}`);

  return { ok: "Tu ficha quedó actualizada. Ya se ve en la página de Equipo." };
}
