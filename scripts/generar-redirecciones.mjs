#!/usr/bin/env node
/**
 * Genera el mapa de redirecciones 301 desde el sitio anterior.
 *
 * Cada artículo migrado guarda su URL original (`legacy_url`). Cuando el dominio
 * apunte al sitio nuevo, esas direcciones tienen que seguir funcionando: si no,
 * se pierde el posicionamiento que CEDEM construyó desde 2019 y los enlaces que
 * la gente compartió dejan de resolver.
 *
 * Salida: `src/lib/redirecciones.json` (lo consume `next.config.ts`).
 *
 * Uso: node scripts/generar-redirecciones.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");

const env = {};
const texto = await readFile(resolve(RAIZ, ".env.local"), "utf8");
for (const linea of texto.split("\n")) {
  const m = /^([A-Z_]+)=(.*)$/.exec(linea.trim());
  if (m) env[m[1]] = m[2].trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data, error } = await supabase
  .from("contents")
  .select("slug, legacy_url, content_type")
  .not("legacy_url", "is", null);

if (error) {
  console.error("❌ No se pudieron leer las URLs anteriores:", error.message);
  process.exit(1);
}

/** Convierte una URL completa en su ruta, sin dominio ni barra final. */
function aRuta(url) {
  try {
    const { pathname } = new URL(url);
    return pathname.replace(/\/+$/, "") || "/";
  } catch {
    return null;
  }
}

const redirecciones = [];
for (const fila of data ?? []) {
  const origen = aRuta(fila.legacy_url);
  if (!origen || origen === "/") continue;

  const destino =
    fila.content_type === "articulo" ? `/recursos/${fila.slug}` : `/${fila.slug}`;

  // Se evita redirigir una ruta a sí misma.
  if (origen === destino) continue;

  redirecciones.push({ source: origen, destination: destino, permanent: true });
}

redirecciones.sort((a, b) => a.source.localeCompare(b.source));

await writeFile(
  resolve(RAIZ, "src/lib/redirecciones.json"),
  JSON.stringify(redirecciones, null, 1) + "\n",
  "utf8",
);

console.log(`✅ ${redirecciones.length} redirecciones escritas en src/lib/redirecciones.json`);
for (const r of redirecciones.slice(0, 3)) {
  console.log(`   ${r.source}  →  ${r.destination}`);
}
if (redirecciones.length > 3) console.log(`   … y ${redirecciones.length - 3} más`);
