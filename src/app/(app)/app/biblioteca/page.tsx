import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { descargarDocumento } from "@/app/acciones/descargas";
import { Container } from "@/components/ui/Container";
import { IconoFlecha, IconoYouTube } from "@/components/ui/Iconos";
import { canalYouTube, serieWebinars, webinars } from "@/content/recursos";
import { obtenerSesion } from "@/lib/auth/sesion";
import { obtenerArticulosPublicados } from "@/lib/datos/contenido";
import { obtenerDocumentosMetodo, type DocumentoMetodo } from "@/lib/datos/documentos";
import { supabaseConfigurado } from "@/lib/supabase/configurado";

export const metadata: Metadata = {
  title: "Biblioteca",
  robots: { index: false, follow: false },
};

/** Avisos que llegan desde la acción de descarga (`?aviso=…`). */
const AVISOS: Record<string, { tono: "error" | "ok"; texto: string }> = {
  "requiere-membresia":
    {
      tono: "error",
      texto:
        "Para descargar los documentos del método hace falta una membresía vigente. Puedes leer el primer párrafo de cada uno mientras tanto.",
    },
  "documento-desconocido": { tono: "error", texto: "Ese documento ya no está disponible." },
  "error-descarga": {
    tono: "error",
    texto:
      "No pudimos preparar la descarga. Vuelve a intentarlo; si sigue fallando, escríbenos y lo revisamos.",
  },
};

