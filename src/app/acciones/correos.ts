"use server";

import { revalidatePath } from "next/cache";
import { obtenerSesion } from "@/lib/auth/sesion";
import { reintentarPendientes } from "@/lib/correo/enviar";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/**
 * Acciones sobre la cola de correos.
 *
 * Solo dos, y las dos existen por el mismo motivo: que ningún aviso se pierda
 * mientras el envío automático no está configurado.
 */

/** Marca un correo como enviado a mano, con quién lo hizo. */
export async function marcarEnviadoAMano(datos: FormData): Promise<void> {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return;

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const supabase = await crearClienteServidor();
  await supabase
    .from("email_outbox")
    .update({
      estado: "enviado",
      enviado_at: new Date().toISOString(),
      enviado_por: sesion.usuario?.email ?? "equipo",
      error: null,
    })
    .eq("id", id);

  revalidatePath("/app/admin/correos");
}

/** Reintenta todo lo que quedó pendiente o fallido. */
export async function reintentarCola(): Promise<void> {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return;

  const resultado = await reintentarPendientes();
  console.info(
    `[correo] reintento manual: ${resultado.enviados} enviados, ${resultado.fallidos} fallidos`,
  );

  revalidatePath("/app/admin/correos");
}
