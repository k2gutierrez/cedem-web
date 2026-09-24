import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvatarIniciales } from "@/components/marketing/AvatarIniciales";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { supabaseConfigurado } from "@/lib/supabase/configurado";

/**
 * Ficha pública de un consultor.
 *
 * Es la cara de la firma: quién es, de dónde escribe y qué ha escrito. Todo sale
 * de lo que el propio consultor o el administrador cargan en el panel, así que
 * un perfil incompleto se nota y se corrige solo.
 */

type Consultor = {
  id: string;
  slug: string;
  full_name: string;
  headline: string | null;
  bio_md: string | null;
  location: string | null;
  photo_path: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  email_public: string | null;
  specialties: string[] | null;
  started_year: number | null;
  is_founder: boolean;
};

async function traerConsultor(slug: string): Promise<Consultor | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("consultants")
    .select(
      "id, slug, full_name, headline, bio_md, location, photo_path, linkedin_url, x_url, email_public, specialties, started_year, is_founder",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as Consultor | null) ?? null;
}

export async function generateMetadata(
  props: PageProps<"/equipo/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const consultor = await traerConsultor(slug);
  if (!consultor) return { title: "Consultor no encontrado" };
  return {
    title: `${consultor.full_name} · ${consultor.headline ?? "Equipo CEDEM"}`,
    // La descripción para buscadores va sin el marcado de markdown.
    description:
      consultor.bio_md?.replace(/\*\*/g, "").replace(/\*/g, "").slice(0, 160) ??
      `${consultor.full_name}, ${consultor.headline ?? "consultor"} de CEDEM.`,
  };
}

export default async function PaginaConsultor(props: PageProps<"/equipo/[slug]">) {
  const { slug } = await props.params;
  const consultor = await traerConsultor(slug);
  if (!consultor) notFound();

  // Sus artículos publicados (los que escribió y el equipo publicó).
  const supabase = supabaseConfigurado() ? await crearClienteServidor() : null;
  const { data: articulos } = supabase
    ? await supabase
        .from("contents")
        .select("slug, title, excerpt, published_at")
        .eq("content_type", "articulo")
        .eq("status", "publicado")
        .eq("articles.consultant_id", consultor.id)
        .order("published_at", { ascending: false })
        .limit(12)
    : { data: null };

  const lista = (articulos ?? []) as {
    slug: string;
    title: string;
    excerpt: string | null;
    published_at: string | null;
  }[];

  const enlaces = [
    consultor.linkedin_url ? { texto: "LinkedIn", href: consultor.linkedin_url } : null,
    consultor.x_url ? { texto: "X", href: consultor.x_url } : null,
    consultor.email_public ? { texto: "Correo", href: `mailto:${consultor.email_public}` } : null,
  ].filter(Boolean) as { texto: string; href: string }[];

  return (
    <article className="py-14 lg:py-20">
      <Container>
        <nav aria-label="Ruta" className="text-[13px] text-fg-subtle">
          <Link href="/equipo" className="hover:text-cyan dark:hover:text-sky">
            Equipo
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-fg-muted">{consultor.full_name}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          {/* Ficha */}
          <div>
            <div className="flex items-center gap-5">
              <AvatarIniciales nombre={consultor.full_name} />
              <div>
                <h1 className="font-display text-h2 text-fg">{consultor.full_name}</h1>
                <p className="mt-1.5 text-[15px] text-fg-muted">
                  {consultor.headline ?? "Equipo CEDEM"}
                </p>
                {consultor.is_founder ? (
                  <span className="mt-2 inline-block rounded-full bg-sky/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy dark:text-sky">
                    Fundador
                  </span>
                ) : null}
              </div>
            </div>

            <dl className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
              {consultor.location ? (
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-fg-subtle">Dónde está</dt>
                  <dd className="text-fg-muted">{consultor.location}</dd>
                </div>
              ) : null}
              {consultor.started_year ? (
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-fg-subtle">En CEDEM</dt>
                  <dd className="text-fg-muted">desde {consultor.started_year}</dd>
                </div>
              ) : null}
              {consultor.specialties?.length ? (
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-fg-subtle">Especialidades</dt>
                  <dd className="text-fg-muted">{consultor.specialties.join(" · ")}</dd>
                </div>
              ) : null}
            </dl>

            {enlaces.length ? (
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {enlaces.map((enlace) => (
                  <li key={enlace.texto}>
                    <a
                      href={enlace.href}
                      target={enlace.href.startsWith("http") ? "_blank" : undefined}
                      rel={enlace.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="inline-flex rounded-full border border-border px-4 py-2 text-[13px] font-medium text-fg-muted transition-colors hover:border-cyan hover:text-fg dark:hover:border-sky"
                    >
                      {enlace.texto}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-8">
              <BotonEnlace href="/contacto">
                Hablar con CEDEM
                <IconoFlecha className="h-4 w-4" />
              </BotonEnlace>
            </div>
          </div>

          {/* Semblanza y artículos */}
          <div>
            {consultor.bio_md ? (
              <div className="space-y-4 text-[16px] leading-relaxed text-fg-muted">
                {consultor.bio_md.split(/\n{2,}/).map((bloque, i) => (
                  <p
                    key={i}
                    dangerouslySetInnerHTML={{
                      // Markdown mínimo: negritas y cursivas. El texto lo escribe
                      // el propio consultor desde su perfil.
                      __html: bloque
                        .trim()
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-fg">$1</strong>')
                        .replace(/\*(.+?)\*/g, "<em>$1</em>"),
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-border bg-bg-soft p-6 text-sm leading-relaxed text-fg-muted">
                Este perfil todavía no tiene semblanza. El consultor puede escribirla desde
                su cuenta en CEDEM 2.0.
              </p>
            )}

            {lista.length > 0 ? (
              <section className="mt-12">
                <h2 className="font-display text-xl font-bold text-fg">
                  Lo que ha escrito
                </h2>
                <ul className="mt-5 space-y-3">
                  {lista.map((articulo) => (
                    <li key={articulo.slug}>
                      <Link
                        href={`/recursos/${articulo.slug}`}
                        className="block rounded-2xl border border-border bg-bg p-5 transition-colors hover:border-cyan/60 dark:hover:border-sky/60"
                      >
                        <span className="font-display text-[15px] font-semibold text-fg">
                          {articulo.title}
                        </span>
                        {articulo.excerpt ? (
                          <span className="mt-2 block text-[13px] leading-relaxed text-fg-muted">
                            {articulo.excerpt.slice(0, 180)}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      </Container>
    </article>
  );
}
