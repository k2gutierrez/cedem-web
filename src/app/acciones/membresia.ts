"use server";

import { revalidatePath } from "next/cache";
import { crearClienteAdmin } from "@/lib/supabase/cliente-admin";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { obtenerSesion } from "@/lib/auth/sesion";

export type EstadoMembresia = { error?: string; ok?: string; referencia?: string };

/** Referencia legible para conciliar una transferencia. */
function generarReferencia(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bloque = Array.from(
    { length: 6 },
    () => alfabeto[Math.floor(Math.random() * alfabeto.length)],
  ).join("");
  return `CEDEM-${new Date().getFullYear()}-${bloque}`;
}

/* -------------------------------------------------------------------------- */
/* El miembro solicita                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Registra una solicitud de membresía.
 *
 * Se guarda como un **pago pendiente** con proveedor `transferencia`: es el
 * flujo que funciona hoy, sin pasarela. El dueño pide, recibe una referencia
 * para transferir, y el equipo activa su acceso cuando el dinero entra. Cuando
 * se conecte la pasarela, este mismo registro se llenará solo desde el webhook
 * y nadie tendrá que confirmar nada a mano.
 */
export async function solicitarMembresia(
  _estado: EstadoMembresia,
  datos: FormData,
): Promise<EstadoMembresia> {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) return { error: "Tu sesión caducó. Vuelve a entrar." };

  const precioId = String(datos.get("precio") ?? "");
  if (!precioId) return { error: "Elige una opción." };

  const supabase = await crearClienteServidor();

  const { data: precio } = await supabase
    .from("plan_prices")
    .select("id, plan_id, amount_cents, currency, billing_interval, interval_count")
    .eq("id", precioId)
    .eq("is_active", true)
    .maybeSingle();

  if (!precio) return { error: "Esa opción ya no está disponible." };

  // ¿Ya tiene una solicitud o una membresía activa?
  const { data: existente } = await supabase
    .from("payments")
    .select("id, external_reference")
    .eq("user_id", sesion.usuario.id)
    .eq("status", "pendiente")
    .maybeSingle();

  if (existente) {
    return {
      ok: "Ya tienes una solicitud en curso.",
      referencia: existente.external_reference ?? undefined,
    };
  }

  const referencia = generarReferencia();

  // El pago lo crea el SERVIDOR, no el usuario: la tabla `payments` no tiene
  // política de inserción a propósito. Si el dueño pudiera crear su propio
  // registro, podría falsear el importe. Aquí ya se validó el precio contra la
  // base, así que el importe que se guarda es el real.
  const admin = crearClienteAdmin();
  const { error } = await admin.from("payments").insert({
    user_id: sesion.usuario.id,
    amount_cents: precio.amount_cents,
    currency: precio.currency,
    status: "pendiente",
    provider: "transferencia",
    external_reference: referencia,
    // `payments` no tiene columna para el precio elegido: se guarda en
    // raw_payload, que existe para el detalle del contexto y del proveedor.
    raw_payload: { plan_price_id: precio.id, origen: "solicitud-manual" },
  });

  if (error) {
    console.error("[membresia] no se pudo registrar la solicitud:", error.message);
    return { error: "No pudimos registrar tu solicitud. Escríbenos y lo resolvemos." };
  }

  revalidatePath("/app/membresia");
  revalidatePath("/app/admin/planes");
  return {
    ok: "Solicitud registrada. Transfiere con esta referencia y activamos tu acceso.",
    referencia,
  };
}

/* -------------------------------------------------------------------------- */
/* El equipo confirma                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Confirma el pago y activa la membresía.
 *
 * La activación la hace la función `admin_grant_subscription` de la base: crea
 * la suscripción, ajusta el rol y deja el rastro en la auditoría. Aquí solo se
 * marca el pago como recibido.
 */
