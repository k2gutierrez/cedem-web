"use server";

import { revalidatePath } from "next/cache";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteAdmin } from "@/lib/supabase/cliente-admin";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/**
 * Dar cuenta de acceso a alguien del equipo.
 *
 * QUÉ RESUELVE
 *
 * Agregar a un consultor a la página de Equipo y darle acceso a la plataforma eran
 * dos cosas separadas: la ficha se creaba desde el panel, pero su cuenta había que
 * crearla por otro camino y luego ligarla a mano. Sin ese vínculo, el consultor no
 * puede entrar ni editar su propia ficha.
 *
 * CÓMO SE HACE
 *
 *  1. Se crea la cuenta con el correo y una **contraseña temporal** que devuelve
 *     esta acción para que quien administra se la pase a la persona.
 *  2. Se liga la ficha del consultor a esa cuenta (`consultants.profile_id`).
 *  3. La cuenta nace con rol `consultor`: entra, ve los diagnósticos de los dueños
 *     y puede editar su ficha. No paga membresía, porque el equipo de CEDEM no paga.
 *
 * POR QUÉ UNA CONTRASEÑA TEMPORAL Y NO UNA INVITACIÓN
 *
 * La invitación depende del correo, y el correo todavía no sale. Con la contraseña
 * temporal, el acceso se resuelve en el momento: quien administra la copia y se la
 * pasa por WhatsApp, y la persona la cambia al entrar desde su perfil.
 */

export type EstadoCuentaEquipo = { error?: string; ok?: string; clave?: string; correo?: string };

/** Una contraseña legible de dictar por teléfono, pero no adivinable. */
function claveTemporal(): string {
  const palabras = ["Cedem", "Duenez", "Valor", "Consejo", "Patrimonio", "Empresa"];
  const palabra = palabras[Math.floor(Math.random() * palabras.length)];
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `${palabra}-${numero}-2026`;
}

export async function crearCuentaEquipo(
  _estado: EstadoCuentaEquipo,
  datos: FormData,
): Promise<EstadoCuentaEquipo> {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return { error: "No tienes permisos para dar acceso al equipo." };

  const consultorId = String(datos.get("consultor") ?? "");
  const correo = String(datos.get("correo") ?? "").trim().toLowerCase();
  const rol = String(datos.get("rol") ?? "consultor");

  if (!consultorId) return { error: "No sé a quién darle acceso." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return { error: "Escribe un correo válido." };
  if (!["consultor", "admin"].includes(rol)) return { error: "Ese rol no se asigna desde aquí." };

  if (rol === "admin" && sesion.perfil?.role !== "super_admin") {
    return { error: "Solo un super administrador puede dar permisos de administración." };
  }

  const supabase = await crearClienteServidor();

  const { data: consultor } = await supabase
    .from("consultants")
    .select("id, full_name, profile_id")
    .eq("id", consultorId)
    .maybeSingle();

  if (!consultor) return { error: "Esa ficha ya no existe." };
  if (consultor.profile_id) {
    return { error: "Esa persona ya tiene cuenta. Si perdió la contraseña, restablécela." };
  }

  const admin = crearClienteAdmin();
  const clave = claveTemporal();

  const { data: creada, error: errorCuenta } = await admin.auth.admin.createUser({
    email: correo,
    password: clave,
    // Sin confirmación por correo: entra directo, como se acordó.
    email_confirm: true,
    user_metadata: { full_name: consultor.full_name, origen: "equipo-cedem" },
  });

  if (errorCuenta || !creada.user) {
    const yaExiste = /already|registered|exists/i.test(errorCuenta?.message ?? "");
    return {
      error: yaExiste
        ? "Ya hay una cuenta con ese correo. Búscala en Miembros y dale el rol de consultor."
        : `No se pudo crear la cuenta: ${errorCuenta?.message ?? "error desconocido"}`,
    };
  }

  // El rol y el vínculo con la ficha. El trigger ya creó el perfil con el nombre.
  await admin
    .from("profiles")
    .update({ role: rol as "consultor" | "admin", full_name: consultor.full_name })
    .eq("id", creada.user.id);

  const { error: errorVinculo } = await admin
    .from("consultants")
    .update({ profile_id: creada.user.id })
    .eq("id", consultorId);

  if (errorVinculo) {
    console.error("[equipo] no se pudo ligar la ficha:", errorVinculo.message);
    return {
      error:
        "La cuenta se creó, pero no pude ligarla a su ficha. Búscala en Miembros y avísame.",
    };
  }

  await admin.from("audit_logs").insert({
    actor_id: sesion.usuario?.id ?? null,
    actor_email: sesion.usuario?.email ?? null,
    action: "registro",
    entity_table: "consultants",
    entity_id: consultorId,
    actor_role: (sesion.perfil?.role as "admin" | "super_admin") ?? null,
    after: { correo, rol, motivo: "cuenta de equipo" },
    severity: "aviso",
  });

  revalidatePath("/app/admin/equipo");
  revalidatePath("/equipo");

  return {
    ok: `Cuenta creada para ${correo}. Pásale estos datos y que cambie la contraseña al entrar.`,
    clave,
    correo,
  };
}

/** Genera una contraseña nueva para alguien del equipo que perdió la suya. */
export async function restablecerClaveEquipo(
  _estado: EstadoCuentaEquipo,
  datos: FormData,
): Promise<EstadoCuentaEquipo> {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) return { error: "No tienes permisos." };

  const consultorId = String(datos.get("consultor") ?? "");
  if (!consultorId) return { error: "No sé de quién." };

  const supabase = await crearClienteServidor();
  const { data: consultor } = await supabase
    .from("consultants")
    .select("id, profile_id, full_name")
    .eq("id", consultorId)
    .maybeSingle();

  if (!consultor?.profile_id) return { error: "Esa persona todavía no tiene cuenta." };

  const admin = crearClienteAdmin();
  const { data: perfil } = await admin
    .from("profiles")
    .select("email")
    .eq("id", consultor.profile_id)
    .maybeSingle();

  const clave = claveTemporal();
  const { error } = await admin.auth.admin.updateUserById(consultor.profile_id as string, {
    password: clave,
  });

  if (error) return { error: `No se pudo restablecer: ${error.message}` };

  return {
    ok: "Contraseña nueva. Pásasela y que la cambie al entrar.",
    clave,
    correo: (perfil?.email as string) ?? undefined,
  };
}
