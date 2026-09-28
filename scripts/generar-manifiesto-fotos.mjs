/**
 * Genera `src/content/fotos.json`: la lista de fotografías que existen de verdad
 * en `public/`.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 *
 * Carlos pidió que agregar imágenes sea dejar el archivo en su carpeta, sin tocar
 * código. Para eso el componente tiene que saber si la foto existe, y no puede
 * preguntárselo al disco en tiempo de ejecución: en Amplify el servidor corre
 * desde una carpeta que puede no incluir `public/`. Así que la respuesta se
 * calcula al COMPILAR y se hornea en el código: el servidor sólo lee una lista.
 *
 * Se ejecuta solo, desde `pnpm build` y `pnpm dev` (ver package.json). No hay que
 * acordarse de correrlo.
 *
 * Uso manual:  node scripts/generar-manifiesto-fotos.mjs
 */
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const PUBLICO = path.join(RAIZ, "public");
const SALIDA = path.join(RAIZ, "src", "content", "fotos.json");

const CARPETAS = ["fotos", "logos", "og", "graficos"];
const EXTENSIONES = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"]);

/** Recorre una carpeta y devuelve rutas relativas, ordenadas y sin acentos raros. */
function listar(carpeta) {
  const base = path.join(PUBLICO, carpeta);
  if (!fs.existsSync(base)) return [];

  const encontrados = [];
  const recorrer = (dir) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entrada.name.startsWith(".")) continue;
      const completo = path.join(dir, entrada.name);
      if (entrada.isDirectory()) recorrer(completo);
      else if (EXTENSIONES.has(path.extname(entrada.name).toLowerCase())) {
        encontrados.push(path.relative(base, completo).split(path.sep).join("/"));
      }
    }
  };
  recorrer(base);

  return encontrados.sort((a, b) => a.localeCompare(b, "es"));
}

const manifiesto = {
  _nota:
    "Generado por scripts/generar-manifiesto-fotos.mjs. No se edita a mano: " +
    "agrega las imágenes en public/ y vuelve a compilar.",
};
for (const carpeta of CARPETAS) manifiesto[carpeta] = listar(carpeta);

fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
fs.writeFileSync(SALIDA, `${JSON.stringify(manifiesto, null, 2)}\n`, "utf8");

const total = CARPETAS.reduce((suma, carpeta) => suma + manifiesto[carpeta].length, 0);
console.log(`[fotos] ${total} archivo(s) encontrados en public/.`);

/* --------------------------------------------------------------------------
   Aviso de las fotos que el código ya pide y todavía no existen. Se leen del
   propio código (`archivo="..."`) para que esta lista no se quede desfasada.
   -------------------------------------------------------------------------- */
function archivosDeTexto(dir) {
  const salida = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...archivosDeTexto(completo));
    else if (/\.(tsx?|mts)$/.test(entrada.name)) salida.push(completo);
  }
  return salida;
}

const existentes = new Set(
  CARPETAS.flatMap((carpeta) => manifiesto[carpeta].map((f) => `${carpeta}/${f}`)),
);

const pedidas = new Set();
for (const archivo of archivosDeTexto(path.join(RAIZ, "src"))) {
  const texto = fs.readFileSync(archivo, "utf8");
  for (const match of texto.matchAll(/archivo="([^"]+)"/g)) {
    const nombre = match[1];
    pedidas.add(
      /^(fotos|logos|og|graficos)\//.test(nombre) ? nombre : `fotos/${nombre}`,
    );
  }
}

const faltantes = [...pedidas].filter((p) => !existentes.has(p)).sort();
if (faltantes.length) {
  console.log(
    `[fotos] Faltan ${faltantes.length} que el sitio ya pide (se ve el hueco de marca):\n  - ${faltantes.join("\n  - ")}`,
  );
}
