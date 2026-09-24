import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { supabaseConfigurado } from "@/lib/supabase/configurado";

export type Rol =
  | "visitante"
  | "miembro_free"
  | "miembro_premium"
  | "consultor"
  | "admin"
  | "super_admin";

export type Perfil = {
  id: string;
  email: string;
  role: Rol;
  full_name: string | null;
  display_name: string | null;
  company_name: string | null;
  avatar_path: string | null;
  profile_completed_at: string | null;
};

/** Roles con acceso al panel de administración. */
export const ROLES_ADMIN: Rol[] = ["admin", "super_admin"];
/** Roles con acceso al contenido premium completo. */
export const ROLES_PREMIUM: Rol[] = ["miembro_premium", "consultor", "admin", "super_admin"];

export type Sesion = {
  /** Usuario autenticado, o null si es un visitante. */
  usuario: { id: string; email: string } | null;
  /** Perfil con su rol, o null si no hay sesión. */
  perfil: Perfil | null;
  esAdmin: boolean;
  esPremium: boolean;
  /** true cuando Supabase no está configurado (el sitio público funciona igual). */
  sinConfigurar: boolean;
};

/**
 * Devuelve la sesión actual.
 *
 * El rol se lee del perfil en la base (no del token), para que un cambio de rol
 * surta efecto en la siguiente petición y no cuando caduque el token.
 */
export async function obtenerSesion(): Promise<Sesion> {
  if (!supabaseConfigurado()) {
    return {
      usuario: null,
      perfil: null,
      esAdmin: false,
      esPremium: false,
      sinConfigurar: true,
    };
  }

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      usuario: null,
      perfil: null,
      esAdmin: false,
      esPremium: false,
      sinConfigurar: false,
    };
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, email, role, full_name, display_name, company_name, avatar_path, profile_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  const rol = (perfil?.role ?? "miembro_free") as Rol;

  return {
    usuario: { id: user.id, email: user.email ?? "" },
    perfil: perfil ? ({ ...perfil, role: rol } as Perfil) : null,
    esAdmin: ROLES_ADMIN.includes(rol),
    esPremium: ROLES_PREMIUM.includes(rol),
    sinConfigurar: false,
  };
}

/** Nombre para saludar, con respaldo en el correo. */
export function nombreDe(sesion: Sesion): string {
  const perfil = sesion.perfil;
  return (
    perfil?.display_name?.trim() ||
    perfil?.full_name?.trim().split(/\s+/)[0] ||
    sesion.usuario?.email.split("@")[0] ||
    "dueño"
  );
}
