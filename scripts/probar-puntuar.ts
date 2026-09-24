/**
 * Pruebas del motor de puntuación del Camino del Dueño.
 *
 * Verifica que el cálculo coincide con los casos documentados en
 * `docs/05-camino-del-dueno.md`. Si alguien cambia un peso o una regla y esto
 * falla, es que cambió el diagnóstico que reciben los dueños: hay que subir la
 * versión del motor (`cdd-1.1`), no ajustar la prueba.
 *
 * Uso:  pnpm probar:motor
 */

import { calcularPerfil, type Respuestas } from "../src/lib/camino/puntuar";

let fallos = 0;
let pruebas = 0;

function comprobar(nombre: string, obtenido: unknown, esperado: unknown) {
  pruebas++;
  const ok = JSON.stringify(obtenido) === JSON.stringify(esperado);
  if (ok) {
    console.log(`  ✓ ${nombre}`);
  } else {
    fallos++;
    console.log(`  ✗ ${nombre}\n      esperado: ${JSON.stringify(esperado)}\n      obtenido: ${JSON.stringify(obtenido)}`);
  }
}

/* -------------------------------------------------------------------------- */
console.log("\nCaso documentado §4.8 — empresa familiar en sucesión\n");
/* -------------------------------------------------------------------------- */

const sucesion: Respuestas = {
  Q1: "opt_q1_d", // más de 20 M
  Q2: "opt_q2_e", // en transición
  Q3: "opt_q3_c", // compartida
  Q4: "opt_q4_a", // 1
  Q5: "opt_q5_c", // 3
  Q6: "opt_q6_b", // 1
  Q7: "opt_q7_b", // 1
  Q8: "opt_q8_c", // 3
  Q9: "opt_q9_b", // 1
  Q10: "opt_q10_b", // 1
  Q11: "opt_q11_c", // 2
  Q12: "opt_q12_b", // 2
  Q13: "opt_q13_c", // 1
  Q14: "Si dejara de hacer la línea vieja, liberaría a mi mejor gente",
  Q15: "Crecer sin perder el control",
};

const p = calcularPerfil(sucesion);
comprobar("score_generar", p.scoreGenerar, 67);
comprobar("score_multiplicar", p.scoreMultiplicar, 33);
comprobar("score_capturar", p.scoreCapturar, 67);
comprobar("indice", p.indice, 56);
comprobar("banda", p.banda, "ciclo_en_marcha");
comprobar("friccion", p.friccion, 5);
comprobar("friccion_norm", p.friccionNorm, 56);
comprobar("verbo_critico", p.verboCritico, "multiplicar");
comprobar(
  "focos",
  p.focos.map((f) => f.item),
  ["Q6", "Q7"],
);
comprobar("dispersante_dominante", p.dispersanteDominante, "soledad");
comprobar("arquetipo", p.arquetipo, "sucesion_pasando");
comprobar("nivel", p.nivel, "consulting");
comprobar("temperatura", p.temperatura, 2);
comprobar("temperatura_etiqueta", p.temperaturaEtiqueta, "tibio");
comprobar("confianza", p.confianza, "alta");
comprobar("version", p.version, "cdd-1.0");

/* -------------------------------------------------------------------------- */
console.log("\nCaso 4 · dueña que acaba de heredar (hallazgo del plan de pruebas)\n");
/* -------------------------------------------------------------------------- */

const heredera: Respuestas = {
  Q1: "opt_q1_b", // entre 1 y 5 M
  Q2: "opt_q2_f", // acaba de recibir la estafeta
  Q3: "opt_q3_e", // nadie claro: en medio de un cambio
  Q4: "opt_q4_d", // 0
  Q5: "opt_q5_d", // 0
  Q6: "opt_q6_d", // 0
  Q7: "opt_q7_a", // 0
  Q8: "opt_q8_a", // 0
  Q9: "opt_q9_d", // 0
  Q10: "opt_q10_d", // 3
  Q11: "opt_q11_d", // 3
  Q12: "opt_q12_c", // 3
  Q13: "opt_q13_d", // 0
};

const h = calcularPerfil(heredera);
comprobar("arquetipo = recien_heredada", h.arquetipo, "recien_heredada");
comprobar("banda", h.banda, "ciclo_roto");
comprobar("nivel = pce", h.nivel, "pce");
comprobar("friccion = 9", h.friccion, 9);
comprobar("dispersante (empate resuelto por producto)", h.dispersanteDominante, "soledad");
// Temperatura 3 = tibio: rol en transición (+1) + soledad ≥ 2 (+1) + concentración ≤ 1 (+1).
// No llega a "urgente" (≥ 6) porque no hay vacío de rol declarado ni contacto solicitado.
comprobar("temperatura = tibio (3 puntos)", h.temperaturaEtiqueta, "tibio");
comprobar("temperatura exacta", h.temperatura, 3);

/* -------------------------------------------------------------------------- */
console.log("\nCaso dueño profesionalizado sin Dueñez (dispersante nulo)\n");
/* -------------------------------------------------------------------------- */

const profesional: Respuestas = {
  Q1: "opt_q1_c",
  Q2: "opt_q2_d",
  Q3: "opt_q3_b", // gobernador
  Q4: "opt_q4_b", // 3
  Q5: "opt_q5_c", // 3
  Q6: "opt_q6_c", // 3
  Q7: "opt_q7_c", // 3
  Q8: "opt_q8_c", // 3
  Q9: "opt_q9_c", // 3
  Q10: "opt_q10_a", // 0
  Q11: "opt_q11_a", // 0
  Q12: "opt_q12_a", // 0
  Q13: "opt_q13_a", // 3
};

const pr = calcularPerfil(profesional);
comprobar("indice = 100", pr.indice, 100);
comprobar("banda gobernado", pr.banda, "ciclo_gobernado");
comprobar("arquetipo gobernado", pr.arquetipo, "gobernado");
comprobar("friccion = 0", pr.friccion, 0);
comprobar("dispersante nulo (no se inventa una fuerza)", pr.dispersanteDominante, null);

/* -------------------------------------------------------------------------- */
console.log("\nDesempate del verbo crítico: empate a dos, gana el ítem más bajo\n");
/* -------------------------------------------------------------------------- */

const empate: Respuestas = {
  Q4: "opt_q4_a", // 1
  Q5: "opt_q5_c", // 3  → generar 4
  Q6: "opt_q6_a", // 0
  Q7: "opt_q7_c", // 3  → multiplicar 3  (mínimo de ítem = 0)
  Q8: "opt_q8_b", // 1
  Q9: "opt_q9_c", // 3  → capturar 4
};

const e = calcularPerfil(empate);
comprobar("verbo crítico = multiplicar", e.verboCritico, "multiplicar");
comprobar("foco único", e.focos.map((f) => f.item), ["Q6"]);

/* -------------------------------------------------------------------------- */
console.log("\nPerfil incompleto: la confianza baja y no se inventan valores\n");
/* -------------------------------------------------------------------------- */

const parcial = calcularPerfil({ Q1: "opt_q1_a", Q4: "opt_q4_b" });
comprobar("confianza baja", parcial.confianza, "baja");
comprobar("no imputa respuestas faltantes", parcial.scoreMultiplicar, 0);
comprobar("cobertura", Number(parcial.cobertura.toFixed(3)), 0.133);

/* -------------------------------------------------------------------------- */
console.log(
  `\n${fallos === 0 ? "✅" : "❌"} ${pruebas - fallos}/${pruebas} comprobaciones correctas\n`,
);
process.exit(fallos === 0 ? 0 : 1);
