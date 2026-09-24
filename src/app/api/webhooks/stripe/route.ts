import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { crearClienteStripe } from "@/lib/pagos/stripe";
import { crearClienteAdmin } from "@/lib/supabase/cliente-admin";

/**
 * El webhook de Stripe: aquí se confirma de verdad un pago.
 *
 * ES LA ÚNICA FUENTE DE VERDAD, Y ESO ES DELIBERADO
 *
 * Cuando alguien paga, Stripe llama a esta dirección desde sus servidores. No
 * depende de que la persona vuelva a la página: si cierra el navegador después de
 * pagar, la membresía se activa igual. Y al revés, nadie puede conseguir acceso
 * escribiendo a mano la dirección de vuelta, porque el acceso no se concede ahí.
 *
 * POR QUÉ SE VERIFICA LA FIRMA
 *
 * Esta dirección es pública: cualquiera puede hacerle una petición POST. Lo que
 * no puede es **falsificar la firma**, que Stripe calcula con el secreto del
 * webhook sobre el cuerpo exacto del mensaje. Sin esta comprobación, mandar un
 * JSON diciendo «esta persona pagó» sería suficiente para regalar membresías.
 *
 * SE RESPONDE 200 A LO QUE NO SE ENTIENDE
 *
 * Stripe reintenta durante días cualquier respuesta que no sea 2xx. Si el evento
 * no nos interesa, se contesta 200 y se acabó; si el fallo es nuestro (la base no
 * responde), se contesta 500 **a propósito**, para que Stripe lo reintente.
 */

export async function POST(peticion: NextRequest) {
  const stripe = crearClienteStripe();
  const secreto = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !secreto) {
    console.error("[webhook] Stripe no está configurado");
    return NextResponse.json({ ok: false, motivo: "sin-configurar" }, { status: 503 });
  }

  const firma = peticion.headers.get("stripe-signature");
  if (!firma) {
    return NextResponse.json({ ok: false, motivo: "sin-firma" }, { status: 400 });
  }

  // El cuerpo tiene que leerse CRUDO: cualquier reserialización cambia los bytes
  // y la firma deja de coincidir.
  const cuerpo = await peticion.text();

  let evento: Stripe.Event;
  try {
    evento = stripe.webhooks.constructEvent(cuerpo, firma, secreto);
  } catch (e) {
    console.error("[webhook] firma inválida:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, motivo: "firma-invalida" }, { status: 400 });
  }

  try {
    switch (evento.type) {
      case "checkout.session.completed": {
        await confirmarPago(evento.data.object as Stripe.Checkout.Session);
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        await confirmarPago(evento.data.object as Stripe.Checkout.Session);
        break;
      }

      case "checkout.session.async_payment_failed": {
        await marcarFallido(evento.data.object as Stripe.Checkout.Session, "El pago no se completó");
        break;
      }

      case "charge.refunded": {
        await marcarReembolso(evento.data.object as Stripe.Charge);
        break;
      }

      default:
        // Se contesta 200 para que Stripe no lo reintente: no nos interesa.
        break;
    }
  } catch (e) {
    console.error("[webhook] fallo al procesar", evento.type, e instanceof Error ? e.message : e);
    // 500 a propósito: que Stripe lo vuelva a intentar.
    return NextResponse.json({ ok: false, motivo: "error-interno" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, evento: evento.type });
}

/** Activa la membresía y marca el pago como pagado. */
async function confirmarPago(sesion: Stripe.Checkout.Session) {
  const admin = crearClienteAdmin();

  const pagoId = sesion.metadata?.payment_id ?? sesion.client_reference_id ?? null;
  const userId = sesion.metadata?.user_id ?? null;
  const planId = sesion.metadata?.plan_id ?? null;
  const dias = Number(sesion.metadata?.dias ?? 30);

  if (!pagoId || !userId || !planId) {
    console.error("[webhook] la sesión no trae los datos del pago:", sesion.id);
    return;
  }

  // El importe que se cobró de verdad, no el que creíamos: si no coincide con el
  // borrador, se deja escrito para poder revisarlo.
  const cobrado = sesion.amount_total ?? null;
  const moneda = (sesion.currency ?? "mxn").toUpperCase();

  const { error: errorPago } = await admin
    .from("payments")
    .update({
      external_id: sesion.payment_intent ? String(sesion.payment_intent) : sesion.id,
      status: "pagado",
      paid_at: new Date().toISOString(),
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + dias * 86_400_000).toISOString(),
      currency: moneda,
      ...(cobrado !== null ? { amount_cents: cobrado } : {}),
      raw_payload: {
        checkout_session_id: sesion.id,
        payment_intent: sesion.payment_intent ?? null,
        customer_email: sesion.customer_details?.email ?? null,
        modo: sesion.mode,
        plan_price_id: sesion.metadata?.plan_price_id ?? null,
      },
    })
    .eq("id", pagoId);

  if (errorPago) {
    console.error("[webhook] no se pudo marcar el pago:", errorPago.message);
    throw new Error(errorPago.message);
  }

  // La membresía la activa la función de la base, que además liga el pago a la
  // suscripción, ajusta el rol y deja el registro en la auditoría.
  const { error: errorMembresia } = await admin.rpc("service_grant_subscription", {
    p_user: userId,
    p_plan_id: planId,
    p_days: dias,
    p_payment_id: pagoId,
    p_reason: "Pago con tarjeta confirmado por Stripe",
  });

  if (errorMembresia) {
    console.error("[webhook] no se pudo activar la membresía:", errorMembresia.message);
    throw new Error(errorMembresia.message);
  }

  console.info(`[webhook] membresía activada para ${userId} (${dias} días) · pago ${pagoId}`);
}

async function marcarFallido(sesion: Stripe.Checkout.Session, motivo: string) {
  const admin = crearClienteAdmin();
  const pagoId = sesion.metadata?.payment_id ?? sesion.client_reference_id;
  if (!pagoId) return;

  await admin
    .from("payments")
    .update({ status: "fallido", failure_reason: motivo })
    .eq("id", pagoId);
}

async function marcarReembolso(cargo: Stripe.Charge) {
  const admin = crearClienteAdmin();
  const intent = String(cargo.payment_intent ?? "");
  if (!intent) return;

  // Se busca por el identificador del cargo en la pasarela. La membresía NO se
  // revoca sola: un reembolso puede ser un acuerdo con el cliente, y quitarlo de
  // golpe le cerraría el acceso sin explicación. Se marca el pago y el equipo
  // decide; el aviso queda en el panel de pagos.
  const { error } = await admin
    .from("payments")
    .update({
      status: "reembolsado",
      refunded_at: new Date().toISOString(),
      failure_reason: "Reembolsado en Stripe",
    })
    .eq("external_id", intent);

  if (error) console.error("[webhook] no se pudo marcar el reembolso:", error.message);
}
