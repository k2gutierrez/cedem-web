/**
 * Camino del Dueño · Configuración del recorrido (versión cdd-1.0)
 *
 * Este archivo es la fuente de verdad del guion: textos, píldoras, preguntas y
 * los valores con los que se puntúa. Cambiar un peso o un texto es publicar una
 * versión nueva (`cdd-1.1`), nunca editar la vigente: las sesiones guardadas se
 * tienen que poder recalcular y comparar.
 *
 * Especificación completa en `docs/05-camino-del-dueno.md`.
 */

export const VERSION_MOTOR = "cdd-1.0";

/* -------------------------------------------------------------------------- */
/* Tipos                                                                      */
/* -------------------------------------------------------------------------- */

export type ClaveDimension =
  | "generar"
  | "multiplicar"
  | "capturar"
  | "desenfoque"
  | "soledad"
  | "tolerancia"
  | "concentracion";

export type Opcion = {
  id: string;
  texto: string;
  /** Valor numérico cuando la pregunta puntúa una dimensión 0-3. */
  puntos?: number;
  /** Marca de perfilado que activa la opción (tamaño, etapa, rol…). */
  perfil?: Partial<{
    tamano: Tamano;
    etapa: Etapa;
    rol: Rol;
    sucesion: boolean;
    sucesion_reciente: boolean;
  }>;
};

export type Tamano = "t1" | "t2" | "t3" | "t4" | "sin_dato";
export type Etapa = "e1" | "e2" | "e3" | "e4" | "e5" | "e6";
export type Rol = "operador" | "gobernador" | "compartida" | "vacante" | "transicion";

export type Pregunta = {
  id: string;
  /** Dimensión que puntúa. Las de perfilado no puntúan. */
  dimension?: ClaveDimension;
  tipo: "opcion" | "abierta";
  segmento: number;
  enunciado: string;
  ayuda?: string;
  kicker?: string;
  opciones?: Opcion[];
  /** Texto de salida cuando el dueño no quiere responder. */
  salida?: { texto: string; marca: string };
  placeholder?: string;
  chips?: string[];
  maximoCaracteres?: number;
  /** Componente del marco CEDEM que mide (se usa en la lectura). */
  componente?: string;
  fraseFoco?: string;
  pesoEnTiempo: number;
};

export type Pilora = {
  id: string;
  segmento: number;
  titulo: string;
  texto: string; // admite **negritas** simples
  pesoEnTiempo: number;
};

/* -------------------------------------------------------------------------- */
/* Segmentos                                                                  */
/* -------------------------------------------------------------------------- */

export const SEGMENTOS = [
  { n: 0, clave: "puerta", nombre: "La puerta" },
  { n: 1, clave: "retrato", nombre: "Tu retrato" },
  { n: 2, clave: "verbos", nombre: "Los tres verbos" },
  { n: 3, clave: "frenos", nombre: "Lo que te frena" },
  { n: 4, clave: "sobra", nombre: "Lo que sobra" },
  { n: 5, clave: "jugada", nombre: "Tu siguiente jugada" },
] as const;

/* -------------------------------------------------------------------------- */
/* Apertura                                                                   */
/* -------------------------------------------------------------------------- */

export const APERTURA = {
  kicker: "CEDEM · Centro de Dueñez Empresaria",
  titulo: "Tu empresa creció. ¿Y tú, como dueño?",
  cuerpo:
    "Cinco minutos. Quince preguntas. Ninguna sobre tu contabilidad. Al final te digo en qué verbo se te está atorando el valor, qué leer para tu caso exacto y qué hacer esta semana. Sin registro para empezar.",
  botonPrincipal: "Empezar (5 min)",
  botonExpress: "Voy con prisa (4 min)",
  pie: "Tus respuestas quedan guardadas en tu perfil de CEDEM. Puedes borrarlas cuando quieras.",
} as const;

/* -------------------------------------------------------------------------- */
/* Píldoras de concepto                                                       */
/* -------------------------------------------------------------------------- */

