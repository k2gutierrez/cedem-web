#!/usr/bin/env node
/**
 * Revisión integral del sistema antes de publicar.
 *
 * Recorre lo que un visitante, un miembro y un administrador pueden hacer, y
 * comprueba que cada cosa responde como debe. Sirve como lista de verificación
 * del día del lanzamiento: si algo se rompe con un cambio, aquí se ve.
 *
 * Uso:
 *   node scripts/revisar-sistema.mjs                  # contra localhost:3000
 *   node scripts/revisar-sistema.mjs https://www.cedem.com.mx
 */

import { chromium } from "/Users/carlosgutierrez/.agents/skills/playwright/node_modules/playwright-core/index.mjs";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const resultados = [];
const registrar = (grupo, prueba, ok, detalle = "") =>
  resultados.push({ grupo, prueba, ok, detalle });

const nav = await chromium.launch({ channel: "chrome" });

/* -------------------------------------------------------------------------- */
/* 1 · Páginas públicas                                                       */
/* -------------------------------------------------------------------------- */

const PUBLICAS = [
  "/",
  "/camino",
  "/consulting",
  "/pce",
  "/master",
  "/recursos",
  "/equipo",
  "/nosotros",
  "/unete",
  "/contacto",
  "/registro",
  "/acceso",
  "/aviso-de-privacidad",
  "/terminos",
  "/sitemap.xml",
  "/robots.txt",
];

{
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  for (const ruta of PUBLICAS) {
    const respuesta = await p.goto(`${BASE}${ruta}`, { waitUntil: "domcontentloaded" });
    const estado = respuesta?.status() ?? 0;
    registrar("público", ruta, estado === 200, `HTTP ${estado}`);
  }
  await ctx.close();
}

/* -------------------------------------------------------------------------- */
/* 2 · Rutas que deben exigir sesión                                          */
/* -------------------------------------------------------------------------- */

const PROTEGIDAS = [
  "/app",
  "/app/perfil",
  "/app/camino",
  "/app/biblioteca",
  "/app/membresia",
  "/app/admin/contenido",
  "/app/admin/miembros",
];

{
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  for (const ruta of PROTEGIDAS) {
    const respuesta = await p.goto(`${BASE}${ruta}`, { waitUntil: "domcontentloaded" });
    const destino = new URL(p.url()).pathname;
    const ok = destino === "/acceso";
    registrar("protegido", ruta, ok, ok ? "redirige al acceso" : `quedó en ${destino} (HTTP ${respuesta?.status()})`);
  }
  await ctx.close();
}

/* -------------------------------------------------------------------------- */
/* 3 · Redirecciones del sitio anterior                                       */
/* -------------------------------------------------------------------------- */

{
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const antiguas = [
    "/2020/04/06/la-duenez-hace-la-diferencia",
    "/2019/08/31/lastres-del-crecimiento",
    "/2023/04/03/empresarios-en-crecimiento-concentracion-estrategica-y-creacion-de-valor",
  ];
  for (const ruta of antiguas) {
    await p.goto(`${BASE}${ruta}`, { waitUntil: "domcontentloaded" });
    const destino = new URL(p.url()).pathname;
    const ok = destino.startsWith("/recursos/");
    registrar("redirección", ruta, ok, `→ ${destino}`);
  }
  await ctx.close();
}

/* -------------------------------------------------------------------------- */
/* 4 · El Camino del Dueño, de principio a fin                                */
/* -------------------------------------------------------------------------- */

