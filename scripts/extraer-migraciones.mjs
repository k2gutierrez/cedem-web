#!/usr/bin/env node
/**
 * Extrae las migraciones SQL del documento de diseño y las escribe como
 * archivos versionados en `supabase/migrations/`.
 *
 * El documento `docs/04-modelo-de-datos.md` es la fuente de verdad del esquema:
 * se revisó y se probó ejecutándolo sobre PostgreSQL 16. Este script evita que
 * las dos copias (documento y archivos) se separen.
 *
 * Uso:  node scripts/extraer-migraciones.mjs
 */

import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const DOC = resolve(RAIZ, "../docs/04-modelo-de-datos.md");
const DESTINO = resolve(RAIZ, "supabase/migrations");

const documento = await readFile(DOC, "utf8");
const lineas = documento.split("\n");

/** Localiza los encabezados de migración: "### 5.x Migración NN — Nombre". */
const encabezados = [];
lineas.forEach((linea, i) => {
  const m = /^###\s+5\.\d+\s+Migración\s+(\d+)\s+—\s+(.+)$/.exec(linea.trim());
  if (m) encabezados.push({ numero: Number(m[1]), nombre: m[2].trim(), linea: i });
});

if (encabezados.length === 0) {
  console.error("❌ No se encontró ninguna migración en el documento.");
  process.exit(1);
}

console.log(`Migraciones encontradas en el documento: ${encabezados.length}`);

/** Convierte el nombre a algo apto para archivo. */
function aSlug(nombre) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
}

await rm(DESTINO, { recursive: true, force: true });
await mkdir(DESTINO, { recursive: true });

const creados = [];
const semillas = [];
const pruebas = [];

for (let i = 0; i < encabezados.length; i++) {
  const actual = encabezados[i];
  const fin = i + 1 < encabezados.length ? encabezados[i + 1].linea : lineas.length;
  const cuerpo = lineas.slice(actual.linea, fin).join("\n");

  // Se toman todos los bloques ```sql del apartado.
  //
  // El cierre se detecta como una línea que contiene SOLO ``` — no con una
  // expresión perezosa. Motivo: dentro del SQL hay líneas que contienen ```
  // (por ejemplo el patrón '^(```|~~~)' de first_paragraph), y una expresión
  // perezosa cortaba el bloque ahí, dejando la migración incompleta.
  const bloques = [];
  let dentro = false;
  let acumulado = [];
  for (const linea of cuerpo.split("\n")) {
    const marca = linea.trim();
    if (!dentro && marca.startsWith("```sql")) {
      dentro = true;
      acumulado = [];
      continue;
    }
    if (dentro && marca === "```") {
      dentro = false;
      const bloque = acumulado.join("\n").trim();
      if (bloque) bloques.push(bloque);
      continue;
    }
    if (dentro) acumulado.push(linea);
  }

  if (bloques.length === 0) {
    console.log(`  · ${actual.numero} ${actual.nombre}: sin bloque SQL, se omite`);
    continue;
  }

  // El documento intercala bloques de EJEMPLO dentro de las explicaciones (por
  // ejemplo el "❌ ASÍ NO" de la recursión de policies). Esos bloques no forman
  // parte de la migración y hay que descartarlos, pero el resto de bloques del
  // apartado SÍ son continuación de la misma migración (el SQL va partido en
  // varios bloques con comentarios de sección entre ellos).
  //
  // El criterio es la marca del propio documento: los ejemplos empiezan con ❌
  // o ✅. Descartar por "falta de cabecera de archivo" era un error: dejaba la
  // migración de RLS reducida a 41 líneas de 500.
  const esEjemplo = (bloque) => {
    const primera = bloque.split("\n").find((l) => l.trim() !== "") ?? "";
    return /❌|✅|ASÍ NO|ASI NO|ASÍ SÍ|INCORRECTO/i.test(primera);
  };
  const reales = bloques.filter((b) => !esEjemplo(b));
  if (reales.length === 0) {
    console.log(`  ⚠️  ${actual.numero} ${actual.nombre}: solo bloques de ejemplo; revisar`);
    continue;
  }
  if (reales.length !== bloques.length) {
    console.log(
      `  · ${actual.numero} ${actual.nombre}: ${bloques.length - reales.length} bloque(s) de ejemplo descartado(s)`,
    );
  }
  bloques.length = 0;
  bloques.push(...reales);

  const indice = String(i).padStart(2, "0");
  const marca = `2026010100${indice}00`; // orden secuencial estable
  const archivo = `${marca}_${indice}_${aSlug(actual.nombre)}.sql`;

  // Dentro del apartado puede haber bloques que NO son migración: el seed y las
  // pruebas. Se reparten a sus archivos en lugar de mezclarse con el esquema
  // (mezclarlos rompía la migración: `select plan(4)` de pgTAP no existe en
  // producción).
  const esSeed = (b) => /supabase\/seed\.sql/.test(b.split("\n").slice(0, 4).join("\n"));
  const esPrueba = (b) => /supabase\/tests\/([a-z0-9_]+)\.sql/i.test(b.split("\n").slice(0, 4).join("\n"));

  const deMigracion = [];
  for (const bloque of bloques) {
    if (esSeed(bloque)) {
      await mkdir(resolve(RAIZ, "supabase"), { recursive: true });
      await writeFile(
        resolve(RAIZ, "supabase/seed.sql"),
        `-- Semilla del proyecto. Generado desde docs/04-modelo-de-datos.md.\n-- Se aplica en local y en preview; en producción lo revisa CEDEM antes.\n\n${bloque}\n`,
        "utf8",
      );
      semillas.push(bloque.split("\n").length);
      continue;
    }
    const prueba = esPrueba(bloque);
    if (prueba) {
      const nombre = /supabase\/tests\/([a-z0-9_]+)\.sql/i.exec(
        bloque.split("\n").slice(0, 4).join("\n"),
      )[1];
      await mkdir(resolve(RAIZ, "supabase/tests"), { recursive: true });
      await writeFile(
        resolve(RAIZ, `supabase/tests/${nombre}.sql`),
        `-- Pruebas de la base. Generado desde docs/04-modelo-de-datos.md.\n-- Requieren la extensión pgTAP. NO forman parte de las migraciones.\n\n${bloque}\n`,
        "utf8",
      );
      pruebas.push(nombre);
      continue;
    }
    deMigracion.push(bloque);
  }

  if (deMigracion.length === 0) {
    console.log(`  · ${actual.numero} ${actual.nombre}: sin SQL de esquema (solo seed o pruebas)`);
    continue;
  }

  const cabecera = [
    `-- Migración ${actual.numero} — ${actual.nombre}`,
    `-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).`,
    ``,
  ].join("\n");

  await writeFile(
    resolve(DESTINO, archivo),
    `${cabecera}${deMigracion.join("\n\n")}\n`,
    "utf8",
  );
  creados.push({
    archivo,
    bloques: deMigracion.length,
    lineas: deMigracion.join("\n").split("\n").length,
  });
}

console.log(`\n✅ ${creados.length} archivos de migración escritos en supabase/migrations/`);
for (const c of creados) {
  console.log(`   ${c.archivo}  (${c.lineas} líneas de SQL)`);
}
if (semillas.length) console.log(`\n✅ supabase/seed.sql (${semillas[0]} líneas)`);
if (pruebas.length) console.log(`✅ pruebas: ${pruebas.map((p) => `supabase/tests/${p}.sql`).join(", ")}`);
