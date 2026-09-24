import { ETIQUETAS_BASE, articulosPara, type ArticuloCatalogo } from "@/content/camino/catalogo";
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
  /** Ruta interna si el artículo está publicado en la plataforma. */
  href: string;
  /** `true` si el enlace lleva a un artículo de la plataforma. */
  interno: boolean;
};

/** El slug de un artículo del catálogo, sacado de su URL de WordPress. */
export function slugDeUrl(url: string): string {
  const partes = url.replace(/\/$/, "").split("/");
  return partes[partes.length - 1] ?? "";
}

export async function articulosDe(
  arquetipos: string[],
  maximo = 3,
): Promise<Map<string, ArticuloResuelto[]>> {
  const unicos = [...new Set(arquetipos)];
  const porArquetipo = new Map<string, ArticuloCatalogo[]>(
    unicos.map((a) => [a, articulosPara(ETIQUETAS_BASE[a] ?? [], maximo)]),
  );

  // Todos los slugs candidatos, en una consulta.
  const candidatos = [
    ...new Set([...porArquetipo.values()].flat().map((a) => slugDeUrl(a.url))),
  ];

  const publicados = new Set<string>();

  if (supabaseConfigurado() && candidatos.length) {
    const { crearClienteServidor } = await import("@/lib/supabase/cliente-servidor");
    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("contents")
      .select("slug")
      .eq("content_type", "articulo")
      .eq("status", "publicado")
      .in("slug", candidatos);

    for (const fila of data ?? []) publicados.add(fila.slug as string);
  }

  const resolver = (articulo: ArticuloCatalogo): ArticuloResuelto => {
    const slug = slugDeUrl(articulo.url);
    const interno = publicados.has(slug);
    return {
      ...articulo,
      href: interno ? `/recursos/${slug}` : articulo.url,
      interno,
    };
  };

  return new Map(
    [...porArquetipo.entries()].map(([arquetipo, articulos]) => [
      arquetipo,
      articulos.map(resolver),
    ]),
  );
}