{
  const ctx = await nav.newContext({ viewport: { width: 430, height: 950 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errores = [];
  p.on("pageerror", (e) => errores.push(String(e).slice(0, 120)));
  p.on("console", (m) => { if (m.type() === "error") errores.push(m.text().slice(0, 120)); });

  await p.goto(`${BASE}/camino`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Empezar/ }).click();

  const guion = [
    "Más de 20 millones", "En transición: alguien de la siguiente generación viene entrando",
    "Decidimos entre varios: socios, familia, consejo", null,
    "De mis mismos clientes: les voy a vender más", "Que me conoce y confía en mí",
    "Trabajan bien, pero el proyecto común lo empujo yo", "Hay algo por escrito, pero ya está viejo",
    "Les dije las prioridades, pero nada cambió", "Veo los números, pero son del mes pasado",
    null, "Tres o cuatro, y las llevo", "La pienso solo, le doy vueltas",
    "Lo tengo bien identificado, pero no he hecho nada", null, "Tengo dos o tres y no me decido",
    "ABIERTA1", null, "ABIERTA2", "CAPTURA",
  ];

  for (const paso of guion) {
    await p.waitForTimeout(520);
    if (paso === null) { await p.getByRole("button", { name: /Continuar/ }).click(); continue; }
    if (paso === "ABIERTA1") {
      await p.locator("textarea").fill("Liberaría a mi mejor gente para el mercado de Estados Unidos");
      await p.getByRole("button", { name: /^Continuar/ }).click(); continue;
    }
    if (paso === "ABIERTA2") {
      await p.locator("textarea").fill("Soltar el control sin sentir que pierdo la empresa");
      await p.getByRole("button", { name: /^Continuar/ }).click(); continue;
    }
    if (paso === "CAPTURA") {
      await p.locator("#nombre").fill("Revisión");
      /* Correo FIJO, no uno con marca de tiempo: el recorrido crea la cuenta al
         dejar el correo, así que uno distinto por ejecución llenaba la base de
         cuentas de ejemplo. Con uno fijo, la revisión reutiliza la misma. */
      await p.locator("#correo").fill("revision@ejemplo.com");
      await p.getByRole("checkbox").check();
      await p.waitForTimeout(300);
      await p.getByRole("button", { name: /Ver mi lectura/ }).click();
      break;
    }
    await p.getByRole("button", { name: paso, exact: true }).first().click();
  }

  await p.getByText("Tu verbo atorado").first().waitFor({ timeout: 40000 });
  const resultado = await p.evaluate(() => {
    const t = document.body.innerText;
    return {
      verbo: /Tu verbo atorado/.test(t),
      articulos: /Para leer esta semana/.test(t),
      ejercicios: /Para hacer esta semana/.test(t),
      nivel: /Nivel de acompañamiento/.test(t),
    };
  });
  const completo = Object.values(resultado).every(Boolean);
  registrar("camino", "recorrido completo con resultado", completo, JSON.stringify(resultado));

  /* La lectura con IA llega después del resultado base. Se ESPERA a que termine
     en lugar de dormir un tiempo fijo: la llamada al modelo tarda lo que tarde
     —entre 5 y 30 segundos según la carga— y un plazo fijo convertía una tarde
     lenta en un fallo del producto. Si algún día la lectura no llega, el plazo
     largo lo detecta igual. */
  const inicio = Date.now();
  const conIA = await p
    .waitForFunction(() => !/Estoy afinando/.test(document.body.innerText), null, {
      timeout: 45000,
    })
    .then(() => true)
    .catch(() => false);
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  registrar(
    "camino",
    "lectura afinada por IA",
    conIA,
    conIA ? `terminó en ${segundos} s` : "no terminó en 45 s",
  );

  registrar("camino", "sin errores de consola", errores.length === 0, errores.slice(0, 2).join(" / "));
  await ctx.close();
}

/* -------------------------------------------------------------------------- */
/* 5 · El muro de pago: el párrafo reservado no debe viajar al visitante       */
/* -------------------------------------------------------------------------- */

{
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const respuesta = await p.goto(`${BASE}/recursos`, { waitUntil: "networkidle" });
  const html = (await respuesta?.text()) ?? "";
  const hayArticulos = html.includes("/recursos/");
  registrar("contenido", "el archivo se lista en recursos", hayArticulos, "");
  await ctx.close();
}

await nav.close();

/* -------------------------------------------------------------------------- */
/* Informe                                                                    */
/* -------------------------------------------------------------------------- */

const fallos = resultados.filter((r) => !r.ok);
const porGrupo = resultados.reduce((acc, r) => {
  acc[r.grupo] = acc[r.grupo] ?? { total: 0, ok: 0 };
  acc[r.grupo].total++;
  if (r.ok) acc[r.grupo].ok++;
  return acc;
}, {});

console.log(`\nRevisión de ${BASE}\n`);
for (const [grupo, datos] of Object.entries(porGrupo)) {
  const marca = datos.ok === datos.total ? "✅" : "❌";
  console.log(`${marca} ${grupo}: ${datos.ok}/${datos.total}`);
}
console.log(`\nTotal: ${resultados.length - fallos.length}/${resultados.length}`);

if (fallos.length) {
  console.log("\nFallos:");
  for (const f of fallos) console.log(`  ✗ [${f.grupo}] ${f.prueba} — ${f.detalle}`);
}

process.exit(fallos.length === 0 ? 0 : 1);