export const PILDORAS: Pilora[] = [
  {
    id: "P1",
    segmento: 2,
    titulo: "El valor se mueve en tres tiempos",
    texto:
      "Primero se **genera**: el cliente es la única fuente de valor. Luego se **multiplica**: no se multiplica el valor si no se multiplica el poder. Y al final se **captura**: la captura no es estar alineado, es estar siempre alineándose. Si uno de los tres se atora, los otros dos se desangran.",
    pesoEnTiempo: 11,
  },
  {
    id: "P2",
    segmento: 3,
    titulo: "Nadie se desenfoca de golpe",
    texto:
      "Hay tres fuerzas que se comen la Dueñez sin que te des cuenta. El **desenfoque**: muchas cosas a la vez. La **soledad**: cargar solo lo que era de todos. La **tolerancia**: aguantar lo que ya sabes que no funciona. No llegan de golpe. Se acumulan.",
    pesoEnTiempo: 11,
  },
  {
    id: "P3",
    segmento: 4,
    titulo: "Concentración estratégica: las tres decisiones incómodas",
    texto:
      "Tratar cada negocio **como si fuera el único**. Poner **los mejores recursos en las mejores oportunidades**. Y **abandonar** lo demás. Las dos primeras las firma cualquiera. La tercera es la que nadie quiere firmar, y es la que paga.",
    pesoEnTiempo: 12,
  },
  {
    id: "P4",
    segmento: 5,
    titulo: "Compartir la Dueñez no es repartir culpas",
    texto:
      "Cuando el dueño no ejerce, alguien ocupa ese espacio: casi siempre un directivo, casi nunca con el poder para decidir lo que importa. Compartir la Dueñez es que la decisión más importante no dependa de una sola cabeza. Y eso se diseña.",
    pesoEnTiempo: 11,
  },
];

/* -------------------------------------------------------------------------- */
/* Preguntas                                                                  */
/* -------------------------------------------------------------------------- */

