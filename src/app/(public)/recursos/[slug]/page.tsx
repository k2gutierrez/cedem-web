import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CuerpoContenido } from "@/components/app/CuerpoContenido";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { supabaseConfigurado } from "@/lib/supabase/configurado";

/**
 * Ficha de un artículo.
 *
 * EL MURO DE PAGO VIVE AQUÍ, Y VIVE EN EL SERVIDOR.
 *
 * No se pide el cuerpo completo y luego se oculta con CSS: se consulta la vista
 * `v_contents_for_viewer`, que devuelve el primer párrafo y la bandera
 * `is_body_truncated` cuando quien pregunta no tiene derecho al cuerpo. Si no
 * hay derecho, el texto de pago **nunca sale de la base**. Así, aunque alguien
 * inspeccione la respuesta, no encuentra nada que no le corresponda.
 */

type Articulo = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  body_md: string | null;
  body_format: "markdown" | "html" | null;
  is_body_truncated: boolean;
  visibility: "publico" | "free_registrado" | "premium";
  published_at: string | null;
  author_label: string | null;
  consultant_name: string | null;
  consultant_slug: string | null;
  reading_minutes: number | null;
  tags: { name?: string }[] | null;
};

async function traerArticulo(slug: string): Promise<Articulo | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("v_contents_for_viewer")
    .select(
      "id, slug, title, subtitle, excerpt, body_md, body_format, is_body_truncated, visibility, published_at, author_label, consultant_name, consultant_slug, reading_minutes, tags",
    )
    .eq("slug", slug)
    .eq("content_type", "articulo")
    .eq("status", "publicado")
    .maybeSingle();

  return (data as Articulo | null) ?? null;
}

export async function generateMetadata(
  props: PageProps<"/recursos/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const articulo = await traerArticulo(slug);
  if (!articulo) return { title: "Artículo no encontrado" };

  return {
    title: articulo.title,
    description: articulo.excerpt?.slice(0, 160) ?? undefined,
    robots: articulo.visibility === "publico" ? undefined : { index: false },
  };
}

export default async function PaginaArticulo(props: PageProps<"/recursos/[slug]">) {
  const { slug } = await props.params;
  const articulo = await traerArticulo(slug);
  if (!articulo) notFound();

  const sesion = await obtenerSesion();
  const bloqueado = articulo.is_body_truncated;
  const esPremium = articulo.visibility === "premium";

  return (
    <article className="py-14 lg:py-20">
      <Container size="estrecho">
        <nav aria-label="Ruta" className="text-sm text-fg-subtle">
          <Link href="/recursos" className="hover:text-cyan dark:hover:text-sky">
            Recursos
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-fg-muted">Artículo</span>
        </nav>

        <ul className="mt-8 flex flex-wrap gap-2">
          <li className="rounded-full bg-sky/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-navy dark:bg-sky/20 dark:text-sky">
            {articulo.visibility === "premium"
              ? "Solo miembros"
              : articulo.visibility === "free_registrado"
                ? "Con cuenta gratis"
                : "Abierto"}
          </li>
          {articulo.tags?.map((etiqueta, i) =>
            etiqueta?.name ? (
              <li
                key={`${etiqueta.name}-${i}`}
                className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-fg-subtle"
              >
                {etiqueta.name}
              </li>
            ) : null,
          )}
        </ul>

        <h1 className="mt-5 text-h1 text-fg">{articulo.title}</h1>
        {articulo.subtitle ? (
          <p className="mt-4 text-lead text-fg-muted">{articulo.subtitle}</p>
        ) : null}

        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-subtle">
          {articulo.consultant_name ? (
            <>
              <span className="font-medium text-fg-muted">
                {articulo.consultant_slug ? (
                  <Link
                    href={`/equipo/${articulo.consultant_slug}`}
                    className="hover:text-cyan dark:hover:text-sky"
                  >
                    {articulo.consultant_name}
                  </Link>
                ) : (
                  articulo.consultant_name
                )}
              </span>
              <span aria-hidden="true">·</span>
            </>
          ) : articulo.author_label ? (
            <>
              <span className="font-medium text-fg-muted">{articulo.author_label}</span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          {articulo.published_at ? (
            <span>
              {new Date(articulo.published_at).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          ) : null}
          {articulo.reading_minutes ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{articulo.reading_minutes} min de lectura</span>
            </>
          ) : null}
        </p>

        <div className="regla-acento mt-8" />

        {/* Cuerpo: completo si hay derecho; si no, solo el primer párrafo */}
        <div className="mt-8">
          <CuerpoContenido
            texto={articulo.body_md ?? articulo.excerpt ?? ""}
            formato={articulo.body_format}
          />
        </div>

        {/* El muro */}
        {bloqueado ? (
          <div className="relative mt-4">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-bg"
            />
            <div className="rounded-3xl border border-border bg-bg-soft p-7 sm:p-9">
              <p className="tagline text-cyan dark:text-sky">
                {esPremium ? "Contenido para miembros" : "Contenido para registrados"}
              </p>
              <h2 className="mt-4 font-display text-xl font-bold text-fg">
                {sesion.usuario
                  ? "Tu cuenta todavía no incluye este contenido"
                  : "Aquí sigue el artículo"}
              </h2>
              <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-fg-muted">
                {esPremium
                  ? "Este artículo completo, y todo el archivo de CEDEM, está disponible para los miembros de CEDEM 2.0. Crear la cuenta es gratis; la membresía abre el contenido reservado y el seguimiento de tu Camino del Dueño."
                  : "Crea tu cuenta gratuita para leer el artículo completo y guardar tu avance en el Camino del Dueño."}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <BotonEnlace
                  href={sesion.usuario ? "/unete" : "/registro"}
                  tamano="lg"
                >
                  {sesion.usuario ? "Ver la membresía" : "Crear mi cuenta gratis"}
                  <IconoFlecha className="h-4 w-4" />
                </BotonEnlace>
                <BotonEnlace href="/camino" variante="secundario" tamano="lg">
                  Hacer el Camino del Dueño
                </BotonEnlace>
              </div>
            </div>
          </div>
        ) : null}

        <p className="mt-12 border-t border-border pt-6 text-xs leading-relaxed text-fg-subtle">
          &ldquo;Dueñez®&rdquo; es una marca registrada por Carlos A. Dumois Núñez. Esta
          lectura es un apoyo para tu reflexión y no sustituye asesoría legal, fiscal ni
          financiera.
        </p>
      </Container>
    </article>
  );
}
