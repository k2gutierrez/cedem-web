#!/usr/bin/env node
/**
 * Importación del archivo editorial de CEDEM desde WordPress.
 *
 * Descarga los artículos publicados en cedem.com.mx, los limpia y genera un
 * archivo listo para cargarse en Supabase (Fase 2). También detecta duplicados,
 * porque durante 2022 se republicaron artículos con títulos distintos y el
 * mismo contenido.
 *
 * Uso:
 *   node scripts/importar-wordpress.mjs
 *
 * Salida:
 *   supabase/datos/articulos.json   → contenido listo para importar
 *   supabase/datos/REPORTE.md       → qué se encontró y qué requiere revisión
 *
 * No escribe en la base de datos: solo prepara los datos.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const SALIDA = resolve(RAIZ, "supabase/datos");

const API = "https://www.cedem.com.mx/wp-json/wp/v2";
const CABECERAS = { "User-Agent": "CEDEM-migracion/1.0 (+https://www.cedem.com.mx)" };

/** Quita etiquetas y normaliza espacios. */
function textoPlano(html = "") {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/\s+/g, " ")
    .trim();
}

/** Etiquetas que se conservan en el cuerpo. El resto se despoja sin perder el texto. */
const PERMITIDAS = new Set([
  "p",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
  "strong",
  "em",
  "b",
  "i",
  "a",
  "br",
]);

/**
 * Limpia el HTML del contenido conservando el texto.
 *
 * IMPORTANTE: no se eliminan bloques por clase. Los artículos están construidos
 * con Elementor y el contenido suele venir envuelto en
 * `<div class="elementor-widget-container">…</div>`: borrar el div se llevaba
 * por delante el texto completo del artículo (fue un error real de la primera
 * versión de este script, detectado al ver 35 artículos con 0 palabras).
 */
function limpiarHtml(html = "") {
  let salida = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\[[^\]]{1,60}\]/g, ""); // shortcodes tipo [caption] o [gallery]

  // Se despoja cada etiqueta no permitida, pero se conserva su contenido.
  salida = salida.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (etiqueta, nombre, atributos) => {
    const t = String(nombre).toLowerCase();
    if (!PERMITIDAS.has(t)) return "";
    if (t === "a") {
      const href = /href="([^"]+)"/i.exec(atributos)?.[1];
      return href
        ? `<a href="${href}" target="_blank" rel="noopener noreferrer">`
        : "";
    }
    if (t === "br") return "<br>";
    return etiqueta.startsWith("</") ? `</${t}>` : `<${t}>`;
  });

  return salida
    // El HTML original trae enlaces sin cerrar; se reparan para no arrastrar el
    // error al sitio nuevo (el navegador los cierra solo, pero el dato queda sucio).
    .replace(/<a ([^>]*)>([^<]{0,400}?)(<\/p>)/gi, "<a $1>$2</a>$3")
    .replace(/(<p>\s*<\/p>|<br>\s*<br>)+/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Primer párrafo: es lo que se muestra en el muro de pago. */
function primerParrafo(html = "") {
  const parrafos = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) ?? [];
  for (const p of parrafos) {
    const t = textoPlano(p);
    if (t.length > 60) return t.slice(0, 400);
  }
  return textoPlano(html).slice(0, 400);
}

