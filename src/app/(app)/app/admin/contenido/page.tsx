import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cambiarEstado, alternarDestacado } from "@/app/acciones/contenido";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Contenido",
  robots: { index: false, follow: false },
};

const ETIQUETA_ESTADO: Record<string, string> = {
  borrador: "Borrador",
  programado: "Programado",
  publicado: "Publicado",
  archivado: "Archivado",
};

const ETIQUETA_VISIBILIDAD: Record<string, string> = {
  publico: "Público",
  free_registrado: "Registrado",
  premium: "Premium",
};

export default async function PaginaAdminContenido(
  props: PageProps<"/app/admin/contenido">,
) {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/app");

  const parametros = await props.searchParams;
  const recienCreado = parametros.creado === "1";

  const supabase = await crearClienteServidor();
  const { data: contenidos } = await supabase
    .from("contents")
    .select("id, title, content_type, status, visibility, is_featured, published_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  const lista = contenidos ?? [];
  const cuenta = {
    publicados: lista.filter((c) => c.status === "publicado").length,
    borradores: lista.filter((c) => c.status === "borrador").length,
    premium: lista.filter((c) => c.visibility === "premium").length,
  };

  return (
    <Container>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="tagline text-cyan dark:text-sky">Administración</p>
          <h1 className="mt-3 text-h1 text-fg">Contenido</h1>
          <p className="mt-4 max-w-[52ch] text-lead text-fg-muted">
            Todo lo que se publica aquí aparece en el sitio y en la biblioteca de los
            miembros. Tú decides qué es público y qué es de pago.
          </p>
        </div>
        <BotonEnlace href="/app/admin/contenido/nuevo" tamano="lg">
          Nuevo contenido
          <IconoFlecha className="h-4 w-4" />
        </BotonEnlace>
      </div>

      {recienCreado ? (
        <p
          role="status"
          className="mt-8 rounded-xl border border-cyan/40 bg-sky/10 px-4 py-3 text-sm text-fg-muted dark:border-sky/40"
        >
          Listo. El contenido quedó guardado.
        </p>
      ) : null}

      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
        {[
          { etiqueta: "Publicados", valor: cuenta.publicados },
          { etiqueta: "Borradores", valor: cuenta.borradores },
          { etiqueta: "Solo para miembros", valor: cuenta.premium },
        ].map((dato) => (
          <div key={dato.etiqueta} className="bg-bg p-5">
            <dt className="text-xs uppercase tracking-[0.16em] text-fg-subtle">
              {dato.etiqueta}
            </dt>
            <dd className="mt-1.5 font-display text-2xl font-bold text-fg">{dato.valor}</dd>
          </div>
        ))}
      </dl>

      {lista.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-bg p-10 text-center">
          <p className="font-display text-lg font-bold text-fg">
            Todavía no hay contenido publicado
          </p>
          <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-fg-muted">
            Cuando publiques el primero aparecerá aquí. Los 186 artículos del archivo
            anterior se pueden importar en bloque cuando quieras.
          </p>
          <div className="mt-6 flex justify-center">
            <BotonEnlace href="/app/admin/contenido/nuevo">Publicar el primero</BotonEnlace>
          </div>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-bg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-bg-soft">
              <tr className="text-xs uppercase tracking-wider text-fg-subtle">
                <th className="px-5 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Visibilidad</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">Tipo</th>
                <th className="px-5 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((contenido) => (
                <tr key={contenido.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4">
                    <Link
                      href={`/app/admin/contenido/${contenido.id}`}
                      className="font-medium text-fg hover:text-cyan dark:hover:text-sky"
                    >
                      {contenido.title}
                    </Link>
                    {contenido.is_featured ? (
                      <span className="ml-2 rounded-full bg-sky/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-navy dark:text-sky">
                        Destacado
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                        contenido.status === "publicado"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                      }`}
                    >
                      {ETIQUETA_ESTADO[contenido.status] ?? contenido.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-4 text-fg-muted sm:table-cell">
                    {ETIQUETA_VISIBILIDAD[contenido.visibility] ?? contenido.visibility}
                  </td>
                  <td className="hidden px-4 py-4 capitalize text-fg-muted lg:table-cell">
                    {contenido.content_type}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/app/admin/contenido/${contenido.id}`}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-cyan hover:text-fg dark:hover:border-sky"
                      >
                        Editar
                      </Link>
                      <form action={alternarDestacado}>
                        <input type="hidden" name="id" value={contenido.id} />
                        <input
                          type="hidden"
                          name="destacado"
                          value={String(contenido.is_featured)}
                        />
                        <button
                          type="submit"
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-cyan hover:text-fg dark:hover:border-sky"
                        >
                          {contenido.is_featured ? "Quitar destacado" : "Destacar"}
                        </button>
                      </form>
                      <form action={cambiarEstado}>
                        <input type="hidden" name="id" value={contenido.id} />
                        <input
                          type="hidden"
                          name="estado"
                          value={contenido.status === "publicado" ? "archivado" : "publicado"}
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0b1856] dark:bg-cyan dark:text-[#04102e]"
                        >
                          {contenido.status === "publicado" ? "Archivar" : "Publicar"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-fg-subtle">
        La base de datos no permite publicar sin cuerpo ni artículos sin autoría: si algo
        falta, te lo dirá al guardar.{" "}
        <Link href="/recursos" className="underline underline-offset-4">
          Ver cómo se ve el área pública
        </Link>
        .
      </p>
    </Container>
  );
}