export const PREGUNTAS: Pregunta[] = [
  /* --- S1 · Tu retrato ---------------------------------------------------- */
  {
    id: "Q1",
    tipo: "opcion",
    segmento: 1,
    enunciado: "¿Cuánto vendió tu empresa el año pasado?",
    ayuda: "Es para saber con quién trabajas, no para calificarte. En dólares o su equivalente.",
    pesoEnTiempo: 11,
    opciones: [
      { id: "opt_q1_a", texto: "Menos de 1 millón", perfil: { tamano: "t1" } },
      { id: "opt_q1_b", texto: "Entre 1 y 5 millones", perfil: { tamano: "t2" } },
      { id: "opt_q1_c", texto: "Entre 5 y 20 millones", perfil: { tamano: "t3" } },
      { id: "opt_q1_d", texto: "Más de 20 millones", perfil: { tamano: "t4" } },
      { id: "opt_q1_e", texto: "Prefiero no decirlo", perfil: { tamano: "sin_dato" } },
    ],
  },
  {
    id: "Q2",
    tipo: "opcion",
    segmento: 1,
    enunciado: "¿En qué momento está tu empresa hoy?",
    pesoEnTiempo: 12,
    opciones: [
      { id: "opt_q2_a", texto: "Arrancando: buscando los primeros clientes firmes", perfil: { etapa: "e1" } },
      { id: "opt_q2_b", texto: "Creciendo rápido y desordenándome", perfil: { etapa: "e2" } },
      { id: "opt_q2_c", texto: "Ya crecí, pero me estanqué", perfil: { etapa: "e3" } },
      {
        id: "opt_q2_d",
        texto: "Ordenada y profesional, con directivos que responden",
        perfil: { etapa: "e4" },
      },
      {
        id: "opt_q2_e",
        texto: "En transición: alguien de la siguiente generación viene entrando",
        perfil: { etapa: "e5", sucesion: true },
      },
      {
        id: "opt_q2_f",
        texto: "Acabo de recibir la estafeta: la empresa ya es mía (o casi)",
        perfil: { etapa: "e6", sucesion: true, sucesion_reciente: true },
      },
    ],
  },
  {
    id: "Q3",
    tipo: "opcion",
    segmento: 1,
    kicker:
      "Dirigir y ser dueño no son el mismo trabajo. Este es el trabajo del que nadie te habló.",
    enunciado: "Hoy, ¿quién decide lo que de verdad importa en tu empresa?",
    pesoEnTiempo: 12,
    opciones: [
      { id: "opt_q3_a", texto: "Yo, y casi todo pasa por mí", perfil: { rol: "operador" } },
      {
        id: "opt_q3_b",
        texto: "Yo decido, pero no me meto en la operación",
        perfil: { rol: "gobernador" },
      },
      {
        id: "opt_q3_c",
        texto: "Decidimos entre varios: socios, familia, consejo",
        perfil: { rol: "compartida" },
      },
      {
        id: "opt_q3_d",
        texto: "Los directivos deciden y yo me entero después",
        perfil: { rol: "vacante" },
      },
      {
        id: "opt_q3_e",
        texto: "Nadie claro: estamos en medio de un cambio",
        perfil: { rol: "transicion" },
      },
    ],
  },

  /* --- S2 · Los tres verbos ---------------------------------------------- */
  {
    id: "Q4",
    tipo: "opcion",
    segmento: 2,
    dimension: "generar",
    componente: "Fertilidad de mercados",
    fraseFoco: "de dónde va a venir el próximo cliente",
    kicker: "Empecemos por lo único que genera valor: el cliente.",
    enunciado: "¿De dónde te va a venir el próximo cliente?",
    pesoEnTiempo: 12,
    opciones: [
      { id: "opt_q4_a", texto: "De mis mismos clientes: les voy a vender más", puntos: 1 },
      { id: "opt_q4_b", texto: "De mercados o zonas que todavía no toco", puntos: 3 },
      { id: "opt_q4_c", texto: "De un producto o servicio que todavía no tengo", puntos: 2 },
      { id: "opt_q4_d", texto: "La verdad, no tengo claro de dónde", puntos: 0 },
    ],
  },
  {
    id: "Q5",
    tipo: "opcion",
    segmento: 2,
    dimension: "generar",
    componente: "Caminos de diferenciación y posicionamiento",
    fraseFoco: "por qué te compran a ti y no al de al lado",
    enunciado: "Si un cliente le explica a otro por qué te compra a ti, ¿qué dice?",
    pesoEnTiempo: 12,
    opciones: [
      { id: "opt_q5_a", texto: "Que soy más barato", puntos: 0 },
      { id: "opt_q5_b", texto: "Que me conoce y confía en mí", puntos: 1 },
      { id: "opt_q5_c", texto: "Que hago algo distinto y se nota", puntos: 3 },
      { id: "opt_q5_d", texto: "No sabría decirlo en una frase", puntos: 0 },
    ],
  },
  {
    id: "Q6",
    tipo: "opcion",
    segmento: 2,
    dimension: "multiplicar",
    componente: "Querencia",
    fraseFoco: "el proyecto común del equipo de dirección",
    kicker: "Aquí es donde la mayoría de los dueños se queda solo.",
    enunciado: "Tu equipo de dirección, ¿cómo se mueve?",
    pesoEnTiempo: 12,
    opciones: [
      { id: "opt_q6_a", texto: "Cada quien defiende su área", puntos: 0 },
      {
        id: "opt_q6_b",
        texto: "Trabajan bien, pero el proyecto común lo empujo yo",
        puntos: 1,
      },
      { id: "opt_q6_c", texto: "Hay un proyecto común y se nota en cómo deciden", puntos: 3 },
      { id: "opt_q6_d", texto: "No tengo equipo de dirección: estoy solo en esto", puntos: 0 },
    ],
  },
  {
    id: "Q7",
    tipo: "opcion",
    segmento: 2,
    dimension: "multiplicar",
    componente: "Fórmula de gobierno y fórmula de propiedad",
    fraseFoco: "las reglas escritas del poder y del patrimonio",
    enunciado: "Lo que va a pasar con la empresa y con el patrimonio, ¿está escrito?",
    pesoEnTiempo: 12,
    opciones: [
      { id: "opt_q7_a", texto: "Todo es acuerdo verbal", puntos: 0 },
      { id: "opt_q7_b", texto: "Hay algo por escrito, pero ya está viejo", puntos: 1 },
      {
        id: "opt_q7_c",
        texto: "Hay consejo y un plan de propiedad y sucesión que revisamos",
        puntos: 3,
      },
      { id: "opt_q7_d", texto: "No lo he pensado", puntos: 0 },
    ],
  },
  {
    id: "Q8",
    tipo: "opcion",
    segmento: 2,
    dimension: "capturar",
    componente: "Alineación de la organización",
    fraseFoco: "las prioridades convertidas en agenda y metas",
    kicker: "La captura no es estar alineado. Es estar siempre alineándose.",
    enunciado: "Tus prioridades de este año, ¿se ven en la agenda de tu gente?",
    pesoEnTiempo: 12,
    opciones: [
      { id: "opt_q8_a", texto: "Mi gente vive en lo urgente, no en las prioridades", puntos: 0 },
      { id: "opt_q8_b", texto: "Les dije las prioridades, pero nada cambió", puntos: 1 },
      { id: "opt_q8_c", texto: "Cada área tiene metas amarradas a esas prioridades", puntos: 3 },
      { id: "opt_q8_d", texto: "No tengo prioridades escritas este año", puntos: 0 },
    ],
  },
  {
    id: "Q9",
    tipo: "opcion",
    segmento: 2,
    dimension: "capturar",
    componente: "Alineación de los recursos y de la información",
    fraseFoco: "los pocos números que sí mueven el negocio",
    enunciado: "Cuando quieres saber cómo va el negocio de verdad, ¿qué haces?",
    pesoEnTiempo: 12,
    opciones: [
      {
        id: "opt_q9_a",
        texto: "Pido reportes y cada quien me trae números distintos",
        puntos: 0,
      },
      { id: "opt_q9_b", texto: "Veo los números, pero son del mes pasado", puntos: 1 },
      {
        id: "opt_q9_c",
        texto: "Tengo un tablero con pocos números que sí mueven el negocio",
        puntos: 3,
      },
      { id: "opt_q9_d", texto: "Me guío por lo que veo en el piso y por la caja", puntos: 0 },
    ],
  },

  /* --- S3 · Lo que te frena ---------------------------------------------- */
  {
    id: "Q10",
    tipo: "opcion",
    segmento: 3,
    dimension: "desenfoque",
    componente: "Desenfoque",
    fraseFoco: "cuántas cosas traes a la vez",
    enunciado: "¿Cuántas cosas distintas traes al mismo tiempo?",
    pesoEnTiempo: 12,
    opciones: [
      { id: "opt_q10_a", texto: "Una o dos, y las demás esperan", puntos: 0 },
      { id: "opt_q10_b", texto: "Tres o cuatro, y las llevo", puntos: 1 },
      { id: "opt_q10_c", texto: "Muchas, y voy apagando fuegos", puntos: 2 },
      { id: "opt_q10_d", texto: "Demasiadas, ya no alcanzo", puntos: 3 },
    ],
  },
  {
    id: "Q11",
    tipo: "opcion",
    segmento: 3,
    dimension: "soledad",
    componente: "Soledad",
    fraseFoco: "con quién piensas la decisión grande",
    enunciado: "Cuando tienes que tomar la decisión más importante del año…",
    pesoEnTiempo: 12,
    opciones: [
      { id: "opt_q11_a", texto: "La pienso con alguien de confianza y decido", puntos: 0 },
      {
        id: "opt_q11_b",
        texto: "La consulto con mi equipo, aunque la decisión es mía",
        puntos: 1,
      },
      { id: "opt_q11_c", texto: "La pienso solo, le doy vueltas", puntos: 2 },
      {
        id: "opt_q11_d",
        texto: "La dejo para después porque no tengo con quién pensarla",
        puntos: 3,
      },
    ],
  },
  {
    id: "Q12",
    tipo: "opcion",
    segmento: 3,
    dimension: "tolerancia",
    componente: "Tolerancia",
    fraseFoco: "eso que aguantas desde hace más de un año",
    enunciado: "Eso que ya sabes que no funciona en tu empresa…",
    pesoEnTiempo: 12,
    opciones: [
      { id: "opt_q12_a", texto: "Ya lo estoy resolviendo, con fecha", puntos: 0 },
      { id: "opt_q12_b", texto: "Lo tengo bien identificado, pero no he hecho nada", puntos: 2 },
      { id: "opt_q12_c", texto: "Llevo más de un año aguantándolo", puntos: 3 },
      { id: "opt_q12_d", texto: "No tengo claro qué es lo que no funciona", puntos: 1 },
    ],
  },

  /* --- S4 · Lo que sobra -------------------------------------------------- */
  {
    id: "Q13",
    tipo: "opcion",
    segmento: 4,
    dimension: "concentracion",
    componente: "Concentración estratégica",
    fraseFoco: "los mejores recursos en las mejores oportunidades",
    kicker: "Esta es la pregunta más incómoda del recorrido.",
    enunciado:
      "Si tuvieras que poner tus mejores recursos —tu mejor gente, tu dinero, tu tiempo— en una sola oportunidad…",
    pesoEnTiempo: 12,
    opciones: [
      { id: "opt_q13_a", texto: "Ya sé cuál es y ya lo estoy haciendo", puntos: 3 },
      { id: "opt_q13_b", texto: "Sé cuál es, pero no lo he hecho", puntos: 2 },
      { id: "opt_q13_c", texto: "Tengo dos o tres y no me decido", puntos: 1 },
      { id: "opt_q13_d", texto: "No tengo una oportunidad así identificada", puntos: 0 },
    ],
  },
  {
    id: "Q14",
    tipo: "abierta",
    segmento: 4,
    enunciado:
      "Piensa en algo que hoy le quita tiempo, dinero o foco a tu empresa. ¿Qué pasaría si lo abandonaras? Escríbelo en una frase.",
    placeholder: "Si dejara de hacer ______, pasaría ______",
    chips: [
      "Nadie lo notaría",
      "Liberaría a mi mejor gente",
      "Vendería menos, pero…",
      "Me dolería soltarlo",
      "No lo había pensado así",
    ],
    salida: { texto: "No lo tengo claro todavía", marca: "abandono_no_pensado" },
    maximoCaracteres: 240,
    pesoEnTiempo: 24,
  },

  /* --- S5 · Tu siguiente jugada ------------------------------------------ */
  {
    id: "Q15",
    tipo: "abierta",
    segmento: 5,
    kicker: "Última. Esta me la quedo yo.",
    enunciado: "En una frase: ¿qué es lo que más te está costando hoy como dueño?",
    placeholder: "Lo que más me cuesta es ______",
    chips: [
      "Crecer sin perder el control",
      "Soltar y confiar",
      "Profesionalizar sin perder la esencia",
      "Decidir qué abandono",
      "Que el negocio no dependa de mí",
    ],
    salida: { texto: "Prefiero contarlo después", marca: "respuesta_diferida" },
    maximoCaracteres: 240,
    pesoEnTiempo: 22,
  },
];

