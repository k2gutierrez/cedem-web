import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la llave de servicio: **se salta todas las reglas de RLS**.
 *
 * Solo para tareas de servidor que lo justifican (aplicar migraciones, crear el
 * primer administrador, tareas programadas). Nunca debe importarse desde un
 * componente de navegador ni desde código que llegue al cliente.
 */
export function crearClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !llave) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Revisa web/.env.local.",
    );
  }

  return createClient(url, llave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
