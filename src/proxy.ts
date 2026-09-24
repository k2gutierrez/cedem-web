import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { llaveAnonima, supabaseConfigurado, urlSupabase } from "@/lib/supabase/configurado";

/**
 * Refresco de sesión y protección de rutas.
 *
 * En Next.js 16 esto se llama `proxy` (antes `middleware`). Hace dos cosas:
 *
 * 1. **Refrescar el token de Supabase** en cada petición. Sin esto, la sesión
 *    caduca y el usuario aparece "desconectado" sin motivo aparente.
 * 2. **Cortar el paso a la plataforma** (`/app/*`) cuando no hay sesión. Es una
 *    comprobación optimista: la autorización de verdad la hace la base de datos
 *    con sus reglas de seguridad. Aquí solo se evita renderizar de más.
 */
export async function proxy(peticion: NextRequest) {
  // Sin Supabase configurado el sitio público funciona igual: se deja pasar.
  if (!supabaseConfigurado()) return NextResponse.next({ request: peticion });

  let respuesta = NextResponse.next({ request: peticion });

  const supabase = createServerClient(urlSupabase(), llaveAnonima(), {
    cookies: {
      getAll() {
        return peticion.cookies.getAll();
      },
      setAll(cookiesAEscribir, cabeceras) {
        for (const { name, value } of cookiesAEscribir) {
          peticion.cookies.set(name, value);
        }
        respuesta = NextResponse.next({ request: peticion });
        for (const { name, value, options } of cookiesAEscribir) {
          respuesta.cookies.set(name, value, options);
        }
        for (const [clave, valor] of Object.entries(cabeceras)) {
          respuesta.headers.set(clave, valor);
        }
      },
    },
  });

  // getUser() valida el token contra el servidor de Supabase (no confía en la cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = peticion.nextUrl.pathname;
  const esPlataforma = ruta.startsWith("/app");

  if (esPlataforma && !user) {
    const destino = new URL("/acceso", peticion.url);
    destino.searchParams.set("destino", ruta);
    return NextResponse.redirect(destino);
  }

  // Quien ya tiene sesión no necesita ver el formulario de acceso.
  if (user && (ruta === "/acceso" || ruta === "/registro")) {
    return NextResponse.redirect(new URL("/app", peticion.url));
  }

  return respuesta;
}

export const config = {
  matcher: [
    /*
     * Todas las rutas menos los archivos estáticos y las imágenes optimizadas:
     * ahí no hay sesión que refrescar y solo añadiría latencia.
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico)$).*)",
  ],
};
