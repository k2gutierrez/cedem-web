#!/usr/bin/env node
/**
 * Comprueba si el saneado cambia el HTML de los artículos, y cuáles.
 *
 *   pnpm exec tsx scripts/revisar-html-articulos.ts            # informe
 *   pnpm exec tsx scripts/revisar-html-articulos.ts --escribir # además lo corrige en la base
 *
 * El saneado del renderizador ya evita la hidratación rota, así que este script
 * NO es necesario para que el sitio funcione. Sirve para dos cosas:
 *
 *   · saber cuántos cuerpos llegaron mal formados de WordPress (dato para CEDEM);
 *   · dejar la base limpia, para que lo que se vea en el panel sea lo que se
 *     publica, sin correcciones invisibles por debajo.
 *
 * Es idempotente: correrlo dos veces no cambia nada la segunda vez.
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { sanearHtml } from "../src/lib/contenido/sanear-html";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");

const env: Record<string, string> = {};
for (const linea of (await readFile(resolve(RAIZ, ".env.local"), "utf8")).split("\n")) {
  const m = /^([A-Z_]+)=(.*)$/.exec(linea.trim());
  if (m) env[m[1]] = m[2].trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const escribir = process.argv.includes("--escribir");

const { data, error } = await supabase
  .from("content_bodies")
  .select("content_id, body_md, body_format, contents!inner(slug, content_type)")
  .eq("body_format", "html");

if (error) {
  console.error("❌ No pude leer los cuerpos:", error.message);
  process.exit(1);
}

console.log(`Cuerpos en HTML: ${data?.length ?? 0}\n`);

const cambiados: { id: string; slug: string; antes: number; despues: number }[] = [];

for (const fila of data ?? []) {
  const original = fila.body_md as string;
  const saneado = sanearHtml(original);
  if (saneado === original) continue;

  const contenido = fila.contents as unknown as { slug: string };
  cambiados.push({
    id: fila.content_id as string,
    slug: contenido.slug,
    antes: original.length,
    despues: saneado.length,
  });

  if (escribir) {
    const { error: errorGuardar } = await supabase
      .from("content_bodies")
      .update({ body_md: saneado })
      .eq("content_id", fila.content_id);
    if (errorGuardar) console.error(`   ✗ ${contenido.slug}: ${errorGuardar.message}`);
  }
}

if (!cambiados.length) {
  console.log("✅ Ningún cuerpo necesita saneado: el HTML está bien formado.\n");
} else {
  console.log(`${escribir ? "Corregidos" : "Necesitan saneado"}: ${cambiados.length}\n`);
  for (const c of cambiados) {
    console.log(`   · ${c.slug}  (${c.antes} → ${c.despues} caracteres)`);
  }
  if (!escribir) console.log("\nPara corregirlos:  pnpm exec tsx scripts/revisar-html-articulos.ts --escribir");
  else console.log("\nVuelve a correrlo sin --escribir para confirmar que ya no queda ninguno.");
}
