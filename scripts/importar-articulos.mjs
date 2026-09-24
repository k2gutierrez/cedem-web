#!/usr/bin/env node
/**
 * Importa el archivo editorial de CEDEM a Supabase.
 *
 * Lee `supabase/datos/articulos.json` (lo genera `importar-wordpress.mjs`) y crea
 * los contenidos en la base respetando las reglas del esquema:
 *
 *  · El contenido nace en **borrador**: el trigger no permite crearlo publicado.
 *  · El cuerpo se guarda antes de publicar.
 *  · Un artículo necesita autoría declarada.
 *
 * Todo el archivo migrado entra como **público**: son artículos que ya estaban
 * abiertos en el sitio anterior, y cerrarlos rompería el posicionamiento y la
 * promesa de contenido abierto. Lo reservado para miembros es el material nuevo
 * y los documentos del método.
 *
 * Uso:
 *   node scripts/importar-articulos.mjs            # importa todo
 *   node scripts/importar-articulos.mjs --limite 5 # prueba con cinco
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");

/* --- Variables de entorno (sin dependencias) ------------------------------- */

const env = {};
try {
  const texto = await readFile(resolve(RAIZ, ".env.local"), "utf8");
  for (const linea of texto.split("\n")) {
    const m = /^([A-Z_]+)=(.*)$/.exec(linea.trim());
    if (m) env[m[1]] = m[2].trim();
  }
} catch {
  console.error("❌ No pude leer .env.local");
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const argumentos = process.argv.slice(2);
const limite = argumentos.includes("--limite")
  ? Number(argumentos[argumentos.indexOf("--limite") + 1])
  : null;

/* --- Importación ----------------------------------------------------------- */

const articulos = JSON.parse(
  await readFile(resolve(RAIZ, "supabase/datos/articulos.json"), "utf8"),
);
const lista = limite ? articulos.slice(0, limite) : articulos;

console.log(`Artículos en el archivo: ${articulos.length}`);
console.log(`Se van a importar: ${lista.length}\n`);

let creados = 0;
let saltados = 0;
let fallos = 0;

for (const [i, articulo] of lista.entries()) {
  const titulo = articulo.titulo.slice(0, 200);
  const slug = articulo.slug;

  // ¿Ya existe? Se compara por slug para poder repetir la importación sin duplicar.
  const { data: existente } = await supabase
    .from("contents")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existente) {
    saltados++;
    continue;
  }

  // 1. El contenido nace en borrador (regla del esquema).
  const { data: creado, error: errorContenido } = await supabase
    .from("contents")
    .insert({
      content_type: "articulo",
      slug,
      title: titulo,
      excerpt: articulo.extracto?.slice(0, 500) ?? null,
      visibility: "publico",
      status: "borrador",
      locale: "es-MX",
      legacy_url: articulo.url_original,
      legacy_id: String(articulo.wordpress_id),
      imported_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (errorContenido || !creado) {
    fallos++;
    console.error(`  ✗ ${titulo.slice(0, 60)} — ${errorContenido?.message}`);
    continue;
  }

  // 2. El cuerpo.
  const { error: errorCuerpo } = await supabase
    .from("content_bodies")
    .upsert(
      { content_id: creado.id, body_md: articulo.cuerpo_html },
      { onConflict: "content_id" },
    );

  if (errorCuerpo) {
    fallos++;
    console.error(`  ✗ cuerpo de ${slug} — ${errorCuerpo.message}`);
    continue;
  }

  // 3. La autoría (obligatoria para publicar un artículo).
  await supabase
    .from("articles")
    .upsert(
      { content_id: creado.id, authored_by_cedem: true },
      { onConflict: "content_id" },
    );

  // 4. Publicar, conservando la fecha original.
  const { error: errorPublicar } = await supabase
    .from("contents")
    .update({
      status: "publicado",
      published_at: articulo.publicado_at,
    })
    .eq("id", creado.id);

  if (errorPublicar) {
    fallos++;
    console.error(`  ✗ publicar ${slug} — ${errorPublicar.message}`);
    continue;
  }

  creados++;
  if (creados % 20 === 0 || creados === lista.length) {
    console.log(`  … ${creados} importados`);
  }
}

console.log(`\n✅ Importación terminada`);
console.log(`   creados:  ${creados}`);
console.log(`   saltados: ${saltados} (ya existían)`);
console.log(`   fallos:   ${fallos}`);

const { count } = await supabase
  .from("contents")
  .select("id", { count: "exact", head: true })
  .eq("content_type", "articulo")
  .eq("status", "publicado");
console.log(`\n   Artículos publicados en la base: ${count}`);
