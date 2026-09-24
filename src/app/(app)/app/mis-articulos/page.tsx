import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorArticulo, type ArticuloPropio } from "@/components/app/EditorArticulo";
import { Revelar } from "@/components/fx/Efectos";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Mis artículos",
  robots: { index: false, follow: false },
};

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  borrador: {
    texto: "Borrador",
    clase: "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200",
  },
  publicado: {
    texto: "Publicado",
    clase: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  archivado: {
    texto: "Archivado",
    clase: "border border-border text-fg-subtle",
  },
  programado: {
    texto: "Programado",
    clase: "bg-sky/20 text-navy dark:text-sky",
  },
};

/**
 * El espacio de escritura del consultor.
 *
 * QUÉ RESUELVE
 *
 * Un consultor tiene las historias y los casos —es quien está sentado con los
 * dueños— pero no tenía dónde escribirlos. El panel de contenido es de
 * administración, así que su artículo había que dictárselo a alguien del equipo.
 *
 * Aquí escribe y guarda cuando quiera. Lo que publica lo decide CEDEM: un artículo
 * con la firma de la firma es la voz de la firma, y publicar es una decisión
 * editorial, no un permiso técnico. Eso está dicho en la pantalla, no escondido.
 */
export default async function PaginaMisArticulos(props: PageProps<"/app/mis-articulos">) {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) redirect("/acceso?destino=/app/mis-articulos");

  const supabase = await crearClienteServidor();

  const { data: ficha } = await supabase
    .from("consultants")
    .select("id, full_name, slug")
    .eq("profile_id", sesion.usuario.id)
    .maybeSingle();

  if (!ficha) {
    return (
      <Container size="estrecho">
        <p className="tagline text-cyan dark:text-sky">Tu cuenta</p>
        <h1 className="mt-3 text-h1 text-fg">Mis artículos</h1>
        <div className="mt-8 rounded-2xl border border-border bg-bg p-8">
          <p className="font-display text-base font-bold text-fg">
            Tu cuenta todavía no es de consultor
          </p>
          <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-fg-muted">
            Este espacio es para el equipo de CEDEM. Si escribes para la firma, pídele al
            equipo que cree tu ficha de consultor y quedará habilitado.
          </p>
          <div className="mt-6">
            <BotonEnlace href="/app" variante="secundario">
              Volver a mi panel
            </BotonEnlace>
          </div>
        </div>
      </Container>
    );
  }

  /* Solo los suyos. La RLS deja ver el archivo completo —187 artículos— así que el
     filtro se pone aquí a propósito.

     Se pide la autoría anidada y se filtra en memoria en lugar de usar el filtro
     por relación de PostgREST: son 187 filas, no merece la pena depender de una
     sintaxis que falla en silencio si el nombre de la relación cambia, y así el
     criterio ("es suyo si la autoría es su ficha") queda escrito donde se lee. */
  const { data: articulos } = await supabase
    .from("contents")
    .select("id, title, slug, status, summary, published_at, articles(consultant_id)")
    .eq("content_type", "articulo")
    .order("updated_at", { ascending: false })
    .limit(300);

  const { id } = await props.searchParams;
  const enEdicion = typeof id === "string" ? id : null;

  const suyos = ((articulos ?? []) as unknown as {
    id: string;
    title: string;
    slug: string;
    status: string;
    summary: string | null;
    published_at: string | null;
    articles: { consultant_id: string | null } | { consultant_id: string | null }[] | null;
  }[])
    .filter((a) => {
      const autoria = Array.isArray(a.articles) ? a.articles[0] : a.articles;
      return autoria?.consultant_id === ficha.id;
    })
    .map(({ id, title, slug, status, summary, published_at }) => ({
      id,
      title,
      slug,
      status,
      summary,
      published_at,
    }));

  const borrador = enEdicion ? suyos.find((a) => a.id === enEdicion) : null;

  let cuerpoEdicion = "";
  if (borrador) {
    const { data } = await supabase
      .from("content_bodies")
      .select("body_md")
      .eq("content_id", borrador.id)
      .maybeSingle();
    cuerpoEdicion = (data?.body_md as string) ?? "";
  }

  const articuloEditable: ArticuloPropio | undefined =
    borrador && borrador.status === "borrador"
      ? {
          id: borrador.id,
          title: borrador.title,
          summary: borrador.summary,
          excerpt: null,
          status: borrador.status,
          slug: borrador.slug,
          published_at: borrador.published_at,
          body_md: cuerpoEdicion,
        }
      : undefined;

  const publicados = suyos.filter((a) => a.status === "publicado").length;
  const enBorrador = suyos.filter((a) => a.status === "borrador").length;

  return (
    <Container size="ancho">
      <Revelar>
        <p className="tagline text-cyan dark:text-sky">Tu cuenta</p>
        <h1 className="mt-3 text-h1 text-fg">Mis artículos</h1>
        <p className="mt-4 max-w-[62ch] text-lead text-fg-muted">
          Escribe lo que ves en las juntas: el caso que se repite, el error que nadie
          nombra, la decisión que cambió el rumbo de una empresa. Tu artículo sale firmado
          con tu nombre y aparece en tu ficha pública.
        </p>
      </Revelar>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { etiqueta: "Publicados", valor: publicados },
          { etiqueta: "En borrador", valor: enBorrador },
          { etiqueta: "En total", valor: suyos.length },
        ].map((cifra, i) => (
          <Revelar key={cifra.etiqueta} retraso={i * 0.06}>
            <div className="rounded-2xl border border-border bg-bg p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
                {cifra.etiqueta}
              </p>
              <p className="mt-2 font-display text-2xl font-bold text-fg">{cifra.valor}</p>
            </div>
          </Revelar>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* El editor */}
        <div className="rounded-3xl border border-border bg-bg p-7 sm:p-9">
          <h2 className="font-display text-lg font-bold text-fg">
            {articuloEditable ? "Seguir escribiendo" : "Escribir un artículo nuevo"}
          </h2>
          <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-fg-muted">
            Se guarda como borrador tantas veces como quieras. Cuando esté listo, avísale al
            equipo de CEDEM y lo publica: así lo revisa alguien más antes de que salga con
            el nombre de la firma.
          </p>
          <div className="mt-7">
            <EditorArticulo articulo={articuloEditable} />
          </div>
        </div>

        {/* Sus artículos */}
        <aside>
          <h2 className="font-display text-[13px] font-bold uppercase tracking-wider text-fg-subtle">
            Lo que has escrito
          </h2>

          {suyos.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-border bg-bg-soft p-5 text-[13px] leading-relaxed text-fg-muted">
              Todavía no has escrito nada. El primer artículo suele ser el caso que más veces
              has tenido que explicar en una junta.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {suyos.map((articulo) => {
                const etiqueta = ETIQUETA_ESTADO[articulo.status] ?? ETIQUETA_ESTADO.borrador;
                const esBorrador = articulo.status === "borrador";

                return (
                  <li
                    key={articulo.id}
                    className="rounded-2xl border border-border bg-bg p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="font-display text-[14px] font-semibold leading-snug text-fg">
                        {articulo.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${etiqueta.clase}`}
                      >
                        {etiqueta.texto}
                      </span>
                    </div>

                    {articulo.summary ? (
                      <p className="mt-2 text-[12.5px] leading-relaxed text-fg-muted">
                        {articulo.summary}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
                      {esBorrador ? (
                        <Link
                          href={`/app/mis-articulos?id=${articulo.id}`}
                          className="font-semibold text-navy hover:text-cyan dark:text-sky"
                        >
                          Seguir escribiendo
                        </Link>
                      ) : (
                        <Link
                          href={`/recursos/${articulo.slug}`}
                          className="font-semibold text-navy hover:text-cyan dark:text-sky"
                        >
                          Verlo publicado
                        </Link>
                      )}
                      <Link
                        href={`/equipo/${ficha.slug}`}
                        className="text-fg-subtle hover:text-fg"
                      >
                        En tu ficha
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-6 rounded-2xl border border-border bg-bg-soft p-5">
            <p className="text-[12.5px] leading-relaxed text-fg-muted">
              Tus artículos aparecen en tu ficha pública en cuanto se publican.{" "}
              <Link
                href={`/equipo/${ficha.slug}`}
                className="inline-flex items-center gap-1 font-semibold text-navy dark:text-sky"
              >
                Ver mi ficha
                <IconoFlecha className="h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
