import {
  CATALOGO,
  ETIQUETAS_BASE,
  articulosPara,
  type ArticuloCatalogo,
} from "@/content/camino/catalogo";
import { supabaseConfigurado } from "@/lib/supabase/configurado";

/**
 * Los artículos que se recomiendan al terminar el Camino, resueltos contra la
 * plataforma.
 *
 * El catálogo del Camino se escribió cuando los 186 artículos todavía vivían en
 * el sitio anterior, así que guarda la URL de WordPress. Hoy los artículos están
 * en `/recursos/{slug}` y el slug es el mismo que el de WordPress, de modo que se
 * puede enlazar aquí dentro —mejor experiencia y sin depender de que el sitio
 * anterior siga en pie— y dejar la URL vieja solo como respaldo.
 *
 * Se resuelve de una vez para todo el historial: una consulta por arquetipo
 * distinto, no una por diagnóstico.
 */

export type ArticuloResuelto = ArticuloCatalogo & {
  /** Slug en la plataforma, si el artículo se migró. */
  slug: string | null;
  /** A dónde lleva el enlace: dentro de la plataforma o al sitio anterior. */
  href: string;
  /** `true` si el enlace lleva a un artículo de la plataforma. */
  interno: boolean;
};

/**
 * La clave con la que se busca un artículo del catálogo en la base.
 *
 * NO se deriva el slug de la URL. Se intentó y falla: el slug de WordPress y el
 * de la plataforma no siempre coinciden (`carencia-de-duenez` en el sitio viejo
 * es `empresarios-en-crecimiento-carencia-de-duenez` aquí, y
 * `disenando-la-eestrategia…` perdió una letra al migrar). El campo `legacy_url`
 * existe justo para esto: guarda la URL original de cada artículo migrado y es
 * la única correspondencia fiable.
 */
export function rutaDeUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?cedem\.com\.mx/, "").replace(/\/$/, "");
}

/**
 * El mapa de rutas antiguas → slug actual, para el catálogo del Camino.
 *
 * El recorrido es un componente de cliente: no puede consultar la base. Este
 * mapa se resuelve en el servidor y viaja como prop (son 22 entradas), de modo
 * que las recomendaciones enlacen a la plataforma sin que el navegador tenga que
 * pedir nada.
 */
export async function mapaDeCatalogo(): Promise<Record<string, string>> {
  if (!supabaseConfigurado()) return {};

  const rutas = [...new Set(CATALOGO.map((a) => rutaDeUrl(a.url)))];

  const { crearClienteServidor } = await import("@/lib/supabase/cliente-servidor");
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("contents")
    .select("slug, legacy_url")
    .eq("content_type", "articulo")
    .eq("status", "publicado")
    .not("legacy_url", "is", null);

  const mapa: Record<string, string> = {};
  for (const fila of data ?? []) {
    const ruta = rutaDeUrl(String(fila.legacy_url));
    if (rutas.includes(ruta)) mapa[ruta] = fila.slug as string;
  }
  return mapa;
}

export async function articulosDe(
  arquetipos: string[],
  maximo = 3,
): Promise<Map<string, ArticuloResuelto[]>> {
  const unicos = [...new Set(arquetipos)];
  const porArquetipo = new Map<string, ArticuloCatalogo[]>(
    unicos.map((a) => [a, articulosPara(ETIQUETAS_BASE[a] ?? [], maximo)]),
  );

  // Todas las rutas candidatas, en una consulta.
  const candidatos = [...new Set([...porArquetipo.values()].flat().map((a) => rutaDeUrl(a.url)))];

  const porRuta = new Map<string, string>(); // ruta antigua -> slug actual

  if (supabaseConfigurado() && candidatos.length) {
    const { crearClienteServidor } = await import("@/lib/supabase/cliente-servidor");
    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("contents")
      .select("slug, legacy_url")
      .eq("content_type", "articulo")
      .eq("status", "publicado")
      .not("legacy_url", "is", null);

    for (const fila of data ?? []) {
      const ruta = rutaDeUrl(String(fila.legacy_url));
      if (candidatos.includes(ruta)) porRuta.set(ruta, fila.slug as string);
    }
  }

  const resolver = (articulo: ArticuloCatalogo): ArticuloResuelto => {
    const slug = porRuta.get(rutaDeUrl(articulo.url));
    return {
      ...articulo,
      slug: slug ?? null,
      href: slug ? `/recursos/${slug}` : articulo.url,
      interno: Boolean(slug),
    };
  };

  return new Map(
    [...porArquetipo.entries()].map(([arquetipo, articulos]) => [
      arquetipo,
      articulos.map(resolver),
    ]),
  );
}
