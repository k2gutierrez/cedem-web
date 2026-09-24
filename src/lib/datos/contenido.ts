import { agruparEnAreas, equipo as equipoSemilla } from "@/content/equipo";
import { casos, datosDeMercado, servicios, viajeDelDueno } from "@/content/site";
import { supabaseConfigurado } from "@/lib/supabase/configurado";

/**
 * Capa de datos del sitio.
 *
 * HOY: devuelve el contenido semilla de `src/content/`, escrito a partir de la
 * investigación verificada. Así el sitio es estático, rápido y se puede revisar
 * sin depender de la base de datos.
 *
 * MAÑANA (Fase 2): estas mismas funciones consultan Supabase. Las páginas no
 * cambian, porque ya llaman a funciones asíncronas. Ese es el motivo de que
 * existan aunque hoy solo devuelvan constantes.
 *
 * Regla de visibilidad: el cuerpo completo del contenido premium se resuelve
 * SIEMPRE en el servidor. Si el rol no da acceso, la fila del cuerpo no llega
 * nunca al navegador (ver docs/04-modelo-de-datos.md).
 */

/** Indica de dónde salió el contenido, para poder verificarlo en el HTML. */
export type Origen = "base-de-datos" | "semilla-local";

export async function obtenerOrigen(): Promise<Origen> {
  return supabaseConfigurado() ? "base-de-datos" : "semilla-local";
}

export async function obtenerViajeDelDueno() {
  // Fase 2: select * from site_settings / tabla propia, ordenado por `orden`
  return viajeDelDueno;
}

export async function obtenerPuertas() {
  // Fase 2: select * from services where activo order by orden
  return servicios;
}

export async function obtenerCasos() {
  // Fase 2: select * from case_studies where publicado order by orden
  return casos;
}

export type ArticuloDestacado = {
  slug: string;
  /** El título que se muestra: el gancho editorial si lo hay, si no el real. */
  titulo: string;
  /** El título con el que se publicó. Se cita debajo, para no confundir a nadie. */
  tituloOriginal: string;
  extracto: string;
  etiquetas: string[];
  publicado: string | null;
  minutos: number | null;
};

/**
 * Los artículos que la home y /recursos muestran abiertos.
 *
 * Antes eran una lista escrita en `src/content/site.ts` que apuntaba con enlaces
 * al WordPress actual: la página se veía bien, pero el contenido no vivía en la
 * base y el equipo no podía cambiar la selección sin tocar código. Ahora se leen
 * de `contents` por la marca `is_featured`, que el administrador pone desde el
 * panel, y enlazan a `/recursos/{slug}` — dentro de la plataforma.
 *
 * El respaldo a la semilla se quedó fuera a propósito: si no hay base, el sitio
 * no inventa artículos; sencillamente no muestra la selección.
 */
export async function obtenerArticulosDestacados(limite = 3): Promise<ArticuloDestacado[]> {
  if (!supabaseConfigurado()) return [];

  const { crearClienteServidor } = await import("@/lib/supabase/cliente-servidor");
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("contents")
    .select(
      "slug, title, subtitle, excerpt, summary, published_at, reading_minutes, content_tags(tags(label))",
    )
    .eq("content_type", "articulo")
    .eq("status", "publicado")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(limite);

  if (error || !data) return [];

  return data.map((a) => {
    // La relación llega como objeto o como arreglo según la cardinalidad que
    // infiere PostgREST: se normaliza antes de leerla.
    const etiquetas = ((a.content_tags ?? []) as unknown as {
      tags: { label: string } | { label: string }[] | null;
    }[])
      .flatMap((t) => {
        const etiqueta = t?.tags;
        if (!etiqueta) return [];
        return Array.isArray(etiqueta) ? etiqueta.map((e) => e.label) : [etiqueta.label];
      })
      .filter((l): l is string => Boolean(l));

    /* El gancho vive en `subtitle` y el título real en `title`. Los artículos
       migrados traen el título de WordPress en mayúsculas ("LASTRES DEL
       CRECIMIENTO"), que funciona en el archivo pero no como anzuelo en la
       portada. Con esta separación, el artículo conserva su título para el
       buscador y la ficha, y la portada puede usar una frase que invite a leer.
       Los dos campos se editan desde el panel. */
    const gancho = (a.subtitle ?? "").trim();

    return {
      slug: a.slug as string,
      titulo: gancho || (a.title as string),
      tituloOriginal: a.title as string,
      extracto: ((a.excerpt ?? a.summary ?? "") as string).slice(0, 240),
      etiquetas,
      publicado: a.published_at as string | null,
      minutos: a.reading_minutes as number | null,
    };
  });
}

export async function obtenerDatosDeMercado() {
  // Fase 2: contenido administrable, porque estas cifras cambian con el tiempo
  return datosDeMercado;
}

/* -------------------------------------------------------------------------- */
/* Equipo                                                                     */
/* -------------------------------------------------------------------------- */

