"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth/sesion";
import { mensajeDeBase } from "@/lib/errores";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/**
 * Gestión de miembros desde el panel.
 *
 * QUÉ RESUELVE
 *
 * Hasta ahora, dar acceso a alguien que ya es cliente de la firma, extender una
 * membresía o convertirse en consultor exigía escribir SQL a mano. El plan
 * maestro preveía esta pantalla (`/app/admin/miembros`) y no existía.
 *
 * LAS REGLAS NO VIVEN AQUÍ
 *
 * Toda la autoridad está en las funciones de la base (`admin_set_user_role` y
 * `admin_grant_subscription`): comprueban el rol de quien pide, impiden que un
 * admin se quite su propio rol, reservan los roles administrativos al
 * super_admin y dejan el rastro en la auditoría. Aquí solo se llama y se traduce
 * el error a algo legible. Duplicar esas reglas en TypeScript sería tener dos
 * versiones de la misma verdad, y la que se olvidaría de actualizar es esta.
 */

export type EstadoMiembro = { error?: string; ok?: string };

const ROLES: Record<string, string> = {
  miembro_free: "Miembro gratuito",
  miembro_premium: "Miembro premium",
  consultor: "Consultor",
  admin: "Administrador",
  super_admin: "Super administrador",
};

/* Los errores de estas dos funciones ya vienen escritos para el equipo —«Solo
   super_admin puede otorgar roles administrativos», «No puedes quitarte a ti
   mismo el rol administrativo»—, así que se muestran tal cual y no se reescriben
   aquí: sería mantener dos versiones del mismo texto. */
const ALTERNO_ROL = "No se pudo cambiar el rol. Vuelve a intentarlo o revisa la auditoría.";
const ALTERNO_MEMBRESIA = "No se pudo otorgar la membresía. Vuelve a intentarlo.";

/** Cambia el rol de un miembro. Deja registro con el motivo. */
export async function cambiarRol(datos: FormData): Promise<void> {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/app");

  const userId = String(datos.get("usuario") ?? "");
  const rol = String(datos.get("rol") ?? "");
  const motivo = String(datos.get("motivo") ?? "").trim();
  const destino = "/app/admin/miembros";

  if (!userId || !ROLES[rol]) redirect(`${destino}?aviso=rol-invalido`);

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("admin_set_user_role", {
    p_user: userId,
    p_role: rol,
    p_reason: motivo || `Cambio de rol a ${ROLES[rol]} desde el panel`,
  });

  revalidatePath(destino);

  if (error) {
    redirect(
      `${destino}?aviso=${encodeURIComponent(mensajeDeBase(error, ALTERNO_ROL, "miembros.rol"))}`,
    );
  }
  redirect(`${destino}?hecho=${encodeURIComponent(`Rol actualizado a ${ROLES[rol]}.`)}`);
}

/** Otorga o extiende una membresía (cortesía, acuerdo comercial, extensión). */
export async function otorgarMembresia(datos: FormData): Promise<void> {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/app");

  const userId = String(datos.get("usuario") ?? "");
  const planId = String(datos.get("plan") ?? "");
  const dias = Number(datos.get("dias") ?? 365);
  const motivo = String(datos.get("motivo") ?? "").trim();
  const destino = "/app/admin/miembros";

  if (!userId || !planId) redirect(`${destino}?aviso=datos-incompletos`);
  if (!Number.isFinite(dias) || dias <= 0) {
    redirect(`${destino}?aviso=${encodeURIComponent("Los días de vigencia tienen que ser mayores a cero.")}`);
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("admin_grant_subscription", {
    p_user: userId,
    p_plan_id: planId,
    p_days: Math.round(dias),
    p_reason: motivo || "Alta manual desde el panel",
  });

  revalidatePath(destino);
  revalidatePath("/app");
  revalidatePath("/app/membresia");

  if (error) {
    redirect(
      `${destino}?aviso=${encodeURIComponent(
        mensajeDeBase(error, ALTERNO_MEMBRESIA, "miembros.membresia"),
      )}`,
    );
  }
  redirect(
    `${destino}?hecho=${encodeURIComponent(`Membresía otorgada por ${Math.round(dias)} días.`)}`,
  );
}