/** Orden de pantallas del recorrido, tal como se muestra. */
export type Pantalla =
  | { tipo: "apertura" }
  | { tipo: "pildora"; id: string }
  | { tipo: "pregunta"; id: string }
  | { tipo: "captura" }
  | { tipo: "resultado" };

export const RECORRIDO: Pantalla[] = [
  { tipo: "apertura" },
  // S1
  { tipo: "pregunta", id: "Q1" },
  { tipo: "pregunta", id: "Q2" },
  { tipo: "pregunta", id: "Q3" },
  // S2
  { tipo: "pildora", id: "P1" },
  { tipo: "pregunta", id: "Q4" },
  { tipo: "pregunta", id: "Q5" },
  { tipo: "pregunta", id: "Q6" },
  { tipo: "pregunta", id: "Q7" },
  { tipo: "pregunta", id: "Q8" },
  { tipo: "pregunta", id: "Q9" },
  // S3
  { tipo: "pildora", id: "P2" },
  { tipo: "pregunta", id: "Q10" },
  { tipo: "pregunta", id: "Q11" },
  { tipo: "pregunta", id: "Q12" },
  // S4
  { tipo: "pildora", id: "P3" },
  { tipo: "pregunta", id: "Q13" },
  { tipo: "pregunta", id: "Q14" },
  // S5
  { tipo: "pildora", id: "P4" },
  { tipo: "pregunta", id: "Q15" },
  { tipo: "captura" },
  { tipo: "resultado" },
];

export const TOTAL_PANTALLAS = RECORRIDO.length;

/** Textos de espera del revelado (nunca "cargando…"). */
export const TEXTOS_ESPERA = [
  "Estoy cruzando tus respuestas con 40 años de casos…",
  "Buscando lo que ya escribió CEDEM sobre tu caso…",
  "Eligiendo tres cosas para que hagas esta semana…",
];

/** Preguntas que puntúan el perfil (las 15 núcleo). */
export const PREGUNTAS_NUCLEO = PREGUNTAS.length;
