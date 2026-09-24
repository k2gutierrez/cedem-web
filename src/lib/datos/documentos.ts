import { supabaseConfigurado } from "@/lib/supabase/configurado";

/**
 * Los documentos metodológicos, leídos de la base.
 *
 * Antes esta lista vivía escrita a mano dentro de la página de la biblioteca:
 * once títulos que no se podían abrir ni descargar. Ahora son contenido de
 * verdad —ficha, cuerpo y archivo— y el administrador puede publicar o retirar
 * un documento sin tocar código.
 *
 * El cuerpo se pide a `v_contents_for_viewer`, la misma vista que usa el
 * artículo: si quien pregunta no tiene membresía, la vista devuelve el primer
 * párrafo y `is_body_truncated = true`. El texto completo de un documento
 * reservado **nunca sale de la base**.
 */

export type DocumentoMetodo = {
  slug: string;
  titulo: string;
  resumen: string;
  extracto: string;
  eje: string;
  ejeLabel: string;
  /** Orden de lectura del eje: lo fija la etiqueta en la base, no la fecha. */
  ejeOrden: number;
  paginas: number | null;
  palabras: number | null;
  minutos: number | null;
  tamanoBytes: number | null;
  autor: string | null;
  derechos: string | null;
  esPremium: boolean;
};

export type DocumentoCompleto = DocumentoMetodo & {
  id: string;
  cuerpo: string | null;
  /** Cómo está escrito el cuerpo: lo decide quien lo importó, no quien lo pinta. */
  formato: "markdown" | "html";
  truncado: boolean;
};

type FilaEtiqueta = { tags: { slug: string; label: string; sort_order: number } | null } | null;

type FilaDocumento = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  excerpt: string | null;
  visibility: "publico" | "free_registrado" | "premium";
  reading_minutes: number | null;
  documents: {
    pages: number | null;
    file_size_bytes: number | null;
    author_label: string | null;
    rights_notice: string | null;
    is_downloadable: boolean;
  } | null;
  content_tags: FilaEtiqueta[] | null;
};

const CAMPOS =
  "id, slug, title, summary, excerpt, visibility, reading_minutes, " +
  "documents(pages, file_size_bytes, author_label, rights_notice, is_downloadable), " +
  "content_tags(tags(slug, label, sort_order))";

function aDocumento(fila: FilaDocumento): DocumentoMetodo {
  const etiqueta = fila.content_tags?.find((t) => t?.tags)?.tags ?? null;

  return {
    slug: fila.slug,
    titulo: fila.title,
    resumen: fila.summary ?? "",
    extracto: fila.excerpt ?? "",
    eje: etiqueta?.slug ?? "otros",
    ejeLabel: etiqueta?.label ?? "Otros documentos",
    ejeOrden: etiqueta?.sort_order ?? 999,
    paginas: fila.documents?.pages ?? null,
    palabras: null,
    minutos: fila.reading_minutes,
    tamanoBytes: fila.documents?.file_size_bytes ?? null,
    autor: fila.documents?.author_label ?? null,
    derechos: fila.documents?.rights_notice ?? null,
    esPremium: fila.visibility === "premium",
  };
}

/** Todos los documentos publicados, en el orden en que se estudian. */
export async function obtenerDocumentosMetodo(): Promise<DocumentoMetodo[]> {
  if (!supabaseConfigurado()) return [];

  const { crearClienteServidor } = await import("@/lib/supabase/cliente-servidor");
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("contents")
    .select(CAMPOS)
    .eq("content_type", "documento")
    .eq("status", "publicado")
    .order("created_at");

  if (error || !data) return [];

  const documentos = (data as unknown as FilaDocumento[])
    .map(aDocumento)
    .filter((d) => d.slug && d.titulo);

  // El orden de lectura lo marca el eje (fundamentos, rol, generar, multiplicar,
  // capturar), no la fecha de importación: el `sort_order` vive en la etiqueta.
  return documentos.sort((a, b) => a.ejeOrden - b.ejeOrden);
}

/** Un documento con su cuerpo, ya filtrado por la vista según el derecho. */
export async function obtenerDocumentoMetodo(
  slug: string,
): Promise<DocumentoCompleto | null> {
  if (!supabaseConfigurado()) return null;

  const { crearClienteServidor } = await import("@/lib/supabase/cliente-servidor");
  const supabase = await crearClienteServidor();

  // Todo sale de la vista: la ficha, el cuerpo (completo o cortado) y los datos
  // del archivo. Lo único que la vista NO expone es la ruta en Storage, y es a
  // propósito: la ruta solo la entrega `get_download_path()` a quien tiene
  // derecho, y esa llamada queda registrada en `access_logs`.
  const { data, error } = await supabase
    .from("v_contents_for_viewer")
    .select(
      "id, slug, title, summary, excerpt, body_md, is_body_truncated, visibility, " +
        "reading_minutes, author_label, document_pages, rights_notice, is_downloadable, tags, body_format",
    )
    .eq("slug", slug)
    .eq("content_type", "documento")
    .eq("status", "publicado")
    .maybeSingle();

  if (error || !data) return null;

  const fila = data as unknown as {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    excerpt: string | null;
    body_md: string | null;
    body_format: "markdown" | "html" | null;
    is_body_truncated: boolean;
    visibility: "publico" | "free_registrado" | "premium";
    reading_minutes: number | null;
    author_label: string | null;
    document_pages: number | null;
    rights_notice: string | null;
    is_downloadable: boolean | null;
    tags: { slug: string; label: string }[] | null;
  };

  const etiqueta = fila.tags?.[0] ?? null;

  return {
    id: fila.id,
    slug: fila.slug,
    titulo: fila.title,
    resumen: fila.summary ?? "",
    extracto: fila.excerpt ?? "",
    eje: etiqueta?.slug ?? "otros",
    ejeLabel: etiqueta?.label ?? "Documento del método",
    ejeOrden: 0,
    paginas: fila.document_pages,
    palabras: null,
    minutos: fila.reading_minutes,
    tamanoBytes: null,
    autor: fila.author_label,
    derechos: fila.rights_notice,
    esPremium: fila.visibility === "premium",
    cuerpo: fila.body_md,
    formato: fila.body_format ?? "markdown",
    truncado: fila.is_body_truncated,
  };
}
