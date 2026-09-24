import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { revocarInvitacion } from "@/app/acciones/invitaciones";
import { FormularioInvitacion } from "@/components/admin/Invitaciones";
import { Container } from "@/components/ui/Container";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Invitaciones",
  robots: { index: false, follow: false },
};

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  pendiente: {
    texto: "Pendiente",
    clase: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  canjeada: {
    texto: "Canjeada",
    clase: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  expirada: {
    texto: "Expirada",
    clase: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  },
  revocada: {
    texto: "Revocada",
    clase: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  },
};

type Invitacion = {
  id: string;
  code: string;
  email: string | null;
  status: string;
  duration_days: number | null;
  expires_at: string | null;
  redeemed_at: string | null;
  created_at: string;
  notes: string | null;
};

export default async function PaginaInvitaciones() {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/app");

  const supabase = await crearClienteServidor();
  const [{ data: invitaciones }, { data: planes }, { data: clientes }] = await Promise.all([
    supabase
      .from("invitations")
      .select("id, code, email, status, duration_days, expires_at, redeemed_at, created_at, notes")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase.from("plans").select("id, name").eq("is_active", true).order("tier"),
    supabase.from("clients").select("id, name").eq("is_active", true).order("name"),
  ]);

  const lista = (invitaciones ?? []) as Invitacion[];
  const pendientes = lista.filter((i) => i.status === "pendiente").length;
  const canjeadas = lista.filter((i) => i.status === "canjeada").length;

  return (
    <Container>
      <p className="tagline text-cyan dark:text-sky">Administración</p>
      <h1 className="mt-3 text-h1 text-fg">Invitaciones</h1>
      <p className="mt-4 max-w-[58ch] text-lead text-fg-muted">
        Los clientes actuales de la firma entran a CEDEM 2.0 por invitación, sin costo.
        Emite un código y mándaselo: lo canjea en la página de invitación y su acceso
        completo queda activo.
      </p>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
        {[
          { etiqueta: "Emitidas", valor: lista.length },
          { etiqueta: "Pendientes", valor: pendientes },
          { etiqueta: "Canjeadas", valor: canjeadas },
        ].map((dato) => (
          <div key={dato.etiqueta} className="bg-bg p-5">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
              {dato.etiqueta}
            </dt>
            <dd className="mt-1.5 font-display text-2xl font-bold text-fg">{dato.valor}</dd>
          </div>
        ))}
      </dl>

      <details className="mt-8 rounded-2xl border border-border bg-bg p-6" open={lista.length === 0}>
        <summary className="cursor-pointer font-display text-base font-bold text-fg">
          Emitir una invitación
        </summary>
        <div className="mt-6">
          <FormularioInvitacion
            planes={(planes ?? []) as { id: string; name: string }[]}
            clientes={(clientes ?? []) as { id: string; name: string }[]}
          />
        </div>
      </details>

      {lista.length === 0 ? (
        <p className="mt-6 text-sm text-fg-muted">
          Todavía no has emitido ninguna invitación.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-bg">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-border bg-bg-soft">
              <tr className="text-[11px] uppercase tracking-wider text-fg-subtle">
                <th className="px-5 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Para</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Vence</th>
                <th className="px-5 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((inv) => {
                const etiqueta = ETIQUETA_ESTADO[inv.status] ?? ETIQUETA_ESTADO.pendiente;
                return (
                  <tr key={inv.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[13px] font-semibold tracking-wider text-fg">
                        {inv.code}
                      </span>
                      {inv.notes ? (
                        <span className="mt-0.5 block text-[12px] text-fg-subtle">
                          {inv.notes}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 text-fg-muted">{inv.email ?? "Cualquiera"}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${etiqueta.clase}`}
                      >
                        {etiqueta.texto}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-fg-subtle">
                      {inv.expires_at
                        ? new Date(inv.expires_at).toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Sin vencimiento"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {inv.status === "pendiente" ? (
                        <form action={revocarInvitacion}>
                          <input type="hidden" name="id" value={inv.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-fg-muted transition-colors hover:border-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            Revocar
                          </button>
                        </form>
                      ) : (
                        <span className="text-[12px] text-fg-subtle">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-[12.5px] leading-relaxed text-fg-subtle">
        El canje lo valida la base de datos: vigencia, uso único y, si la invitación tiene
        correo, que sea esa persona. Nadie puede canjear dos veces el mismo código.
      </p>
    </Container>
  );
}
