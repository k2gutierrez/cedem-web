import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { descargarDocumento } from "@/app/acciones/descargas";
import { CuerpoContenido } from "@/components/app/CuerpoContenido";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { obtenerSesion } from "@/lib/auth/sesion";
import { obtenerDocumentoMetodo } from "@/lib/datos/documentos";

export const metadata: Metadata = {
  title: "Documento del método",
  robots: { index: false, follow: false },
};

/**
 * Lectura de un documento del método dentro de la plataforma.
 *
 * El PDF sigue siendo la versión oficial —y es lo que se descarga—, pero leerlo
 * aquí tiene dos ventajas que el PDF no da: funciona en el teléfono sin abrir un
 * visor, y el texto entra en la búsqueda y en el diccionario español de la base.
 *
 * El corte lo hace la base, no esta página: si no hay membresía, `body_md` llega
 * con el primer párrafo y `is_body_truncated` en verdadero. Aquí solo se decide
 * cómo se ve.
 */
export default async function PaginaDocumento(props: PageProps<"/app/biblioteca/[slug]">) {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) redirect("/acceso?destino=/app/biblioteca");

  const { slug } = await props.params;
  const documento = await obtenerDocumentoMetodo(slug);
  if (!documento) notFound();

  return (
    <article className="py-14 lg:py-20">
      <Container size="estrecho">
        <nav aria-label="Ruta" className="text-[13px] text-fg-subtle">
          <Link href="/app/biblioteca" className="hover:text-cyan dark:hover:text-sky">
            Biblioteca
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-fg-muted">Documento del método</span>
        </nav>

        <ul className="mt-8 flex flex-wrap gap-2">
          <li className="rounded-full bg-sky/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-navy dark:bg-sky/20 dark:text-sky">
            {documento.ejeLabel}
          </li>
          {documento.paginas ? (
            <li className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-fg-subtle">
              {documento.paginas} páginas
            </li>
          ) : null}
          {documento.minutos ? (
            <li className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-fg-subtle">
              {documento.minutos} min de lectura
            </li>
          ) : null}
        </ul>

        <h1 className="mt-5 text-h1 text-fg">{documento.titulo}</h1>
        {documento.resumen ? (
          <p className="mt-4 text-lead text-fg-muted">{documento.resumen}</p>
        ) : null}

        {documento.autor ? (
          <p className="mt-6 text-[13px] text-fg-subtle">{documento.autor}</p>
        ) : null}

        <div className="regla-acento mt-8" />

        {documento.cuerpo ? (
          <div className="mt-8">
            <CuerpoContenido texto={documento.cuerpo} formato={documento.formato} />
          </div>
        ) : null}

        {/* El muro: solo aparece cuando la base cortó el texto */}
        {documento.truncado ? (
          <div className="relative mt-4">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-bg"
            />
            <div className="rounded-3xl border border-border bg-bg-soft p-7 sm:p-9">
              <p className="tagline text-cyan dark:text-sky">Documento para miembros</p>
              <h2 className="mt-4 font-display text-xl font-bold text-fg">
                Aquí sigue el documento
              </h2>
              <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-fg-muted">
                Este es uno de los documentos con los que se aplica el método en la empresa.
                La membresía de CEDEM 2.0 abre los documentos completos, en pantalla y en
                PDF, y el seguimiento de tu Camino del Dueño.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <BotonEnlace href="/unete" tamano="lg">
                  Ver la membresía
                  <IconoFlecha className="h-4 w-4" />
                </BotonEnlace>
                <BotonEnlace href="/app/biblioteca" variante="secundario" tamano="lg">
                  Volver a la biblioteca
                </BotonEnlace>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-bg-soft p-6">
            <p className="flex-1 text-[13.5px] leading-relaxed text-fg-muted">
              Puedes llevarte este documento en PDF para trabajarlo con tu equipo. La
              descarga queda registrada en tu historial de accesos.
            </p>
            <form action={descargarDocumento}>
              <input type="hidden" name="slug" value={documento.slug} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-cyan dark:bg-sky dark:text-navy dark:hover:bg-cyan dark:hover:text-white"
              >
                Descargar el PDF
              </button>
            </form>
          </div>
        )}

        <p className="mt-12 border-t border-border pt-6 text-[12px] leading-relaxed text-fg-subtle">
          {documento.derechos ??
            "«Dueñez®» es una marca registrada por Carlos A. Dumois Núñez."}{" "}
          Esta lectura es un apoyo para tu reflexión y no sustituye asesoría legal, fiscal ni
          financiera.
        </p>
      </Container>
    </article>
  );
}
