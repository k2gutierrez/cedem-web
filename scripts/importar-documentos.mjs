#!/usr/bin/env node
/**
 * Publica los documentos metodológicos de CEDEM en la biblioteca de la plataforma.
 *
 * QUÉ HACE, Y POR QUÉ ASÍ
 *
 * Los once documentos del método viven hoy como PDF sueltos en el sitio anterior:
 * no se pueden buscar, no se pueden leer en el teléfono y no se sabe quién los
 * descarga. Aquí se convierten en contenido de primera clase:
 *
 *   contents        ficha (título, resumen, extracto, visibilidad, estado)
 *   content_bodies  el texto completo, extraído del PDF, para leer en pantalla
 *   documents       el archivo, sus páginas y el aviso de derechos
 *   Storage         el PDF, en el bucket privado `documents/{content_id}/…`
 *
 * La ruta del archivo empieza por el id del contenido a propósito: la política
 * `private_buckets_read` llama a `can_read_storage_object()`, que aplica la misma
 * regla que el cuerpo (premium -> membresía vigente). Así el PDF no se puede
 * pedir sin derecho, aunque alguien adivine el nombre.
 *
 * La descarga no se sirve con URL pública: la biblioteca pide `get_download_path()`
 * por RPC y el servidor firma una URL temporal. Toda descarga queda en `access_logs`.
 *
 * Uso:
 *   node scripts/importar-documentos.mjs --revisar   # solo muestra el texto extraído
 *   node scripts/importar-documentos.mjs             # sube y publica
 *   node scripts/importar-documentos.mjs --rehacer   # borra lo importado y vuelve a empezar
 */

import { execFileSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const ORIGEN = resolve(RAIZ, "..", "assets", "documentos-metodo");

/* --- Aviso de derechos que ya traen los PDF en su pie de página ------------- */

const DERECHOS = [
  "Derechos exclusivos de CEDEM. Guadalajara, Jal., México 2021.",
  "«Dueñez»® es una marca registrada por Carlos A. Dumois Núñez.",
  "Prohibida la reproducción parcial o total de este material sin la autorización por escrito del autor.",
].join(" ");

/* --- Los documentos, en el orden en que se leen ----------------------------
 * `eje` conecta cada documento con los tres verbos del método —generar,
 * multiplicar, capturar valor— que son también los del motor del Camino del
 * Dueño. No es decoración: es el índice con el que se estudia la Dueñez.
 * -------------------------------------------------------------------------- */

const DOCUMENTOS = [
  {
    archivo: "que-es-la-duenez-empresaria.pdf",
    slug: "que-es-la-duenez-empresaria",
    titulo: "¿Qué es la Dueñez Empresaria?",
    resumen:
      "La palabra que falta en el diccionario y el rol que falta en la empresa. El punto de partida del método: qué hace el dueño que no hace nadie más.",
    eje: "fundamento",
  },
  {
    archivo: "chips-de-dueno-y-director.pdf",
    slug: "chips-de-dueno-y-director",
    titulo: "Chips de Dueño y Director",
    resumen:
      "Dueño y director son dos oficios distintos y complementarios, y casi nadie los separa. Qué chip hay que poner en cada decisión.",
    eje: "rol",
  },
  {
    archivo: "la-duenez-hace-la-diferencia.pdf",
    slug: "la-duenez-hace-la-diferencia",
    titulo: "La Dueñez hace la Diferencia",
    resumen:
      "El rol de dueño está descuidado en la empresa familiar. Tomarlo en serio es lo que permite permanecer y crear valor también para la sociedad.",
    eje: "fundamento",
  },
  {
    archivo: "la-fuerza-dispersante.pdf",
    slug: "la-fuerza-dispersante",
    titulo: "La Fuerza Dispersante",
    resumen:
      "La inercia que desvía a la empresa de su mejor oportunidad. Sus tres formas —desenfoque, soledad y tolerancia— son las que el Camino del Dueño mide.",
    eje: "fundamento",
  },
  {
    archivo: "lentes-bifocales.pdf",
    slug: "lentes-bifocales",
    titulo: "Lentes Bifocales",
    resumen:
      "Mirar a la vez el día de hoy y el año que viene. Cómo se sostiene la operación sin soltar la estrategia cuando el entorno no deja de moverse.",
    eje: "rol",
  },
  {
    archivo: "lastres-del-crecimiento.pdf",
    slug: "lastres-del-crecimiento",
    titulo: "Lastres del Crecimiento",
    resumen:
      "Muchas empresas engordan en lugar de crecer: aumentan de tamaño y destruyen valor. Los rendimientos decrecientes y la fuga de valor, explicados.",
    eje: "generar",
  },
  {
    archivo: "duenez-y-concentracion-estrategica.pdf",
    slug: "duenez-y-concentracion-estrategica",
    titulo: "Dueñez y Concentración Estratégica",
    resumen:
      "La creación de valor responde a oportunidades efímeras. Concentrarse es la práctica más relevante del dueño, y también la más difícil de sostener.",
    eje: "generar",
  },
  {
    archivo: "creando-valor.pdf",
    slug: "creando-valor",
    titulo: "Creando Valor",
    resumen:
      "«Crear valor» se popularizó sin que nadie sepa cómo se hace. La creación de valor se conjuga en gerundio: es una práctica, no un resultado.",
    eje: "generar",
  },
  {
    archivo: "enfoque-competitivo-y-generacion-de-valor.pdf",
    slug: "enfoque-competitivo-y-generacion-de-valor",
    titulo: "Enfoque Competitivo y Generación de Valor",
    resumen:
      "El valor se genera al posicionarse como líder en cada mercado que se atiende. El buen dueño crea riqueza una y otra vez, no una vez por casualidad.",
    eje: "generar",
  },
  {
    archivo: "sinergia-org-y-multiplicacion-de-valor.pdf",
    slug: "sinergia-organizacional-y-multiplicacion-de-valor",
    titulo: "Sinergia Organizacional y Multiplicación de Valor",
    resumen:
      "No se multiplica el valor de la empresa sin aprender a multiplicar el poder. El trabajo del dueño no puede ser solitario.",
    eje: "multiplicar",
  },
  {
    archivo: "alineacion-estrategica-y-captura-de-valor.pdf",
    slug: "alineacion-estrategica-y-captura-de-valor",
    titulo: "Alineación Estratégica y Captura de Valor",
    resumen:
      "La captura de valor no llega sola con el crecimiento. Alinear estrategia, indicadores y talento es lo que convierte el esfuerzo en valor capturado.",
    eje: "capturar",
  },
  {
    archivo: "rol-de-dueno-y-creacion-de-valor.pdf",
    slug: "rol-de-dueno-y-creacion-de-valor",
    titulo: "El Rol de Dueño y la Creación de Valor",
    resumen:
      "La presentación completa del método, con la que CEDEM abre el trabajo con un grupo empresarial: del rol de dueño a la creación de valor.",
    eje: "fundamento",
    esPresentacion: true,
  },
];

const EJES = {
  fundamento: { label: "Fundamentos de la Dueñez", orden: 10 },
  rol: { label: "El rol de dueño", orden: 20 },
  generar: { label: "Generar valor", orden: 30 },
  multiplicar: { label: "Multiplicar valor", orden: 40 },
  capturar: { label: "Capturar valor", orden: 50 },
};

/* --- Entorno --------------------------------------------------------------- */

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

const args = process.argv.slice(2);
const soloRevisar = args.includes("--revisar");
const rehacer = args.includes("--rehacer");

/* --- Extracción del texto --------------------------------------------------
 * pdftotext devuelve el texto con un salto de línea por cada línea IMPRESA, no
 * por cada párrafo. Sin arreglarlo, el cuerpo se leería como un poema. La regla:
 * cada bloque separado por una línea vacía es un párrafo; dentro del bloque, las
 * líneas se unen con espacio.
 * -------------------------------------------------------------------------- */

/* El pie legal se repite en cada página y NO va separado del último renglón del
 * texto por una línea vacía: si se filtra por bloque, se queda pegado al final
 * del párrafo. Por eso el filtro es línea por línea, y una línea de pie cierra
 * el párrafo en curso. */
const RUIDO = [
  /^\*?Derechos exclusivos de CEDEM/i,
  /^[«"“]?Dueñez[«"”]?\s*®?\s*es una marca registrada/i,
  /^Prohibida la reproducción/i,
  /^(CEDEM|www\.cedem\.com\.mx)$/i,
];

function extraerTexto(rutaPdf) {
  const crudo = execFileSync("pdftotext", ["-enc", "UTF-8", rutaPdf, "-"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });

  const parrafos = [];
  let buffer = [];

  const cerrar = () => {
    const bloque = buffer.join(" ").replace(/\s+/g, " ").trim();
    buffer = [];
    if (bloque) parrafos.push(bloque);
  };

  for (const linea of crudo.split("\n")) {
    const limpia = linea.trim();
    if (limpia === "" || RUIDO.some((r) => r.test(limpia))) cerrar();
    else buffer.push(limpia);
  }
  cerrar();

  // Guiones de partición al final de renglón: "concentra- ción" -> "concentración".
  return parrafos.map((p) => p.replace(/(\p{Ll})-\s+(\p{Ll})/gu, "$1$2"));
}

/* El título del PDF suele abrir el primer párrafo ("CREANDO VALOR Se ha
 * popularizado…"). Se retira para que el extracto empiece en la primera frase
 * de verdad y no repita el encabezado que ya está en la ficha. Se compara
 * palabra por palabra y se cortan tantas como tenga el título. */
function sinTitulo(parrafos, titulo) {
  const palabra = (s) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

  if (!parrafos.length) return parrafos;

  const delTitulo = titulo.split(/\s+/).map(palabra).filter(Boolean);
  const delTexto = parrafos[0].split(/\s+/);

  if (delTitulo.length > delTexto.length) return parrafos;

  const coincide = delTitulo.every((p, i) => palabra(delTexto[i]) === p);
  if (!coincide) return parrafos;

  const sobrante = delTexto.slice(delTitulo.length).join(" ").trim();
  return sobrante ? [sobrante, ...parrafos.slice(1)] : parrafos.slice(1);
}

function contarPalabras(texto) {
  return texto.split(/\s+/).filter(Boolean).length;
}

/* --- Importación ----------------------------------------------------------- */

console.log(`Origen: ${ORIGEN}\n`);

if (rehacer) {
  const { data: previos } = await supabase
    .from("contents")
    .select("id, slug")
    .eq("content_type", "documento");
  for (const p of previos ?? []) {
    const carpeta = `${p.id}`;
    const { data: archivos } = await supabase.storage.from("documents").list(carpeta);
    if (archivos?.length) {
      await supabase.storage.from("documents").remove(archivos.map((a) => `${carpeta}/${a.name}`));
    }
    await supabase.from("contents").delete().eq("id", p.id);
  }
  console.log(`Se retiraron ${previos?.length ?? 0} documentos previos.\n`);
}

let publicados = 0;
let saltados = 0;
let fallos = 0;

for (const doc of DOCUMENTOS) {
  const rutaPdf = resolve(ORIGEN, doc.archivo);

  let info;
  try {
    info = await stat(rutaPdf);
  } catch {
    console.error(`  ✗ ${doc.titulo} — no encuentro ${doc.archivo}`);
    fallos++;
    continue;
  }

  const paginas = Number(
    execFileSync("pdfinfo", [rutaPdf], { encoding: "utf8" })
      .split("\n")
      .find((l) => l.startsWith("Pages:"))
      ?.split(":")[1]
      ?.trim() ?? 0,
  );

  const cuerpoParrafos = sinTitulo(extraerTexto(rutaPdf), doc.titulo);

  const cuerpoMd = cuerpoParrafos.join("\n\n");
  const palabras = contarPalabras(cuerpoMd);
  const extracto = (cuerpoParrafos[0] ?? "").slice(0, 500);
  const minutos = Math.max(1, Math.round(palabras / 200));

  console.log(`▸ ${doc.titulo}`);
  console.log(`  ${doc.archivo}`);
  console.log(
    `  ${paginas} págs · ${(info.size / 1024).toFixed(0)} KB · ${palabras} palabras · ${minutos} min`,
  );
  console.log(`  párrafos: ${cuerpoParrafos.length}`);
  console.log(`  extracto: ${extracto.slice(0, 120)}…`);

  // Los documentos del método son fichas de dos o tres páginas: entre 600 y
  // 1.000 palabras es su tamaño normal, no una señal de alarma. Solo avisa si
  // el texto se ve realmente incompleto.
  if (cuerpoParrafos.length < 2 || palabras < 400) {
    console.log("  ⚠ el texto extraído es sospechosamente corto: revisar antes de publicar\n");
  }

  if (soloRevisar) {
    console.log(`  primer párrafo: ${cuerpoParrafos[0] ?? "(vacío)"}`);
    console.log(`  último párrafo: ${cuerpoParrafos.at(-1) ?? "(vacío)"}\n`);
    continue;
  }

  // ¿Ya está publicado? Se compara por slug para poder repetir sin duplicar.
  const { data: existente } = await supabase
    .from("contents")
    .select("id")
    .eq("content_type", "documento")
    .eq("slug", doc.slug)
    .maybeSingle();

  if (existente) {
    console.log("  = ya estaba en la base\n");
    saltados++;
    continue;
  }

  // 1. La ficha. Nace en borrador: el trigger no permite crearla publicada.
  const { data: creado, error: errorFicha } = await supabase
    .from("contents")
    .insert({
      content_type: "documento",
      slug: doc.slug,
      title: doc.titulo,
      summary: doc.resumen.slice(0, 400),
      excerpt: extracto || null,
      visibility: "premium",
      status: "borrador",
      locale: "es-MX",
      reading_minutes: minutos,
      imported_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (errorFicha || !creado) {
    console.error(`  ✗ ficha — ${errorFicha?.message}\n`);
    fallos++;
    continue;
  }

  const id = creado.id;
  const rutaStorage = `${id}/${doc.slug}.pdf`;

  // 2. El archivo, en el bucket privado.
  const { error: errorSubida } = await supabase.storage
    .from("documents")
    .upload(rutaStorage, await readFile(rutaPdf), {
      contentType: "application/pdf",
      upsert: true,
    });

  if (errorSubida) {
    console.error(`  ✗ Storage — ${errorSubida.message}\n`);
    await supabase.from("contents").delete().eq("id", id);
    fallos++;
    continue;
  }

  // 3. El texto, para leer en pantalla y para el buscador.
  const { error: errorCuerpo } = await supabase
    .from("content_bodies")
    .upsert(
      { content_id: id, body_md: cuerpoMd, body_format: "markdown", word_count: palabras },
      { onConflict: "content_id" },
    );

  if (errorCuerpo) {
    console.error(`  ✗ cuerpo — ${errorCuerpo.message}\n`);
    fallos++;
    continue;
  }

  // 4. Los datos del archivo.
  const { error: errorDoc } = await supabase.from("documents").upsert(
    {
      content_id: id,
      file_path: rutaStorage,
      file_mime: "application/pdf",
      file_size_bytes: info.size,
      pages: paginas || null,
      author_label: "Carlos A. Dumois Núñez · CEDEM",
      rights_notice: DERECHOS,
      is_downloadable: true,
    },
    { onConflict: "content_id" },
  );

  if (errorDoc) {
    console.error(`  ✗ documents — ${errorDoc.message}\n`);
    fallos++;
    continue;
  }

  // 5. El eje temático.
  const { data: etiqueta } = await supabase
    .from("tags")
    .upsert(
      {
        slug: doc.eje,
        label: EJES[doc.eje].label,
        kind: "eje",
        sort_order: EJES[doc.eje].orden,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (etiqueta) {
    await supabase
      .from("content_tags")
      .upsert({ content_id: id, tag_id: etiqueta.id }, { onConflict: "content_id,tag_id" });
  }

  // 6. Publicar.
  const { error: errorPublicar } = await supabase
    .from("contents")
    .update({ status: "publicado", published_at: new Date().toISOString() })
    .eq("id", id);

  if (errorPublicar) {
    console.error(`  ✗ publicar — ${errorPublicar.message}\n`);
    fallos++;
    continue;
  }

  console.log(`  ✓ publicado · ${rutaStorage}\n`);
  publicados++;
}

if (!soloRevisar) {
  const { count } = await supabase
    .from("contents")
    .select("id", { count: "exact", head: true })
    .eq("content_type", "documento")
    .eq("status", "publicado");

  console.log("──────────────────────────────────────────");
  console.log(`  publicados ahora: ${publicados}`);
  console.log(`  ya existían:      ${saltados}`);
  console.log(`  fallos:           ${fallos}`);
  console.log(`  documentos en la base: ${count}`);
}
