import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioSolicitud, PagoConTarjeta } from "@/components/app/Membresia";
import { AvisoDeUrl } from "@/components/fx/AvisoDeUrl";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { obtenerSesion } from "@/lib/auth/sesion";
import { stripeConfigurado } from "@/lib/pagos/stripe";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { contacto } from "@/content/site";

export const metadata: Metadata = {
  title: "Mi membresía",
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

export default async function PaginaMembresia() {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) redirect("/acceso?destino=/app/membresia");

  const supabase = await crearClienteServidor();

  const [{ data: precios }, { data: suscripcion }, { data: pagoPendiente }] = await Promise.all([
    supabase
      .from("plan_prices")
      .select("id, amount_cents, currency, billing_interval")
      .eq("is_active", true)
      .order("amount_cents"),
    supabase
      .from("subscriptions")
      .select("status, origin, started_at, ends_at, auto_renew")
      .eq("user_id", sesion.usuario.id)
      .in("status", ["activa", "en_prueba"])
      .maybeSingle(),
    supabase
      .from("payments")
      .select("external_reference, amount_cents, currency, created_at")
      .eq("user_id", sesion.usuario.id)
      .eq("status", "pendiente")
      .maybeSingle(),
  ]);

  const opciones = (precios ?? []).map((p) => ({
    id: p.id as string,
    etiqueta: `${formatearImporte(p.amount_cents as number, p.currency as string)} ${INTERVALO[p.billing_interval as string] ?? ""}`,
    nota:
      p.billing_interval === "unico"
        ? "Un solo pago, sin renovación."
        : "Incluye la biblioteca completa, los documentos del método y el seguimiento de tu Camino del Dueño.",
  }));

  const vence = suscripcion?.ends_at
    ? new Date(suscripcion.ends_at).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Container size="estrecho">
      <p className="tagline text-cyan dark:text-sky">Tu cuenta</p>
      <h1 className="mt-3 text-h1 text-fg">Mi membresía</h1>

      {/* Ya es miembro */}
      {sesion.esPremium && suscripcion ? (
        <>
          <p className="mt-4 max-w-[56ch] text-lead text-fg-muted">
            Tu acceso completo está activo.
          </p>
          <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            <div className="bg-bg p-5">
              <dt className="text-xs uppercase tracking-[0.16em] text-fg-subtle">
                Vigente hasta
              </dt>
              <dd className="mt-1.5 font-display text-lg font-bold text-fg">
                {vence ?? "Sin vencimiento"}
              </dd>
            </div>
            <div className="bg-bg p-5">
              <dt className="text-xs uppercase tracking-[0.16em] text-fg-subtle">
                Cómo entraste
              </dt>
              <dd className="mt-1.5 font-display text-lg font-bold text-fg capitalize">
                {{
                  invitacion: "Por invitación de CEDEM",
                  pago: "Por pago",
                  manual: "Activada por el equipo",
                  cortesia: "Por cortesía de CEDEM",
                }[suscripcion.origin as string] ?? String(suscripcion.origin)}
              </dd>
            </div>
          </dl>
          {suscripcion.origin === "invitacion" ? (
            <p className="mt-6 text-sm leading-relaxed text-fg-subtle">
              Tu acceso forma parte de tu relación con la firma. Si tienes dudas sobre su
              vigencia, escríbele a quien te acompaña.
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="mt-4 max-w-[56ch] text-lead text-fg-muted">
            Tu cuenta gratuita te deja leer el primer párrafo de todo y hacer tu Camino del
            Dueño. La membresía abre el resto: los artículos completos, los once documentos
            del método y el seguimiento de tu avance.
          </p>

          {/* Solicitud ya en curso */}
          {pagoPendiente ? (
            <div className="mt-8 rounded-2xl border border-cyan/40 bg-sky/10 p-6 dark:border-sky/40">
              <p className="font-display text-lg font-bold text-fg">
                Tu solicitud está en curso
              </p>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                Referencia para tu transferencia:
              </p>
              <p className="mt-2 font-mono text-lg font-bold tracking-wider text-fg">
                {pagoPendiente.external_reference}
              </p>
              <p className="mt-3 text-sm text-fg-subtle">
                {formatearImporte(
                  pagoPendiente.amount_cents as number,
                  pagoPendiente.currency as string,
                )}{" "}
                · En cuanto el equipo confirme el ingreso, tu acceso se activa solo.
              </p>
            </div>
          ) : opciones.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-border bg-bg p-8">
              <p className="font-display text-lg font-bold text-fg">
                La membresía todavía no tiene precio publicado
              </p>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                Mientras tanto, escríbenos y con gusto te contamos cómo funciona el acceso.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <BotonEnlace href={contacto.whatsapp} externo>
                  Escribir por WhatsApp
                  <IconoFlecha className="h-4 w-4" />
                </BotonEnlace>
                <BotonEnlace href="/camino" variante="secundario">
                  Hacer el Camino del Dueño
                </BotonEnlace>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-border bg-bg p-7 sm:p-9">
              {stripeConfigurado() ? (
                <>
                  <PagoConTarjeta
                    precios={opciones.map((o) => ({ id: o.id, etiqueta: o.etiqueta }))}
                  />
                  <div className="my-8 flex items-center gap-4">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-xs uppercase tracking-wider text-fg-subtle">
                      o por transferencia
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              ) : null}

              <FormularioSolicitud precios={opciones} />
              <p className="mt-6 text-xs leading-relaxed text-fg-subtle">
                Al solicitar no se te cobra nada automáticamente. Recibes una referencia para
                transferir y el equipo activa tu acceso al confirmar el ingreso. Si prefieres
                otro medio de pago,{" "}
                <a
                  href={contacto.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  escríbenos
                </a>
                .
              </p>
            </div>
          )}
        </>
      )}

      <AvisoDeUrl />

      <p className="mt-8 text-xs leading-relaxed text-fg-subtle">
        ¿Ya eres cliente de CEDEM? No necesitas pagar la membresía: pídele a tu consultor tu
        invitación.{" "}
        <Link href="/invitacion" className="underline underline-offset-4">
          Tengo un código
        </Link>
        .
      </p>
    </Container>
  );
}
