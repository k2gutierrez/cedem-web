"use server";

import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteAdmin } from "@/lib/supabase/cliente-admin";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { crearClienteStripe, stripeConfigurado } from "@/lib/pagos/stripe";

/**
 * Pago de la membresía con tarjeta.
 *
 * CÓMO FUNCIONA, EN ORDEN
 *
 *  1. El dueño elige un precio y pulsa pagar.
 *  2. Se crea un **borrador de pago** en `payments` con estado `pendiente`. Existe
 *     desde antes de que se cobre nada: si alguien empieza el pago y lo abandona,
 *     queda el rastro y el equipo puede escribirle.
 *  3. Se abre una sesión de pago en Stripe y se le manda allí. Los datos de la
 *     tarjeta no pasan por nuestro servidor en ningún momento.
 *  4. Cuando el pago se completa, **Stripe avisa a nuestro webhook**, y es el
 *     webhook quien marca el pago como pagado y activa la membresía.
 *
 * POR QUÉ LA CONFIRMACIÓN NO DEPENDE DE ESTA ACCIÓN
 *
 * El dueño podría cerrar el navegador justo después de pagar, o perder la
 * conexión al volver. Si la membresía se activara aquí, al volver, habría pagado
 * sin acceso. Y al revés: bastaría con escribir la dirección de vuelta a mano
 * para conseguir acceso sin pagar. Por eso la única fuente de verdad es el
 * webhook, que llega firmado por Stripe.
 */

export async function iniciarPago(datos: FormData): Promise<void> {
  const destino = "/app/membresia";

  const sesion = await obtenerSesion();
  if (!sesion.usuario) redirect(`/acceso?destino=${destino}`);

  if (!stripeConfigurado()) {
    redirect(`${destino}?aviso=${encodeURIComponent("El pago con tarjeta todavía no está disponible. Escríbenos y lo arreglamos por transferencia.")}`);
  }

  const precioId = String(datos.get("precio") ?? "");
  if (!precioId) redirect(`${destino}?aviso=precio-invalido`);

  const supabase = await crearClienteServidor();

  const { data: precio } = await supabase
    .from("plan_prices")
    .select("id, plan_id, currency, amount_cents, billing_interval, interval_count, is_active, plans(name)")
    .eq("id", precioId)
    .eq("is_active", true)
    .maybeSingle();

  if (!precio) redirect(`${destino}?aviso=precio-invalido`);

  const stripe = crearClienteStripe();
  if (!stripe) redirect(`${destino}?aviso=pasarela-sin-configurar`);

  const sitio = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const plan = precio.plans as unknown as { name: string } | null;
  const nombre = plan?.name ?? "Membresía CEDEM 2.0";
  const dias = diasDeIntervalo(precio.billing_interval as string, Number(precio.interval_count ?? 1));

  // 1 · El borrador del pago, con el servicio: `payments` no acepta INSERT desde
  //     el cliente a propósito, porque el importe lo decide el servidor.
  const admin = crearClienteAdmin();
  const { data: pago, error: errorPago } = await admin
    .from("payments")
    .insert({
      user_id: sesion.usuario.id,
      amount_cents: precio.amount_cents,
      currency: precio.currency,
      status: "pendiente",
      provider: "stripe",
      external_reference: `${sesion.usuario.id}:${precio.id}`,
      raw_payload: {
        plan_id: precio.plan_id,
        plan_price_id: precio.id,
        origen: "checkout",
      },
    })
    .select("id")
    .single();

  if (errorPago || !pago) {
    console.error("[pagos] no se pudo crear el borrador:", errorPago?.message);
    redirect(`${destino}?aviso=${encodeURIComponent("No pudimos preparar el pago. Vuelve a intentarlo.")}`);
  }

  // 2 · La sesión de pago.
  let url: string | null = null;
  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      // El correo lo pone Stripe desde el cliente; aquí solo se enlaza la cuenta.
      customer_email: sesion.usuario.email ?? undefined,
      client_reference_id: pago.id,
      metadata: {
        payment_id: pago.id,
        user_id: sesion.usuario.id,
        plan_id: precio.plan_id,
        plan_price_id: precio.id,
        dias: String(dias),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: String(precio.currency).toLowerCase(),
            unit_amount: Number(precio.amount_cents),
            product_data: {
              name: nombre,
              description: `Acceso completo a CEDEM 2.0 · ${etiquetaIntervalo(precio.billing_interval as string)}`,
            },
          },
        },
      ],
      success_url: `${sitio}/app/membresia?pago=recibido`,
      cancel_url: `${sitio}/app/membresia?pago=cancelado`,
    });

    url = checkout.url;
  } catch (e) {
    console.error("[pagos] Stripe rechazó la sesión:", e instanceof Error ? e.message : e);
    redirect(`${destino}?aviso=${encodeURIComponent("La pasarela rechazó el pago. Vuelve a intentarlo en un momento.")}`);
  }

  if (!url) redirect(`${destino}?aviso=pasarela-sin-respuesta`);

  // 3 · Al navegador de Stripe. La membresía se activa cuando llegue el webhook.
  redirect(url);
}

/** Los días de acceso que otorga cada intervalo, para la membresía. */
function diasDeIntervalo(intervalo: string, cantidad: number): number {
  const base: Record<string, number> = {
    mensual: 30,
    trimestral: 91,
    semestral: 182,
    anual: 365,
    unico: 365,
  };
  return (base[intervalo] ?? 30) * Math.max(1, cantidad);
}

function etiquetaIntervalo(intervalo: string): string {
  const etiquetas: Record<string, string> = {
    mensual: "membresía mensual",
    trimestral: "membresía trimestral",
    semestral: "membresía semestral",
    anual: "membresía anual",
    unico: "pago único",
  };
  return etiquetas[intervalo] ?? "membresía";
}
