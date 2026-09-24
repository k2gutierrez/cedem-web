import {
  articulosDestacados,
  casos,
  datosDeMercado,
  servicios,
  viajeDelDueno,
} from "@/content/site";
import { supabaseConfigurado } from "@/lib/supabase/configurado";

/**
 * Capa de datos del sitio.
 *
 * HOY: devuelve el contenido semilla de `src/content/`, escrito a partir de la
 * investigación verificada. Así el sitio es estático, rápido y se puede revisar
 * sin depender de la base de datos.
 *
 * MAÑANA (Fase 2): estas mismas funciones consultan Supabase. Las páginas no
 * cambian, porque ya llaman a funciones asíncronas. Ese es el motivo de que
 * existan aunque hoy solo devuelvan constantes.
 *
 * Regla de visibilidad: el cuerpo completo del contenido premium se resuelve
 * SIEMPRE en el servidor. Si el rol no da acceso, la fila del cuerpo no llega
 * nunca al navegador (ver docs/04-modelo-de-datos.md).
 */

/** Indica de dónde salió el contenido, para poder verificarlo en el HTML. */
export type Origen = "base-de-datos" | "semilla-local";

export async function obtenerOrigen(): Promise<Origen> {
  return supabaseConfigurado() ? "base-de-datos" : "semilla-local";
}

export async function obtenerViajeDelDueno() {
  // Fase 2: select * from site_settings / tabla propia, ordenado por `orden`
  return viajeDelDueno;
}

export async function obtenerPuertas() {
  // Fase 2: select * from services where activo order by orden
  return servicios;
}

export async function obtenerCasos() {
  // Fase 2: select * from case_studies where publicado order by orden
  return casos;
}

export async function obtenerArticulosDestacados() {
  // Fase 2: select * from contents where tipo = 'articulo' and destacado
  //         and visibilidad = 'publico' order by publicado_at desc limit 3
  return articulosDestacados;
}

export async function obtenerDatosDeMercado() {
  // Fase 2: contenido administrable, porque estas cifras cambian con el tiempo
  return datosDeMercado;
}
