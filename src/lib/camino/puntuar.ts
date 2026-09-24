/**
 * Camino del Dueño · Motor de puntuación.
 *
 * Función PURA y determinista: mismas respuestas + misma versión de
 * configuración = mismo perfil, bit a bit. No hace red, no lee fechas, no
 * consulta la base. La IA nunca calcula nada de esto: solo redacta sobre el
 * resultado (ver `docs/05-camino-del-dueno.md`, §4).
 *
 * Cuando cambien los pesos se publica una versión nueva (`cdd-1.1`) y las
 * sesiones viejas se pueden recalcular y comparar.
 */

import { PREGUNTAS, PREGUNTAS_NUCLEO, VERSION_MOTOR } from "@/content/camino/config";
import type { Etapa, Rol, Tamano } from "@/content/camino/config";

export type Respuestas = Record<string, string | undefined>;

export type Perfil = {
  /** Puntaje 0-100 por verbo. */
  scoreGenerar: number;
  scoreMultiplicar: number;
  scoreCapturar: number;
  /** Índice de Dueñez 0-100. No se muestra nunca como número. */
  indice: number;
  banda: Banda;
  bandaTexto: string;
  /** Fuerzas dispersantes 0-3 y su suma 0-9. */
  desenfoque: number;
  soledad: number;
  tolerancia: number;
  friccion: number;
  friccionNorm: number;
  concentracion: number;
  verboCritico: Verbo;
  focos: { item: string; componente: string; frase: string }[];
  dispersanteDominante: Dispersante | null;
  arquetipo: Arquetipo;
  nivel: Nivel;
  temperatura: number;
  temperaturaEtiqueta: "frio" | "tibio" | "caliente" | "urgente";
  /** Perfilado. */
  tamano: Tamano | null;
  etapa: Etapa | null;
  rol: Rol | null;
  sucesion: boolean;
  sucesionReciente: boolean;
  abandonoNoPensado: boolean;
  respuestaDiferida: boolean;
  /** Cobertura: proporción de las 15 preguntas núcleo respondidas. */
  cobertura: number;
  confianza: "alta" | "media" | "baja";
  version: string;
};

export type Verbo = "generar" | "multiplicar" | "capturar";
export type Dispersante = "desenfoque" | "soledad" | "tolerancia";
export type Banda = "ciclo_roto" | "ciclo_en_vilo" | "ciclo_en_marcha" | "ciclo_gobernado";
export type Arquetipo =
  | "gobernado"
  | "ausente"
  | "sucesion_pasando"
  | "recien_heredada"
  | "carga_todo"
  | "sin_captura"
  | "sin_multiplicar"
  | "sin_generar";
export type Nivel = "consulting" | "pce" | "master" | "por_definir";

const BANDAS: Record<Banda, string> = {
  ciclo_roto:
    "Tu ciclo de valor está roto: lo que generas no llega a multiplicarse ni a capturarse.",
  ciclo_en_vilo:
    "Generas, pero el valor se te escapa entre la operación y la caja.",
  ciclo_en_marcha:
    "Tu ciclo funciona a medias: hay valor, pero se está fugando por un lado claro.",
  ciclo_gobernado:
    "Tu ciclo funciona. El tema ya no es apagar fuegos, es decidir el siguiente movimiento.",
};

/** Titulares de cada arquetipo: los lee el dueño. */
export const TITULARES: Record<Arquetipo, string> = {
  gobernado: "Ya gobiernas. Ahora la pregunta es qué sigue.",
  ausente: "La empresa va, pero el dueño no está en la jugada.",
  sucesion_pasando: "Estás pasando la estafeta. Y eso no se hace con buena voluntad.",
  recien_heredada: "Recibiste la empresa. Ahora tienes que ganarte el rol.",
  carga_todo: "Cargas todo tú. Y ese es justo el problema.",
  sin_captura: "Vendes, pero no capitalizas.",
  sin_multiplicar: "Todavía no multiplicas: el valor se queda en ti.",
  sin_generar: "Dejaste de crecer, aunque sigas trabajando igual.",
};

const DISPERSANTE_TEXTO: Record<Dispersante, string> = {
  desenfoque: "El desenfoque: muchas cosas a la vez, y las mejores distraídas.",
  soledad: "La soledad: cargas solo decisiones que eran de todos.",
  tolerancia: "La tolerancia: aguantas algo que ya sabes que no funciona.",
};

export function textoDispersante(cual: Dispersante): string {
  return DISPERSANTE_TEXTO[cual];
}

/* -------------------------------------------------------------------------- */
/* Utilidades internas                                                        */
/* -------------------------------------------------------------------------- */

