import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cancelarSolicitud, confirmarPago } from "@/app/acciones/membresia";
import { FormularioPrecio } from "@/components/app/Membresia";
import { Container } from "@/components/ui/Container";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Planes y pagos",
  robots: { index: false, follow: false },
};

const INTERVALO: Record<string, string> = {
  mensual: "al mes",
  trimestral: "cada tres meses",
  semestral: "cada seis meses",
  anual: "al año",
  unico: "pago único",
};

function formatearImporte(centavos: number, moneda: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(centavos / 100);
}

type PagoPendiente = {
  id: string;
  user_id: string;
  amount_cents: number;
  currency: string;
  external_reference: string | null;
  created_at: string;
  raw_payload: { plan_price_id?: string } | null;
};

export default async function PaginaAdminPlanes() {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/app");

  const supabase = await crearClienteServidor();

  const [{ data: planes }, { data: precios }, { data: pendientes }] = await Promise.all([
    supabase.from("plans").select("id, name, tier").eq("is_active", true).order("tier"),
    supabase
      .from("plan_prices")
      .select("id, plan_id, amount_cents, currency, billing_interval, is_active")
      .eq("is_active", true)
      .order("amount_cents"),
    supabase
      .from("payments")
      .select("id, user_id, amount_cents, currency, external_reference, created_at, raw_payload")
      .eq("status", "pendiente")
      .order("created_at"),
  ]);

  // Los perfiles de quienes solicitaron, en una segunda consulta.
  const idsSolicitantes = [...new Set((pendientes ?? []).map((p) => p.user_id as string))];
  const { data: perfiles } = idsSolicitantes.length
    ? await supabase.from("profiles").select("id, full_name, display_name, email").in("id", idsSolicitantes)
    : { data: [] };
  const porId = new Map((perfiles ?? []).map((p) => [p.id as string, p]));

  const listaPrecios = (precios ?? []) as {
    id: string;
    plan_id: string;
    amount_cents: number;
    currency: string;
    billing_interval: string;
    is_active: boolean;
  }[];
  const listaPendientes = (pendientes ?? []) as unknown as PagoPendiente[];
  return (
    <Container>
      <p className="tagline text-cyan dark:text-sky">Administración</p>
      <h1 className="mt-3 text-h1 text-fg">Planes y pagos</h1>
      <p className="mt-4 max-w-[58ch] text-lead text-fg-muted">
        Define cuánto cuesta la membresía y confirma los pagos que van entrando. El precio
        que publiques aquí aparece solo en la página de membresía de los dueños.
      </p>

      {/* Solicitudes por confirmar */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-fg">
          Pagos por confirmar
          {listaPendientes.length > 0 ? (
            <span className="ml-3 rounded-full bg-amber-100 px-3 py-1 text-[13px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              {listaPendientes.length}
            </span>
          ) : null}
        </h2>

        {listaPendientes.length === 0 ? (
          <p className="mt-4 text-sm text-fg-muted">
            No hay solicitudes esperando confirmación.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {listaPendientes.map((pago) => {
              const perfil = porId.get(pago.user_id);
              const persona =
                perfil?.display_name || perfil?.full_name || perfil?.email || "Sin nombre";
              return (
                <li
                  key={pago.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-500/10"
                >
                  <div>
                    <p className="font-display text-base font-bold text-fg">{persona}</p>
                    <p className="mt-1 text-[13px] text-fg-muted">
                      {perfil?.email} ·{" "}
                      {formatearImporte(pago.amount_cents, pago.currency)}
                    </p>
                    <p className="mt-1 font-mono text-[12.5px] text-fg-subtle">
                      {pago.external_reference}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={confirmarPago}>
                      <input type="hidden" name="pago" value={pago.id} />
                      <input type="hidden" name="dias" value="365" />
                      <button
                        type="submit"
                        className="rounded-full bg-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#0b1856] dark:bg-cyan dark:text-[#04102e]"
                      >
                        Confirmar y activar
                      </button>
                    </form>
                    <form action={cancelarSolicitud}>
                      <input type="hidden" name="pago" value={pago.id} />
                      <input
                        type="hidden"
                        name="motivo"
                        value="Cancelada desde el panel"
                      />
                      <button
                        type="submit"
                        className="rounded-full border border-border px-4 py-2 text-[13px] font-medium text-fg-muted transition-colors hover:border-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        Cancelar
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-[12.5px] leading-relaxed text-fg-subtle">
          Al confirmar, la base crea la suscripción, cambia el rol del dueño y lo deja
          registrado en la auditoría. No hay que hacer nada más.
        </p>
      </section>

      {/* Precios publicados */}
      <section className="mt-12 border-t border-border pt-10">
        <h2 className="font-display text-xl font-bold text-fg">Precios publicados</h2>

        {listaPrecios.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-border bg-bg p-8">
            <p className="font-display text-base font-bold text-fg">
              Todavía no hay precio publicado
            </p>
            <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-fg-muted">
              Mientras no publiques un precio, la página de membresía invita a escribir por
              WhatsApp en lugar de mostrar planes. En cuanto lo publiques, los dueños podrán
              solicitarla solos.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-4">
            {listaPrecios.map((precio) => (
              <li key={precio.id} className="rounded-2xl border border-border bg-bg p-6">
                <p className="font-display text-lg font-bold text-fg">
                  {formatearImporte(precio.amount_cents, precio.currency)}{" "}
                  <span className="text-[15px] font-medium text-fg-muted">
                    {INTERVALO[precio.billing_interval] ?? precio.billing_interval}
                  </span>
                </p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-[13px] font-semibold text-navy dark:text-sky">
                    Cambiar el precio
                  </summary>
                  <div className="mt-5 border-t border-border pt-5">
                    <FormularioPrecio
                      planes={(planes ?? []) as { id: string; name: string }[]}
                      precio={precio}
                    />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}

        <details className="mt-6 rounded-2xl border border-border bg-bg p-6">
          <summary className="cursor-pointer font-display text-base font-bold text-fg">
            Publicar otro precio
          </summary>
          <div className="mt-6">
            <FormularioPrecio planes={(planes ?? []) as { id: string; name: string }[]} />
          </div>
        </details>
      </section>

      {/* Lo que falta */}
      <section className="mt-12 rounded-2xl border border-border bg-bg-soft p-7">
        <h2 className="font-display text-lg font-bold text-fg">
          Cómo funciona hoy el cobro
        </h2>
        <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-fg-muted">
          El dueño solicita la membresía, recibe una referencia y transfiere. Tú confirmas
          el ingreso aquí y su acceso se activa solo. Cuando se conecte la pasarela de pago
          con tarjeta, ese paso desaparece: el webhook del proveedor confirmará el pago y
          activará la membresía sin intervención.
        </p>
      </section>
    </Container>
  );
}
