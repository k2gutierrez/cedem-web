import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { llaveAnonima, urlSupabase } from "@/lib/supabase/configurado";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 *
 * Se crea uno nuevo por petición: reutilizarlo entre peticiones dejaría
 * respuestas sin las cabeceras de no-caché que exige la sesión.
 */
export async function crearClienteServidor() {
  const almacenCookies = await cookies();

  return createServerClient(urlSupabase(), llaveAnonima(), {
    cookies: {
      getAll() {
        return almacenCookies.getAll();
      },
      setAll(cookiesAEscribir) {
        try {
          for (const { name, value, options } of cookiesAEscribir) {
            almacenCookies.set(name, value, options);
          }
        } catch {
          // Un Server Component no puede escribir cookies. Es esperado y no es
          // un error: el refresco de sesión lo hace el middleware.
        }
      },
    },
  });
}
