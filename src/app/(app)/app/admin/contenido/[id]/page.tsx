import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cambiarEstado } from "@/app/acciones/contenido";
import {
  FormularioContenido,
  type ContenidoEditable,
} from "@/components/admin/FormularioContenido";
import { Container } from "@/components/ui/Container";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Editar contenido",
  robots: { index: false, follow: false },
};

const ETIQUETA_ESTADO: Record<string, string> = {
  borrador: "Borrador",
  programado: "Programado",
  publicado: "Publicado",
  archivado: "Archivado",
};

/**
 * Editar un contenido que ya existe.
 *
 * Es la pantalla que faltaba: el panel permitía crear, publicar, archivar y
 * destacar, pero no **editar**. Corregir una errata, cambiar el resumen, pasar un
 * artículo de público a premium o convertirlo en documento exigía tocar la base a
 * mano.
 *
 * Aquí también se cambia el estado, porque editar y publicar son la misma decisión
 * en la cabeza de quien escribe: corriges el texto y lo vuelves a publicar.
 */
export default async function PaginaEditarContenido(
  props: PageProps<"/app/admin/contenido/[id]">,
) {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/app");

  const { id } = await props.params;
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("contents")
    .select(
      "id, content_type, slug, title, summary, excerpt, visibility, status, published_at, " +
        "content_bodies(body_md), articles(consultant_id, authored_by_cedem), " +
        // OJO: `file_path` NO se pide. La migración 18 retiró ese privilegio a
        // `authenticated` —la ruta solo la entrega `get_download_path()`— y pedirla
        // aquí hace fallar la consulta entera. Con el tipo MIME basta para saber si
        // el documento ya tiene su PDF.
        "documents(file_mime, pages)",
    )
    .eq("id", id)
    .maybeSingle();

  /* Las relaciones anidadas llegan como arreglo u objeto según la cardinalidad que
     infiere PostgREST, y el tipo generado no lo sabe. Se normaliza aquí, una vez. */
  const contenido = data as unknown as {
    id: string;
    content_type: string;
    slug: string;
    title: string;
    summary: string | null;
    excerpt: string | null;
    visibility: string;
    status: string;
    published_at: string | null;
    content_bodies: { body_md: string }[] | { body_md: string } | null;
    articles: { consultant_id: string | null; authored_by_cedem: boolean | null }[] | null;
    documents: { file_mime: string | null; pages: number | null }[] | null;
  } | null;

  if (!contenido) notFound();

  const primero = <T,>(valor: T[] | T | null | undefined): T | null =>
    Array.isArray(valor) ? (valor[0] ?? null) : (valor ?? null);

  const { data: consultores } = await supabase
    .from("consultants")
    .select("id, full_name")
    .eq("is_active", true)
    .order("sort_order");

  const cuerpo = primero(contenido.content_bodies);
  const articulo = primero(contenido.articles);
  const documento = primero(contenido.documents);

  const editable: ContenidoEditable = {
    id: contenido.id,
    content_type: contenido.content_type,
    title: contenido.title,
    summary: contenido.summary,
    excerpt: contenido.excerpt,
    visibility: contenido.visibility,
    status: contenido.status,
    slug: contenido.slug,
    consultant_id: articulo?.consultant_id ?? null,
    authored_by_cedem: articulo?.authored_by_cedem ?? null,
    body_md: cuerpo?.body_md ?? "",
    document_conArchivo: Boolean(documento?.file_mime),
    document_pages: documento?.pages ?? null,
  };

  const publicado = contenido.status === "publicado";

  return (
    <Container size="ancho">
      <nav aria-label="Ruta" className="text-sm text-fg-subtle">
        <Link href="/app/admin/contenido" className="hover:text-cyan dark:hover:text-sky">
          Contenido
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-fg-muted">Editar</span>
      </nav>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="tagline text-cyan dark:text-sky">Administración</p>
          <h1 className="mt-3 text-h1 text-fg">{contenido.title}</h1>
          <p className="mt-3 text-sm text-fg-muted">
            {ETIQUETA_ESTADO[contenido.status] ?? contenido.status}
            {contenido.published_at
              ? ` · ${new Date(contenido.published_at).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}`
              : ""}
            {" · "}
            {contenido.content_type}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {publicado ? (
            <Link
              href={
                contenido.content_type === "documento"
                  ? `/app/biblioteca/${contenido.slug}`
                  : `/recursos/${contenido.slug}`
              }
              className="rounded-full border border-border px-4 py-2 font-display text-sm font-semibold text-fg-muted transition-colors hover:border-cyan hover:text-fg dark:hover:border-sky"
            >
              Ver como lo ve el público
            </Link>
          ) : null}

          <form action={cambiarEstado}>
            <input type="hidden" name="id" value={contenido.id} />
            <input type="hidden" name="estado" value={publicado ? "borrador" : "publicado"} />
            <button
              type="submit"
              className={`rounded-full px-4 py-2 font-display text-sm font-semibold transition-colors ${
                publicado
                  ? "border border-border text-fg-muted hover:border-amber-300 hover:text-amber-800 dark:hover:text-amber-300"
                  : "bg-navy text-white hover:bg-cyan dark:bg-sky dark:text-navy"
              }`}
            >
              {publicado ? "Despublicar" : "Publicar"}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="rounded-3xl border border-border bg-bg p-7 sm:p-9">
          <FormularioContenido
            consultores={(consultores ?? []).map((c) => ({
              id: c.id as string,
              nombre: c.full_name as string,
            }))}
            contenido={editable}
          />
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-bg-soft p-5">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-fg-subtle">
              Qué cambia con cada campo
            </h2>
            <dl className="mt-3 space-y-3 text-xs leading-relaxed text-fg-muted">
              <div>
                <dt className="font-semibold text-fg">Tipo</dt>
                <dd>
                  Cambiarlo mueve el contenido de sección y retira los datos del tipo
                  anterior. Un artículo que pasa a documento pierde su autoría y espera un
                  PDF.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-fg">Quién puede verlo</dt>
                <dd>
                  <b>Público</b> lo abre a cualquiera; <b>Registrado</b> pide cuenta gratis;{" "}
                  <b>Premium</b> es solo para miembros. En los tres casos, el primer párrafo
                  (o el extracto, si lo escribes) se ve sin permiso: es el anzuelo.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-fg">Autoría</dt>
                <dd>
                  Solo aplica a los artículos. Al elegir a un consultor, el artículo aparece
                  en su ficha pública.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-fg">La dirección</dt>
                <dd>
                  No se puede cambiar desde aquí, a propósito: rompería los enlaces
                  compartidos y el posicionamiento. Si de verdad hace falta otra, se decide
                  aparte y con una redirección.
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-bg p-5">
            <p className="text-xs leading-relaxed text-fg-muted">
              Los cambios se ven al instante en el sitio público. La base valida lo que no
              se puede publicar —sin cuerpo, o un artículo sin autoría— y si algo falta lo
              dice con su nombre.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
