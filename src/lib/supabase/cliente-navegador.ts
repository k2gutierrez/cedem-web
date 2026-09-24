import { createBrowserClient } from "@supabase/ssr";
import { llaveAnonima, urlSupabase } from "@/lib/supabase/configurado";

/**
 * Cliente de Supabase para componentes de navegador ("use client").
 * Solo usa la llave pública: todo lo sensible está protegido por RLS.
 */
export function crearClienteNavegador() {
  return createBrowserClient(urlSupabase(), llaveAnonima());
}
