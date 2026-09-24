"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { supabaseConfigurado } from "@/lib/supabase/configurado";

export type EstadoFormulario = { error?: string; ok?: boolean; mensaje?: string };

const SIN_CONFIGURAR =
  "La plataforma todavía no está conectada a la base de datos. Avísale a Carlos.";

function correoValido(correo: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo);
}

/** Traduce los errores de Supabase Auth a algo que un dueño entienda. */
function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("invalid login credentials")) return "El correo o la contraseña no coinciden.";
  if (m.includes("email not confirmed")) return "Falta confirmar tu correo. Revisa tu bandeja.";
  if (m.includes("user already registered")) return "Ese correo ya tiene cuenta. Entra con tu contraseña.";
  if (m.includes("password should be at least")) return "La contraseña necesita al menos 8 caracteres.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera un minuto.";
  return "No pudimos completar la operación. Inténtalo de nuevo.";
}

/* -------------------------------------------------------------------------- */
/* Entrar                                                                     */
/* -------------------------------------------------------------------------- */

export async function entrar(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  if (!supabaseConfigurado()) return { error: SIN_CONFIGURAR };

  const correo = String(datos.get("correo") ?? "").trim().toLowerCase();
  const contrasena = String(datos.get("contrasena") ?? "");
  const destino = String(datos.get("destino") ?? "/app");

  if (!correoValido(correo)) return { error: "Escribe un correo válido." };
  if (contrasena.length < 6) return { error: "Escribe tu contraseña." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  if (error) return { error: traducirError(error.message) };

  revalidatePath("/", "layout");
  redirect(destino.startsWith("/") ? destino : "/app");
}

/* -------------------------------------------------------------------------- */
/* Crear cuenta                                                               */
/* -------------------------------------------------------------------------- */

export async function registrar(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  if (!supabaseConfigurado()) return { error: SIN_CONFIGURAR };

  const nombre = String(datos.get("nombre") ?? "").trim();
  const correo = String(datos.get("correo") ?? "").trim().toLowerCase();
  const contrasena = String(datos.get("contrasena") ?? "");
  const acepta = datos.get("acepto") === "on";
  const destino = String(datos.get("destino") ?? "/app");

  if (nombre.length < 2) return { error: "Escribe tu nombre." };
  if (!correoValido(correo)) return { error: "Escribe un correo válido." };
  if (contrasena.length < 8) return { error: "La contraseña necesita al menos 8 caracteres." };
  if (!acepta) {
    return { error: "Necesitamos tu consentimiento para guardar tus respuestas." };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email: correo,
    password: contrasena,
    options: {
      data: { full_name: nombre },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}${destino.startsWith("/") ? destino : "/app"}`,
    },
  });

  if (error) return { error: traducirError(error.message) };

  // El consentimiento se registra en el perfil (el trigger ya lo creó).
  if (data.user) {
    await supabase
      .from("profiles")
      .update({
        privacy_accepted_at: new Date().toISOString(),
        privacy_policy_version: "2026-01",
        full_name: nombre,
      })
      .eq("id", data.user.id);
  }

  // Si el proyecto exige confirmar el correo, no hay sesión todavía.
  if (!data.session) {
    return {
      ok: true,
      mensaje:
        "Te mandamos un correo para confirmar tu cuenta. Ábrelo y entras directo a tu Camino del Dueño.",
    };
  }

  revalidatePath("/", "layout");
  redirect(destino.startsWith("/") ? destino : "/app");
}

/* -------------------------------------------------------------------------- */
/* Recuperar la contraseña                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Envía el correo para restablecer la contraseña.
 *
 * La respuesta es SIEMPRE la misma, exista o no la cuenta: si dijera «ese correo
 * no está registrado», cualquiera podría averiguar quién es cliente de CEDEM
 * probando direcciones. Es la práctica habitual y conviene mantenerla.
 *
 * El enlace del correo apunta a `/auth/confirmar`, que valida el token y deja al
 * dueño en `/restablecer` con una sesión de recuperación.
 */
export async function pedirRecuperacion(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  if (!supabaseConfigurado()) return { error: SIN_CONFIGURAR };

  const correo = String(datos.get("correo") ?? "").trim().toLowerCase();
  if (!correoValido(correo)) return { error: "Escribe un correo válido." };

  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await crearClienteServidor();

  const { error } = await supabase.auth.resetPasswordForEmail(correo, {
    redirectTo: `${sitio}/auth/confirmar?tipo=recovery&destino=/restablecer`,
  });

  if (error && !/not found|no user/i.test(error.message)) {
    // Un fallo real (sin conexión, plantilla mal configurada) sí se cuenta.
    console.error("[auth] recuperación:", error.message);
    return { error: "No pudimos enviar el correo. Vuelve a intentarlo en un momento." };
  }

  return {
    ok: true,
    mensaje:
      "Si ese correo tiene cuenta en CEDEM 2.0, te llegó un enlace para crear una contraseña nueva. Revisa también el correo no deseado.",
  };
}

/** Cambia la contraseña de quien ya está dentro (por recuperación o por gusto). */
export async function cambiarContrasena(
  _estado: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  if (!supabaseConfigurado()) return { error: SIN_CONFIGURAR };

  const contrasena = String(datos.get("contrasena") ?? "");
  const repetida = String(datos.get("repetida") ?? "");

  if (contrasena.length < 8) {
    return { error: "La contraseña necesita al menos 8 caracteres." };
  }
  if (contrasena !== repetida) return { error: "Las dos contraseñas no coinciden." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "El enlace ya no es válido o pasó demasiado tiempo. Pide uno nuevo desde «Olvidé mi contraseña».",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: contrasena });
  if (error) {
    console.error("[auth] cambio de contraseña:", error.message);
    return { error: "No pudimos guardar la contraseña. Pide un enlace nuevo." };
  }

  return { ok: true, mensaje: "Listo. Tu contraseña quedó guardada." };
}

/* -------------------------------------------------------------------------- */
/* Salir                                                                      */
/* -------------------------------------------------------------------------- */

export async function salir() {
  if (!supabaseConfigurado()) redirect("/");
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
