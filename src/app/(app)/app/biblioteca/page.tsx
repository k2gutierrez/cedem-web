import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { IconoFlecha, IconoYouTube } from "@/components/ui/Iconos";
import { canalYouTube, serieWebinars, webinars } from "@/content/recursos";
import { obtenerSesion } from "@/lib/auth/sesion";
import { obtenerArticulosPublicados } from "@/lib/datos/contenido";
import { supabaseConfigurado } from "@/lib/supabase/configurado";

export const metadata: Metadata = {
  title: "Biblioteca",
  robots: { index: false, follow: false },
};

/**
 * Los once documentos metodológicos de CEDEM.
 *
 * Son el material con el que se aplica el método y hoy viven sueltos en el sitio
 * anterior. En la plataforma son la biblioteca de los miembros.
 *
 * TODO (Fase 2): mover los PDF a Storage y leerlos de la tabla `documents` para
 * que el admin pueda subir o retirar documentos sin tocar código.
 */
const DOCUMENTOS = [
  { titulo: "¿Qué es la Dueñez Empresaria?", clave: "duenez" },
  { titulo: "Chips de Dueño y Director", clave: "rol" },
  { titulo: "La Dueñez hace la Diferencia", clave: "duenez" },
  { titulo: "La Fuerza Dispersante", clave: "desenfoque" },
  { titulo: "Lentes Bifocales", clave: "rol" },
  { titulo: "Lastres del Crecimiento", clave: "crecimiento" },
  { titulo: "Dueñez y Concentración Estratégica", clave: "concentracion" },
  { titulo: "Creando Valor", clave: "valor" },
  { titulo: "Enfoque Competitivo y Generación de Valor", clave: "generar" },
  { titulo: "Sinergia Organizacional y Multiplicación de Valor", clave: "multiplicar" },
  { titulo: "Alineación Estratégica y Captura de Valor", clave: "capturar" },
] as const;

export default async function PaginaBiblioteca() {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) redirect("/acceso?destino=/app/biblioteca");

  const articulos = supabaseConfigurado() ? await obtenerArticulosPublicados(24) : [];

  return (
    <Container>
      <p className="tagline text-cyan dark:text-sky">CEDEM 2.0</p>
      <h1 className="mt-3 text-h1 text-fg">Biblioteca</h1>
      <p className="mt-4 max-w-[58ch] text-lead text-fg-muted">
        Todo lo que CEDEM ha escrito y grabado sobre el rol de dueño, más los documentos
        con los que se aplica el método en la empresa.
      </p>

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

      {/* Artículos */}
      <section className="mt-12">
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

      {/* Documentos */}
      <section className="mt-12 border-t border-border pt-10">
        <h2 className="font-display text-xl font-bold text-fg">
          Documentos del método
        </h2>
        <p className="mt-2 max-w-[58ch] text-sm text-fg-muted">
          Los marcos con los que CEDEM aplica la Dueñez en la empresa. Son la base del
          vocabulario que vas a encontrar en todo el acompañamiento.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOCUMENTOS.map((doc) => (
            <li
              key={doc.titulo}
              className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-bg p-5"
            >
              <span className="text-[14px] font-medium leading-snug text-fg">
                {doc.titulo}
              </span>
              {sesion.esPremium ? (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                  Disponible
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                  Con membresía
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12.5px] leading-relaxed text-fg-subtle">
          &ldquo;Dueñez®&rdquo; es una marca registrada por Carlos A. Dumois Núñez. La
          reproducción total o parcial de este material requiere autorización por escrito.
        </p>
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
