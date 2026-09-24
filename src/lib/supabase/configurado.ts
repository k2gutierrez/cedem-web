/**
 * Comprueba si Supabase ya está configurado en el entorno.
 *
 * Mientras Carlos no cree el proyecto y rellene `.env.local`, el sitio funciona
 * con el contenido semilla de `src/content/`. En cuanto estén las variables,
 * la capa de datos empieza a leer de la base sin cambiar una sola página.
 */
export function supabaseConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function urlSupabase(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL. Revisa web/.env.local (ver docs/10-supabase-puesta-en-marcha.md).",
    );
  }
  return url;
}

export function llaveAnonima(): string {
  const llave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!llave) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_ANON_KEY. Revisa web/.env.local (ver docs/10-supabase-puesta-en-marcha.md).",
    );
  }
  return llave;
}
