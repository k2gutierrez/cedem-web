import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Auditoría",
  robots: { index: false, follow: false },
};

/** Las acciones que conviene mirar primero si algo no cuadra. */
const SENSIBLES = ["cambio_rol", "canje_invitacion", "delete", "revocacion", "inicio_sesion"];

const ETIQUETA_ACCION: Record<string, string> = {
  insert: "Creación",
  update: "Edición",
  delete: "Borrado",
  registro: "Registro",
  cambio_rol: "Cambio de rol",
  publicacion: "Publicación",
  canje_invitacion: "Canje de invitación",
  inicio_sesion: "Inicio de sesión",
};

type Movimiento = {
  id: number;
  occurred_at: string;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  entity_table: string;
  entity_label: string | null;
  severity: string | null;
};

export default async function PaginaAuditoria(props: PageProps<"/app/admin/auditoria">) {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/app");

  const parametros = await props.searchParams;
  const filtro = typeof parametros.accion === "string" ? parametros.accion : "";
  const soloSensibles = parametros.sensibles === "1";

  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("audit_logs")
    .select("id, occurred_at, actor_email, actor_role, action, entity_table, entity_label, severity")
    .order("occurred_at", { ascending: false })
    .limit(200);

  if (filtro) consulta = consulta.eq("action", filtro);
  else if (soloSensibles) consulta = consulta.in("action", SENSIBLES);

  const { data } = await consulta;
  const movimientos = (data ?? []) as Movimiento[];

  const hace7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: total } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true });
  const { count: recientes } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .gte("occurred_at", hace7);

  const acciones = [
    "insert",
    "update",
    "delete",
    "registro",
    "cambio_rol",
    "publicacion",
    "canje_invitacion",
  ];

  return (
    <Container>
      <p className="tagline text-cyan dark:text-sky">Administración</p>
      <h1 className="mt-3 text-h1 text-fg">Auditoría</h1>
      <p className="mt-4 max-w-[58ch] text-lead text-fg-muted">
        Todo lo que pasa en la plataforma queda registrado: quién lo hizo, qué tocó y
        cuándo. El registro no se puede editar ni borrar, ni siquiera desde el panel.
      </p>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
        {[
          { etiqueta: "Movimientos totales", valor: total ?? 0 },
          { etiqueta: "Últimos 7 días", valor: recientes ?? 0 },
          {
            etiqueta: "Sensibles (últimos 200)",
            valor: movimientos.filter((m) => SENSIBLES.includes(m.action)).length,
          },
        ].map((dato) => (
          <div key={dato.etiqueta} className="bg-bg p-5">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
              {dato.etiqueta}
            </dt>
            <dd className="mt-1.5 font-display text-2xl font-bold text-fg">{dato.valor}</dd>
          </div>
        ))}
      </dl>

      {/* Filtros */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Link
          href="/app/admin/auditoria"
          className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
            !filtro && !soloSensibles
              ? "bg-navy text-white dark:bg-cyan dark:text-[#04102e]"
              : "border border-border text-fg-muted hover:border-cyan hover:text-fg dark:hover:border-sky"
          }`}
        >
          Todo
        </Link>
        <Link
          href="/app/admin/auditoria?sensibles=1"
          className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
            soloSensibles
              ? "bg-navy text-white dark:bg-cyan dark:text-[#04102e]"
              : "border border-border text-fg-muted hover:border-cyan hover:text-fg dark:hover:border-sky"
          }`}
        >
          Solo lo sensible
        </Link>
        {acciones.map((accion) => (
          <Link
            key={accion}
            href={`/app/admin/auditoria?accion=${accion}`}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
              filtro === accion
                ? "bg-navy text-white dark:bg-cyan dark:text-[#04102e]"
                : "border border-border text-fg-muted hover:border-cyan hover:text-fg dark:hover:border-sky"
            }`}
          >
            {ETIQUETA_ACCION[accion] ?? accion}
          </Link>
        ))}
      </div>

      {movimientos.length === 0 ? (
        <p className="mt-8 text-sm text-fg-muted">
          No hay movimientos que coincidan con el filtro.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-bg">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-bg-soft">
              <tr className="text-[11px] uppercase tracking-wider text-fg-subtle">
                <th className="px-5 py-3 font-semibold">Cuándo</th>
                <th className="px-4 py-3 font-semibold">Quién</th>
                <th className="px-4 py-3 font-semibold">Qué hizo</th>
                <th className="px-4 py-3 font-semibold">Sobre qué</th>
                <th className="px-5 py-3 font-semibold">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov) => {
                const sensible = SENSIBLES.includes(mov.action);
                return (
                  <tr key={mov.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 text-[12.5px] text-fg-subtle">
                      {new Date(mov.occurred_at).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-fg">
                        {mov.actor_email ?? "(sistema)"}
                      </span>
                      {mov.actor_role ? (
                        <span className="mt-0.5 block text-[11px] uppercase tracking-wider text-fg-subtle">
                          {mov.actor_role}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                          sensible
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300"
                        }`}
                      >
                        {ETIQUETA_ACCION[mov.action] ?? mov.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] capitalize text-fg-muted">
                      {mov.entity_table.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-fg-muted">
                      {mov.entity_label ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-[12.5px] leading-relaxed text-fg-subtle">
        Se muestran los últimos 200 movimientos. El registro es inmutable: la base rechaza
        cualquier intento de editarlo o borrarlo. Para atender una solicitud de borrado de
        datos se hace por un procedimiento aparte, documentado en{" "}
        <span className="font-mono">docs/12-hallazgos-al-ejecutar.md</span>.
      </p>
    </Container>
  );
}