/** Respuesta elegida para una pregunta, o undefined. */
function opcionDe(respuestas: Respuestas, idPregunta: string) {
  const elegida = respuestas[idPregunta];
  if (!elegida) return undefined;
  const pregunta = PREGUNTAS.find((p) => p.id === idPregunta);
  return pregunta?.opciones?.find((o) => o.id === elegida);
}

/** Puntos de una pregunta de opción (0 si no se respondió). */
function puntos(respuestas: Respuestas, idPregunta: string): number {
  return opcionDe(respuestas, idPregunta)?.puntos ?? 0;
}

/** Valor de perfilado activado por la opción elegida en una pregunta. */
function perfilDe(respuestas: Respuestas, idPregunta: string) {
  return opcionDe(respuestas, idPregunta)?.perfil ?? {};
}

function aCien(bruto: number, maximo: number): number {
  return Math.round((bruto / maximo) * 100);
}

/* -------------------------------------------------------------------------- */
/* Cálculo principal                                                          */
/* -------------------------------------------------------------------------- */

export function calcularPerfil(respuestas: Respuestas): Perfil {
  // --- Los tres verbos ---
  const generarRaw = puntos(respuestas, "Q4") + puntos(respuestas, "Q5");
  const multiplicarRaw = puntos(respuestas, "Q6") + puntos(respuestas, "Q7");
  const capturarRaw = puntos(respuestas, "Q8") + puntos(respuestas, "Q9");

  const scoreGenerar = aCien(generarRaw, 6);
  const scoreMultiplicar = aCien(multiplicarRaw, 6);
  const scoreCapturar = aCien(capturarRaw, 6);

  const indice = Math.round((scoreGenerar + scoreMultiplicar + scoreCapturar) / 3);
  const banda: Banda =
    indice <= 25
      ? "ciclo_roto"
      : indice <= 50
        ? "ciclo_en_vilo"
        : indice <= 75
          ? "ciclo_en_marcha"
          : "ciclo_gobernado";

  // --- Fuerzas dispersantes ---
  const desenfoque = puntos(respuestas, "Q10");
  const soledad = puntos(respuestas, "Q11");
  const tolerancia = puntos(respuestas, "Q12");
  const friccion = desenfoque + soledad + tolerancia;
  const friccionNorm = Math.round((friccion / 9) * 100);
  const concentracion = puntos(respuestas, "Q13");

  // --- Verbo crítico: el más bajo, con desempates ---
  const verbos: { clave: Verbo; score: number; minimoItem: number }[] = [
    {
      clave: "generar",
      score: scoreGenerar,
      minimoItem: Math.min(puntos(respuestas, "Q4"), puntos(respuestas, "Q5")),
    },
    {
      clave: "multiplicar",
      score: scoreMultiplicar,
      minimoItem: Math.min(puntos(respuestas, "Q6"), puntos(respuestas, "Q7")),
    },
    {
      clave: "capturar",
      score: scoreCapturar,
      minimoItem: Math.min(puntos(respuestas, "Q8"), puntos(respuestas, "Q9")),
    },
  ];

  const scoreMinimo = Math.min(...verbos.map((v) => v.score));
  const empatados = verbos.filter((v) => v.score === scoreMinimo);

  let verboCritico: Verbo;
  if (empatados.length === 1) {
    verboCritico = empatados[0].clave;
  } else {
    // Desempate 1: gana el verbo cuyo ítem más bajo sea menor.
    const minimoItemMenor = Math.min(...empatados.map((v) => v.minimoItem));
    const porItem = empatados.filter((v) => v.minimoItem === minimoItemMenor);
    // Desempate 2: orden causal del marco Generar → Multiplicar → Capturar.
    const orden: Verbo[] = ["generar", "multiplicar", "capturar"];
    verboCritico =
      porItem.length === 1
        ? porItem[0].clave
        : (orden.find((v) => porItem.some((p) => p.clave === v)) ?? "generar");
  }

  // --- Focos específicos: los ítems en mínimo dentro del verbo crítico ---
  const preguntasDelVerbo: Record<Verbo, string[]> = {
    generar: ["Q4", "Q5"],
    multiplicar: ["Q6", "Q7"],
    capturar: ["Q8", "Q9"],
  };
  const puntajesItems = preguntasDelVerbo[verboCritico].map((id) => ({
    id,
    valor: puntos(respuestas, id),
  }));
  const minimoDelVerbo = Math.min(...puntajesItems.map((p) => p.valor));
  const focos = puntajesItems
    .filter((p) => p.valor === minimoDelVerbo)
    .map((p) => {
      const pregunta = PREGUNTAS.find((q) => q.id === p.id);
      return {
        item: p.id,
        componente: pregunta?.componente ?? "",
        frase: pregunta?.fraseFoco ?? "",
      };
    });

  // --- Dispersante dominante ---
  let dispersanteDominante: Dispersante | null = null;
  if (friccion > 0) {
    const maximo = Math.max(desenfoque, soledad, tolerancia);
    const candidatos: Dispersante[] = [];
    if (soledad === maximo) candidatos.push("soledad");
    if (tolerancia === maximo) candidatos.push("tolerancia");
    if (desenfoque === maximo) candidatos.push("desenfoque");
    // El orden del arreglo ES la regla de producto: soledad → tolerancia → desenfoque.
    dispersanteDominante = candidatos[0] ?? null;
  }

  // --- Perfilado ---
  const p1 = perfilDe(respuestas, "Q1");
  const p2 = perfilDe(respuestas, "Q2");
  const p3 = perfilDe(respuestas, "Q3");
  const tamano = (p1.tamano ?? null) as Tamano | null;
  const etapa = (p2.etapa ?? null) as Etapa | null;
  const rol = (p3.rol ?? null) as Rol | null;
  const sucesion = Boolean(p2.sucesion);
  const sucesionReciente = Boolean(p2.sucesion_reciente);

  // --- Arquetipo: se evalúa en orden y gana el primero que cumple ---
  let arquetipo: Arquetipo;
  if (
    indice >= 76 &&
    friccion <= 3 &&
    (rol === "gobernador" || rol === "compartida") &&
    !sucesion
  ) {
    arquetipo = "gobernado";
  } else if (rol === "vacante") {
    arquetipo = "ausente";
  } else if (sucesion && !sucesionReciente) {
    arquetipo = "sucesion_pasando";
  } else if (sucesionReciente) {
    arquetipo = "recien_heredada";
  } else if (rol === "operador" && friccion >= 6) {
    arquetipo = "carga_todo";
  } else if (verboCritico === "capturar") {
    arquetipo = "sin_captura";
  } else if (verboCritico === "multiplicar") {
    arquetipo = "sin_multiplicar";
  } else {
    arquetipo = "sin_generar";
  }

  // --- Nivel de acompañamiento sugerido (routing, nunca filtro) ---
  let nivel: Nivel = "por_definir";
  if (tamano === "t3" || tamano === "t4") nivel = "consulting";
  else if (tamano === "t1" || tamano === "t2") nivel = "pce";
  if (sucesion) nivel = nivel === "por_definir" ? "master" : nivel;

  // --- Temperatura comercial ---
  const abandonoNoPensado = respuestas.__abandono_no_pensado === "true";
  const respuestaDiferida = respuestas.__respuesta_diferida === "true";
  let temperatura = 0;
  if (rol === "vacante") temperatura += 2;
  if (rol === "transicion") temperatura += 1;
  if (soledad >= 2) temperatura += 1;
  if (abandonoNoPensado) temperatura += 1;
  if (respuestaDiferida) temperatura += 1;
  if (concentracion <= 1) temperatura += 1;
  temperatura = Math.min(temperatura, 9);

  const temperaturaEtiqueta =
    temperatura <= 1 ? "frio" : temperatura <= 3 ? "tibio" : temperatura <= 5 ? "caliente" : "urgente";

  // --- Confianza ---
  const respondidas = PREGUNTAS.filter(
    (p) => respuestas[p.id] !== undefined && respuestas[p.id] !== "",
  ).length;
  const cobertura = respondidas / PREGUNTAS_NUCLEO;
  const confianza = cobertura >= 0.95 ? "alta" : cobertura >= 0.6 ? "media" : "baja";

  return {
    scoreGenerar,
    scoreMultiplicar,
    scoreCapturar,
    indice,
    banda,
    bandaTexto: BANDAS[banda],
    desenfoque,
    soledad,
    tolerancia,
    friccion,
    friccionNorm,
    concentracion,
    verboCritico,
    focos,
    dispersanteDominante,
    arquetipo,
    nivel,
    temperatura,
    temperaturaEtiqueta,
    tamano,
    etapa,
    rol,
    sucesion,
    sucesionReciente,
    abandonoNoPensado,
    respuestaDiferida,
    cobertura,
    confianza,
    version: VERSION_MOTOR,
  };
}

/** Etiquetas legibles del nivel de acompañamiento. */
export const ETIQUETA_NIVEL: Record<Nivel, string> = {
  consulting: "Consulting, con los socios de CEDEM",
  pce: "PCE · Concentración Estratégica",
  master: "Máster en Innovación y Emprendimiento en la Empresa Familiar",
  por_definir: "El nivel lo vemos juntos en la conversación",
};