export type PersonaEquipo = {
  nombre: string;
  cargo: string;
  /** Slug de su ficha pública. Sin él, la tarjeta no enlaza a ningún lado. */
  slug?: string | null;
  linkedin?: string | null;
  especialidades?: string[] | null;
};

export type AreaPublica = {
  titulo: string;
  descripcion: string;
  personas: PersonaEquipo[];
};

/**
 * El equipo que se muestra en el sitio.
 *
 * Lee de la tabla `consultants` (lo que el administrador carga desde el panel).
 * Si todavía no hay nadie registrado, devuelve el contenido semilla verificado
 * con la firma, para que la página nunca aparezca vacía.
 */
export async function obtenerEquipo(): Promise<{
  areas: AreaPublica[];
  origen: Origen;
}> {
  const semilla = () => ({
    areas: equipoSemilla.map((area) => ({
      titulo: area.titulo as string,
      descripcion: area.descripcion as string,
      personas: area.personas.map((p) => ({
        nombre: p.nombre as string,
        cargo: p.cargo as string,
      })) as PersonaEquipo[],
    })),
    origen: "semilla-local" as Origen,
  });

  if (!supabaseConfigurado()) return semilla();

  const { crearClienteServidor } = await import("@/lib/supabase/cliente-servidor");
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("consultants")
    .select("full_name, slug, headline, linkedin_url, specialties, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order");

  if (error || !data?.length) return semilla();

  const personas = data.map((c) => ({
    nombre: c.full_name as string,
    cargo: (c.headline as string) ?? "Consultor",
    slug: c.slug as string,
    linkedin: c.linkedin_url as string | null,
    especialidades: (c.specialties as string[] | null) ?? null,
  }));

  // `agruparEnAreas` viene del contenido semilla con arreglos de solo lectura:
  // se copian a arreglos mutables para el tipo público.
  const areas: AreaPublica[] = agruparEnAreas(personas).map((area) => ({
    titulo: area.titulo,
    descripcion: area.descripcion,
    personas: area.personas.map((p) => ({
      nombre: p.nombre,
      cargo: p.cargo,
      slug: (p as { slug?: string }).slug ?? null,
    })),
  }));

  return { areas, origen: "base-de-datos" };
}

/* -------------------------------------------------------------------------- */
/* Artículos publicados                                                       */
/* -------------------------------------------------------------------------- */

export type ArticuloPublicado = {
  slug: string;
  titulo: string;
  extracto: string;
  visibilidad: "publico" | "free_registrado" | "premium";
  publicado: string | null;
  esPremium: boolean;
};

/**
 * Los artículos que el administrador publicó desde el panel.
 *
 * Devuelve solo el extracto: el cuerpo completo lo resuelve la página de detalle
 * según el rol, y para el contenido premium ni siquiera viaja al navegador
 * (ver docs/04-modelo-de-datos.md).
 */
export async function obtenerArticulosPublicados(limite = 12): Promise<ArticuloPublicado[]> {
  if (!supabaseConfigurado()) return [];

  const { crearClienteServidor } = await import("@/lib/supabase/cliente-servidor");
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("contents")
    .select("slug, title, excerpt, summary, visibility, published_at")
    .eq("content_type", "articulo")
    .eq("status", "publicado")
    .order("published_at", { ascending: false })
    .limit(limite);

  if (error || !data) return [];

  return data.map((a) => ({
    slug: a.slug as string,
    titulo: a.title as string,
    extracto: ((a.excerpt ?? a.summary ?? "") as string).slice(0, 260),
    visibilidad: a.visibility as ArticuloPublicado["visibilidad"],
    publicado: a.published_at as string | null,
    esPremium: a.visibility === "premium",
  }));
}

/* -------------------------------------------------------------------------- */
/* Buscador                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Busca en el archivo editorial.
 *
 * Usa el índice de texto completo de PostgreSQL en español (`search_vector`),
 * no un `ilike`: así "sucesion" encuentra "sucesión", y "abandonar" encuentra
 * los artículos que hablan de abandonar aunque no usen esa palabra exacta.
 */
export async function buscarArticulos(
  consulta: string,
  limite = 24,
): Promise<ArticuloPublicado[]> {
  const termino = consulta.trim();
  if (!supabaseConfigurado() || termino.length < 2) return [];

  const { crearClienteServidor } = await import("@/lib/supabase/cliente-servidor");
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("contents")
    .select("slug, title, excerpt, summary, visibility, published_at")
    .eq("content_type", "articulo")
    .eq("status", "publicado")
    .textSearch("search_vector", termino, { config: "spanish", type: "websearch" })
    .order("published_at", { ascending: false })
    .limit(limite);

  if (error || !data) return [];

  return data.map((a) => ({
    slug: a.slug as string,
    titulo: a.title as string,
    extracto: ((a.excerpt ?? a.summary ?? "") as string).slice(0, 240),
    visibilidad: a.visibility as ArticuloPublicado["visibilidad"],
    publicado: a.published_at as string | null,
    esPremium: a.visibility === "premium",
  }));
}