export default async function PaginaBiblioteca(props: PageProps<"/app/biblioteca">) {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) redirect("/acceso?destino=/app/biblioteca");

  const { aviso } = await props.searchParams;
  const claveAviso = typeof aviso === "string" ? aviso : null;
  const avisoActual = claveAviso ? AVISOS[claveAviso] : null;

  const [articulos, documentos] = await Promise.all([
    supabaseConfigurado() ? obtenerArticulosPublicados(24) : Promise.resolve([]),
    obtenerDocumentosMetodo(),
  ]);

  // Los documentos se agrupan por eje —fundamentos, rol, generar, multiplicar,
  // capturar— porque así se estudian: el eje es el índice del método.
  const ejes = documentos.reduce<Map<string, { label: string; docs: DocumentoMetodo[] }>>(
    (mapa, doc) => {
      const grupo = mapa.get(doc.eje) ?? { label: doc.ejeLabel, docs: [] };
      grupo.docs.push(doc);
      mapa.set(doc.eje, grupo);
      return mapa;
    },
    new Map(),
  );

  return (
    <Container>
      <p className="tagline text-cyan dark:text-sky">CEDEM 2.0</p>
      <h1 className="mt-3 text-h1 text-fg">Biblioteca</h1>
      <p className="mt-4 max-w-[58ch] text-lead text-fg-muted">
        Todo lo que CEDEM ha escrito y grabado sobre el rol de dueño, más los documentos
        con los que se aplica el método en la empresa.
      </p>

      {avisoActual ? (
        <p
          role="status"
          className={
            avisoActual.tono === "error"
              ? "mt-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-[13.5px] leading-relaxed text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
              : "mt-6 rounded-2xl border border-emerald-300/60 bg-emerald-50 p-4 text-[13.5px] leading-relaxed text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
          }
        >
          {avisoActual.texto}
        </p>
      ) : null}

      {!sesion.esPremium ? (
        <div className="mt-8 rounded-2xl border border-cyan/40 bg-sky/10 p-6 dark:border-sky/40">
          <p className="font-display text-base font-bold text-fg">
            Estás en la biblioteca con una cuenta gratuita
          </p>
          <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-fg-muted">
            Puedes leer el primer párrafo de todo el contenido reservado. La membresía abre
            los artículos completos, los documentos descargables y el seguimiento de tu
            Camino del Dueño.
          </p>
          <Link
            href="/unete"
            className="mt-4 inline-flex items-center gap-2 font-display text-sm font-semibold text-navy hover:text-cyan dark:text-sky"
          >
            Ver la membresía
            <IconoFlecha className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      {/* Documentos del método */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-bold text-fg">Documentos del método</h2>
        <p className="mt-2 max-w-[58ch] text-sm text-fg-muted">
          {documentos.length > 0
            ? `${documentos.length} documentos con los que CEDEM aplica la Dueñez en la empresa. Son la base del vocabulario que vas a encontrar en todo el acompañamiento: se pueden leer aquí y descargar en PDF.`
            : "Los marcos con los que CEDEM aplica la Dueñez en la empresa. Son la base del vocabulario que vas a encontrar en todo el acompañamiento."}
        </p>

        {documentos.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-border bg-bg p-8">
            <p className="text-sm leading-relaxed text-fg-muted">
              Todavía no hay documentos cargados desde la plataforma. El administrador puede
              publicarlos desde el panel.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {[...ejes.entries()].map(([clave, grupo]) => (
              <div key={clave}>
                <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-cyan dark:text-sky">
                  {grupo.label}
                </h3>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {grupo.docs.map((doc) => (
                    <li
                      key={doc.slug}
                      className="flex flex-col rounded-2xl border border-border bg-bg p-5 transition-colors hover:border-cyan/60 dark:hover:border-sky/60"
                    >
                      <Link
                        href={`/app/biblioteca/${doc.slug}`}
                        className="font-display text-[15px] font-bold leading-snug text-fg hover:text-navy dark:hover:text-sky"
                      >
                        {doc.titulo}
                      </Link>

                      {doc.resumen ? (
                        <span className="mt-2 flex-1 text-[13px] leading-relaxed text-fg-muted">
                          {doc.resumen}
                        </span>
                      ) : (
                        <span className="flex-1" />
                      )}

                      <span className="mt-3 text-[11.5px] text-fg-subtle">
                        {[
                          doc.paginas ? `${doc.paginas} páginas` : null,
                          doc.minutos ? `${doc.minutos} min de lectura` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>

                      <span className="mt-4 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/app/biblioteca/${doc.slug}`}
                          className="inline-flex items-center gap-1.5 font-display text-[13px] font-semibold text-navy hover:text-cyan dark:text-sky"
                        >
                          Leer en línea
                          <IconoFlecha className="h-3.5 w-3.5" />
                        </Link>

                        {sesion.esPremium ? (
                          <form action={descargarDocumento}>
                            <input type="hidden" name="slug" value={doc.slug} />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-display text-[12.5px] font-semibold text-fg-muted transition-colors hover:border-cyan hover:text-navy dark:hover:border-sky dark:hover:text-sky"
                            >
                              Descargar PDF
                            </button>
                          </form>
                        ) : (
                          <span className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                            Con membresía
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-[12.5px] leading-relaxed text-fg-subtle">
          &ldquo;Dueñez®&rdquo; es una marca registrada por Carlos A. Dumois Núñez. La
          reproducción total o parcial de este material requiere autorización por escrito.
        </p>
      </section>

      {/* Artículos */}
      <section className="mt-12 border-t border-border pt-10">
        <h2 className="font-display text-xl font-bold text-fg">Artículos</h2>
        {articulos.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-border bg-bg p-8">
            <p className="text-sm leading-relaxed text-fg-muted">
              Todavía no hay artículos publicados desde la plataforma. El archivo completo
              de CEDEM —más de 180 artículos desde 2019— se puede importar en bloque cuando
              la firma lo apruebe.
            </p>
            <Link
              href="/recursos"
              className="mt-4 inline-flex items-center gap-2 font-display text-sm font-semibold text-navy hover:text-cyan dark:text-sky"
            >
              Ver la selección abierta
              <IconoFlecha className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {articulos.map((articulo) => (
              <li key={articulo.slug}>
                <Link
                  href={`/recursos/${articulo.slug}`}
                  className="flex h-full flex-col rounded-2xl border border-border bg-bg p-6 transition-colors hover:border-cyan/60 dark:hover:border-sky/60"
                >
                  <span className="flex items-center gap-2">
                    {articulo.esPremium ? (
                      <span className="rounded-full bg-sky/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy dark:text-sky">
                        {sesion.esPremium ? "Miembros" : "Requiere membresía"}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-3 font-display text-base font-bold leading-snug text-fg">
                    {articulo.titulo}
                  </span>
                  <span className="mt-2 flex-1 text-[13px] leading-relaxed text-fg-muted">
                    {articulo.extracto}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Webinars */}
      <section className="mt-12 border-t border-border pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-fg">Webinars</h2>
            <p className="mt-2 max-w-[52ch] text-sm text-fg-muted">
              Serie «{serieWebinars}». {webinars.length} sesiones completas.
            </p>
          </div>
          <a
            href={canalYouTube}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-display text-sm font-semibold text-navy hover:text-cyan dark:text-sky"
          >
            <IconoYouTube className="h-4 w-4" />
            Ver el canal
          </a>
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {webinars.map((webinar) => (
            <li
              key={webinar.titulo}
              className="rounded-2xl border border-border bg-bg p-5"
            >
              <span className="block text-[14px] font-medium leading-snug text-fg">
                {webinar.titulo}
              </span>
              <span className="mt-1 block text-[12.5px] text-fg-subtle">
                {webinar.duracion}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
