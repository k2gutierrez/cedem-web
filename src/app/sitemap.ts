import type { MetadataRoute } from "next";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { supabaseConfigurado } from "@/lib/supabase/configurado";

/**
 * Mapa del sitio.
 *
 * Incluye las páginas públicas y las 186 fichas del archivo editorial: son las
 * que tienen que aparecer en los buscadores. Las páginas de la plataforma y las
 * legales quedan fuera a propósito (no aportan nada en resultados de búsqueda y
 * algunas ni siquiera deben indexarse).
 */

const BASE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.cedem.com.mx";

const PAGINAS: {
  ruta: string;
  prioridad: number;
  frecuencia: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { ruta: "/", prioridad: 1, frecuencia: "weekly" },
  { ruta: "/camino", prioridad: 0.9, frecuencia: "monthly" },
  { ruta: "/consulting", prioridad: 0.9, frecuencia: "monthly" },
  { ruta: "/pce", prioridad: 0.8, frecuencia: "monthly" },
  { ruta: "/master", prioridad: 0.8, frecuencia: "monthly" },
  { ruta: "/recursos", prioridad: 0.8, frecuencia: "weekly" },
  { ruta: "/equipo", prioridad: 0.7, frecuencia: "monthly" },
  { ruta: "/nosotros", prioridad: 0.7, frecuencia: "monthly" },
  { ruta: "/unete", prioridad: 0.7, frecuencia: "monthly" },
  { ruta: "/contacto", prioridad: 0.6, frecuencia: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date();

  const estaticas: MetadataRoute.Sitemap = PAGINAS.map((p) => ({
    url: `${BASE}${p.ruta}`,
    lastModified: ahora,
    changeFrequency: p.frecuencia,
    priority: p.prioridad,
  }));

  if (!supabaseConfigurado()) return estaticas;

  const supabase = await crearClienteServidor();

  const [{ data: articulos }, { data: consultores }] = await Promise.all([
    supabase
      .from("contents")
      .select("slug, published_at, updated_at")
      .eq("content_type", "articulo")
      .eq("status", "publicado")
      .eq("visibility", "publico")
      .order("published_at", { ascending: false })
      .limit(5000),
    supabase.from("consultants").select("slug, updated_at").eq("is_active", true),
  ]);

  const fichasArticulo: MetadataRoute.Sitemap = (articulos ?? []).map((a) => ({
    url: `${BASE}/recursos/${a.slug}`,
    lastModified: a.updated_at ? new Date(a.updated_at) : new Date(a.published_at ?? ahora),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const fichasConsultor: MetadataRoute.Sitemap = (consultores ?? []).map((c) => ({
    url: `${BASE}/equipo/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : ahora,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...estaticas, ...fichasArticulo, ...fichasConsultor];
}