export async function confirmarPago(formData: FormData) {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return;

  const pagoId = String(formData.get("pago") ?? "");
  const dias = Number(formData.get("dias") ?? 365) || 365;
  if (!pagoId) return;

  const supabase = await crearClienteServidor();

  const { data: pago } = await supabase
    .from("payments")
    .select("id, user_id, amount_cents, currency, raw_payload")
    .eq("id", pagoId)
    .maybeSingle();

  if (!pago) return;

  // El plan sale del precio que el dueño eligió al solicitar.
  const precioId = (pago.raw_payload as { plan_price_id?: string } | null)?.plan_price_id;
  let planId: string | null = null;
  if (precioId) {
    const { data: precio } = await supabase
      .from("plan_prices")
      .select("plan_id")
      .eq("id", precioId)
      .maybeSingle();
    planId = precio?.plan_id ?? null;
  }
  if (!planId) {
    const { data: plan } = await supabase
      .from("plans")
      .select("id")
      .eq("tier", "premium")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    planId = plan?.id ?? null;
  }
  if (!planId) return;

  const { error: errorOtorgar } = await supabase.rpc("admin_grant_subscription", {
    p_user: pago.user_id,
    p_plan_id: planId,
    p_days: dias,
    p_reason: "Pago confirmado por transferencia",
  });
  if (errorOtorgar) {
    console.error("[membresia] no se pudo otorgar:", errorOtorgar.message);
    return;
  }

  await supabase
    .from("payments")
    .update({
      status: "pagado",
      paid_at: new Date().toISOString(),
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", pagoId);

  revalidatePath("/app/admin/planes");
  revalidatePath("/app");
  revalidatePath("/app/membresia");
}

/** Marca una solicitud como fallida o cancelada. */
export async function cancelarSolicitud(formData: FormData) {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return;

  const pagoId = String(formData.get("pago") ?? "");
  const motivo = String(formData.get("motivo") ?? "Cancelada por el equipo");
  if (!pagoId) return;

  const supabase = await crearClienteServidor();
  await supabase
    .from("payments")
    .update({ status: "fallido", failure_reason: motivo })
    .eq("id", pagoId);

  revalidatePath("/app/admin/planes");
}

/* -------------------------------------------------------------------------- */
/* Precios                                                                    */
/* -------------------------------------------------------------------------- */

export async function guardarPrecio(
  _estado: EstadoMembresia,
  datos: FormData,
): Promise<EstadoMembresia> {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return { error: "No tienes permisos." };

  const planId = String(datos.get("plan") ?? "");
  const moneda = String(datos.get("moneda") ?? "MXN").toUpperCase();
  const importe = Math.round(Number(datos.get("importe") ?? 0));
  const intervalo = String(datos.get("intervalo") ?? "anual");
  const id = String(datos.get("id") ?? "");

  if (!planId) return { error: "Elige el plan." };
  if (!Number.isFinite(importe) || importe <= 0) {
    return { error: "Escribe un importe mayor a cero." };
  }
  // El importe se guarda en centavos: nunca en decimales flotantes.
  const registro = {
    plan_id: planId,
    currency: moneda.slice(0, 3),
    amount_cents: Math.round(importe * 100),
    billing_interval: intervalo,
    interval_count: 1,
    is_active: true,
    is_default: true,
    provider: "transferencia" as const,
  };

  const supabase = await crearClienteServidor();

  // Publicar un precio implica que el plan sea visible: la política de lectura
  // de precios exige que el plan sea público y esté activo. Sin esto, el precio
  // se guarda pero el dueño no lo ve, y parece que no se guardó nada.
  await supabase.from("plans").update({ is_public: true, is_active: true }).eq("id", planId);

  const { error } = id
    ? await supabase.from("plan_prices").update(registro).eq("id", id)
    : await supabase.from("plan_prices").insert(registro);

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/app/admin/planes");
  revalidatePath("/unete");
  return { ok: id ? "Precio actualizado." : "Precio publicado." };
}
