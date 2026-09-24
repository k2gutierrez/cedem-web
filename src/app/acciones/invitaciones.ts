"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { obtenerSesion } from "@/lib/auth/sesion";

export type EstadoInvitacion = { error?: string; ok?: string; codigo?: string };

/** Código legible: se dicta por teléfono sin errores y no se adivina. */
function generarCodigo(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O/0 ni I/1
  const bloque = (n: number) =>
    Array.from({ length: n }, () =>
      alfabeto[Math.floor(Math.random() * alfabeto.length)],
    ).join("");
  return `CEDEM-${bloque(4)}-${bloque(4)}`;
}

/**
 * Emite una invitación para un cliente de la firma.
 *
 * Es la otra puerta de entrada a CEDEM 2.0: los clientes actuales no pagan la
 * membresía, entran por invitación. Al canjearla se crea una suscripción con
 * origen `invitacion`, así el control de acceso es exactamente el mismo que el
 * de un miembro de pago (ver docs/04-modelo-de-datos.md).
 */
export async function crearInvitacion(
  _estado: EstadoInvitacion,
  datos: FormData,
): Promise<EstadoInvitacion> {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return { error: "No tienes permisos para emitir invitaciones." };

  const correo = String(datos.get("correo") ?? "").trim().toLowerCase() || null;
  const clienteId = String(datos.get("cliente") ?? "") || null;
  const planId = String(datos.get("plan") ?? "");
  const duracion = Number(datos.get("duracion") ?? 365) || 365;
  const notas = String(datos.get("notas") ?? "").trim() || null;

  if (!planId) return { error: "Elige el plan que otorga la invitación." };
  if (correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return { error: "El correo no parece válido." };
  }

  const supabase = await crearClienteServidor();
  const codigo = generarCodigo();

  const { error } = await supabase.from("invitations").insert({
    code: codigo,
    email: correo,
    client_id: clienteId,
    plan_id: planId,
    issued_by: sesion.usuario!.id,
    status: "pendiente",
    duration_days: duracion,
    max_redemptions: 1,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    notes: notas,
  });

  if (error) return { error: `No se pudo emitir: ${error.message}` };

  revalidatePath("/app/admin/invitaciones");
  return { ok: "Invitación emitida. Cópiala y mándasela al cliente.", codigo };
}

/** Revoca una invitación que no se llegó a usar. */
export async function revocarInvitacion(formData: FormData) {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await crearClienteServidor();
  await supabase
    .from("invitations")
    .update({
      status: "revocada",
      revoked_by: sesion.usuario!.id,
      revoked_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/app/admin/invitaciones");
}

/* -------------------------------------------------------------------------- */
/* Canje                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Canjea una invitación. La validación de verdad la hace la función de la base
 * (`redeem_invitation`): vigencia, estado, uso único y correo destinatario. Aquí
 * solo se traduce su respuesta a algo que el dueño entienda.
 */
export async function canjearInvitacion(
  _estado: EstadoInvitacion,
  datos: FormData,
): Promise<EstadoInvitacion> {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) {
    return { error: "Inicia sesión o crea tu cuenta para canjear la invitación." };
  }

  const codigo = String(datos.get("codigo") ?? "").trim();
  if (!codigo) return { error: "Escribe el código de tu invitación." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("redeem_invitation", { p_code: codigo });

  if (error) {
    const mensaje = error.message || "";
    // La base ya devuelve mensajes escritos para el dueño: se muestran tal cual.
    const util = /invitaci|código|sesión|expir|revoc|canje/i.test(mensaje);
    return {
      error: util
        ? mensaje
        : "No pudimos canjear la invitación. Escríbenos y lo revisamos contigo.",
    };
  }

  revalidatePath("/app");
  revalidatePath("/app/biblioteca");
  return { ok: "Listo. Tu acceso completo ya está activo." };
}