/** Firma de contenido para detectar republicaciones. */
function firma(titulo, extracto) {
  return `${titulo} ${extracto}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .split(/\s+/)
    .filter((p) => p.length > 4)
    .slice(0, 14)
    .join(" ");
}

async function traerPagina(pagina) {
  const url = `${API}/posts?per_page=100&page=${pagina}&_fields=id,date,slug,link,title,excerpt,content,author,categories,featured_media`;
  const respuesta = await fetch(url, { headers: CABECERAS });
  if (!respuesta.ok) {
    if (respuesta.status === 400) return []; // no hay más páginas
    throw new Error(`WordPress respondió ${respuesta.status} en la página ${pagina}`);
  }
  return respuesta.json();
}

async function main() {
  console.log("Descargando artículos de cedem.com.mx…");
  const todos = [];
  for (let pagina = 1; pagina <= 10; pagina++) {
    const lote = await traerPagina(pagina);
    if (lote.length === 0) break;
    todos.push(...lote);
    console.log(`  página ${pagina}: ${lote.length} artículos (total ${todos.length})`);
  }

  console.log(`\nTotal descargado: ${todos.length} artículos`);

  const articulos = [];
  const firmas = new Map();
  const duplicados = [];

  for (const post of todos) {
    const titulo = textoPlano(post.title?.rendered);
    const html = limpiarHtml(post.content?.rendered ?? "");
    const extracto = primerParrafo(html) || textoPlano(post.excerpt?.rendered);
    const f = firma(titulo, extracto);

    const registro = {
      wordpress_id: post.id,
      slug: post.slug,
      titulo,
      url_original: post.link,
      publicado_at: post.date,
      extracto,
      cuerpo_html: html,
      palabras: textoPlano(html).split(/\s+/).filter(Boolean).length,
      categorias_wordpress: post.categories ?? [],
      imagen_destacada_id: post.featured_media || null,
      // Campos que el equipo editorial debe decidir antes de publicar:
      visibilidad: "publico", // publico | premium
      estado: "borrador", // se revisa antes de publicar
    };

    if (firmas.has(f)) {
      duplicados.push({
        titulo,
        slug: post.slug,
        fecha: post.date,
        repetido_de: firmas.get(f).titulo,
      });
      registro.duplicado_probable = firmas.get(f).slug;
    } else {
      firmas.set(f, { titulo, slug: post.slug });
    }

    articulos.push(registro);
  }

  articulos.sort((a, b) => (a.publicado_at < b.publicado_at ? 1 : -1));

  await mkdir(SALIDA, { recursive: true });
  await writeFile(
    resolve(SALIDA, "articulos.json"),
    JSON.stringify(articulos, null, 1),
    "utf8",
  );

  const sinCuerpo = articulos.filter((a) => a.palabras < 80);
  const cortos = articulos.filter((a) => a.palabras >= 80 && a.palabras < 300);
  const porAnio = articulos.reduce((acc, a) => {
    const anio = a.publicado_at.slice(0, 4);
    acc[anio] = (acc[anio] ?? 0) + 1;
    return acc;
  }, {});

  const reporte = [
    "# Reporte de importación del archivo editorial",
    "",
    `Generado automáticamente desde la API de WordPress de cedem.com.mx.`,
    "",
    "## Totales",
    "",
    `- Artículos descargados: **${articulos.length}**`,
    `- Con cuerpo sustancial (300+ palabras): **${articulos.filter((a) => a.palabras >= 300).length}**`,
    `- Cortos (80-299 palabras): **${cortos.length}**`,
    `- Prácticamente vacíos (menos de 80 palabras): **${sinCuerpo.length}**`,
    `- Duplicados probables detectados: **${duplicados.length}**`,
    "",
    "## Por año",
    "",
    "| Año | Artículos |",
    "|---|---|",
    ...Object.entries(porAnio)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([anio, n]) => `| ${anio} | ${n} |`),
    "",
    "## Duplicados probables (requieren decisión editorial)",
    "",
    duplicados.length
      ? [
          "| Título | Fecha | Repite a |",
          "|---|---|---|",
          ...duplicados.map(
            (d) => `| ${d.titulo} | ${d.fecha.slice(0, 10)} | ${d.repetido_de} |`,
          ),
        ].join("\n")
      : "No se detectaron duplicados por firma de contenido.",
    "",
    "## Artículos sin cuerpo suficiente",
    "",
    sinCuerpo.length
      ? sinCuerpo.map((a) => `- ${a.titulo} (${a.palabras} palabras)`).join("\n")
      : "Ninguno.",
    "",
    "## Siguiente paso",
    "",
    "1. El equipo de CEDEM revisa esta lista y decide qué se publica y qué se archiva.",
    "2. Se marca la visibilidad de cada pieza (`publico` o `premium`).",
    "3. Se cargan a Supabase con el script de la Fase 2.",
    "",
  ].join("\n");

  await writeFile(resolve(SALIDA, "REPORTE.md"), reporte, "utf8");

  console.log(`\n✅ Listo:`);
  console.log(`   ${SALIDA}/articulos.json`);
  console.log(`   ${SALIDA}/REPORTE.md`);
  console.log(
    `\n   ${articulos.length} artículos · ${duplicados.length} duplicados probables · ${sinCuerpo.length} sin cuerpo`,
  );
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
