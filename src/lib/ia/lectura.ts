import { z } from "zod";
import { articulosPara, EJERCICIOS_BASE, ETIQUETAS_BASE } from "@/content/camino/catalogo";
import { TITULARES, textoDispersante, type Perfil, type Respuestas } from "@/lib/camino/puntuar";
import { iaConfigurada, llamarIA, type Mensaje } from "@/lib/ia/deepseek";

/**
 * La observación personalizada del Camino del Dueño.
 *
 * REPARTO DE RESPONSABILIDADES (esto es lo importante de este archivo):
 *
 *   · El MOTOR decide: el verbo crítico, el arquetipo, la banda, el nivel de
 *     acompañamiento y la temperatura. Nada de eso lo toca la IA.
 *   · La IA redacta: la frase de espejo, la observación y los tres ejercicios.
 *   · Si la IA falla, tarda o responde algo inválido, se devuelve la **lectura
 *     base** ya calculada. El dueño nunca se queda sin resultado.
 *
 * POR QUÉ SE LLAMA "OBSERVACIÓN" Y NO "DIAGNÓSTICO"
 *
 * Decisión de Carlos: el entregable no puede ser una etiqueta ni un verbo de la
 * dolencia. Nadie contrata a un consultor para que le ponga un nombre a su tipo;
 * lo contrata para que mire su empresa y le diga lo que ve. Así que el motor
 * calcula por dentro (y sigue decidiendo artículos y ejercicios), pero lo que el
 * dueño lee es lo que escribiría un consultor de CEDEM después de una primera
 * conversación: qué observó, en qué se apoya y por dónde empezaría.
 */

export const LecturaEsquema = z.object({
  /** La frase de espejo que abre la observación. Sin el nombre del dueño. */
  titular: z.string().min(10).max(160),
  /** Dos o tres párrafos cortos, en voz de consultor. */
  observacion: z.array(z.string().min(40).max(700)).min(2).max(3),
  ejercicios: z
    .array(
      z.object({
        titulo: z.string().min(4).max(90),
        detalle: z.string().min(20).max(300),
      }),
    )
    .min(3)
    .max(3),
  /** Títulos exactos, elegidos entre los candidatos enviados. */
  articulos: z.array(z.string()).max(3).optional(),
});

export type Lectura = z.infer<typeof LecturaEsquema> & {
  origen: "ia" | "base";
  modelo?: string;
};

/** Forma anterior (subtitulo + verbo + freno). Se sigue leyendo lo ya guardado. */
const EsquemaAnterior = z.object({
  subtitulo: z.string(),
  verbo: z.string(),
  freno: z.string(),
  ejercicios: LecturaEsquema.shape.ejercicios,
  articulos: z.array(z.string()).max(3).optional(),
});

/* -------------------------------------------------------------------------- */
/* Lectura base: la red de seguridad                                          */
/* -------------------------------------------------------------------------- */

export function lecturaBase(perfil: Perfil): Lectura {
  const verboLegible =
    perfil.verboCritico === "generar"
      ? "generar"
      : perfil.verboCritico === "multiplicar"
        ? "multiplicar"
        : "capturar";

  /* Los componentes flojos, separados por comas. Con «y» entre todos quedaba
     «fertilidad de mercados y caminos de diferenciación y posicionamiento»,
     porque el nombre de un componente ya trae su propio «y». */
  const focos = perfil.focos.map((f) => f.componente).filter(Boolean);
  const listaFocos = focos.join(", ").toLowerCase();

  const observacion = [
    `Con lo que nos contestaste, el valor se está quedando en el eslabón de ${verboLegible}. ${
      focos.length > 1 ? "Los puntos más flojos son" : "El punto más flojo es"
    } ${listaFocos || verboLegible}: ${
      perfil.focos[0]?.frase ?? "es donde se te está escapando el valor"
    }. No es falta de esfuerzo: es que ese eslabón no tiene un responsable con nombre.`,
  ];

  observacion.push(
    perfil.dispersanteDominante
      ? `${textoDispersante(perfil.dispersanteDominante)} Es la fuerza que más rápido se mueve cuando alguien piensa contigo lo que hoy piensas solo. Por eso el primer movimiento no es un plan: es una conversación de treinta minutos sobre ese punto.`
      : "Hoy no traes ninguna de las tres fuerzas dispersantes activas: ni desenfoque, ni soledad, ni tolerancia. Eso no es suerte, es gobierno. El siguiente movimiento ya no es apagar fuegos: es decidir qué sigue y con qué órgano de gobierno se decide.",
  );

  return {
    origen: "base",
    titular: TITULARES[perfil.arquetipo],
    observacion,
    ejercicios: (EJERCICIOS_BASE[perfil.arquetipo] ?? []).slice(0, 3),
  };
}

/**
 * Convierte lo que haya en la base (o lo que devuelva la IA) a la forma actual.
 * Se acepta la forma anterior para no invalidar las lecturas ya guardadas: una
 * sesión de antes de este cambio seguiría mostrándose completa.
 */
export function normalizarLectura(crudo: unknown, perfil: Perfil): Lectura {
  const nueva = LecturaEsquema.safeParse(crudo);
  if (nueva.success) {
    const guardado = crudo as { origen?: unknown; modelo?: unknown };
    return {
      ...nueva.data,
      origen: guardado.origen === "ia" ? "ia" : "base",
      modelo: typeof guardado.modelo === "string" ? guardado.modelo : undefined,
    };
  }

  const anterior = EsquemaAnterior.safeParse(crudo);
  if (anterior.success) {
    return {
      origen: "base",
      titular: anterior.data.subtitulo,
      observacion: [anterior.data.verbo, anterior.data.freno],
      ejercicios: anterior.data.ejercicios,
      articulos: anterior.data.articulos,
    };
  }

  return lecturaBase(perfil);
}

/* -------------------------------------------------------------------------- */
/* Prompts                                                                    */
/* -------------------------------------------------------------------------- */

const SISTEMA = `Eres consultor de CEDEM, la firma mexicana que desde 1985 forma y acompaña a dueños de empresa. La firma la preside Carlos A. Dumois Núñez. Escribes la observación que se le deja a un dueño al terminar un diagnóstico de cinco minutos.

CÓMO ESCRIBES
- Como un consultor con oficio y no como un sistema de diagnóstico: describes lo que ves en su empresa, no le pones etiqueta a la persona.
- PROHIBIDO decirle que es de un tipo, que tiene un perfil, un arquetipo o "un verbo atorado"; prohibido hablarle de puntajes, bandas o del motor. Nada de "tu verbo crítico es multiplicar".
- Español de México, de tú, directo, sin florituras. Tratas al dueño como un par, no como un paciente.
- Frases cortas. Cero jerga vacía: prohibidas "apalancar", "core business", "best practices", "disrupción", "optimizar recursos humanos".
- Usas el vocabulario propio de CEDEM cuando toca: Dueñez, generar/multiplicar/capturar valor, querencia, fórmula de gobierno, fórmula de propiedad, concentración estratégica, abandonar, fuerzas dispersantes.
- NO prometes resultados. Nada de "vas a duplicar tus ventas" ni "garantizamos".
- NO das consejos legales, fiscales, médicos ni de inversión.
- NO inventas datos del dueño que no estén en lo que se te dio.
- Nada de emojis.

LO QUE RECIBES SON TUS NOTAS, NO EL TEXTO
El motor de CEDEM ya calculó dónde está el punto débil y qué fuerzas lo frenan. Eso es material de trabajo para ti: te dice dónde mirar. No lo repitas como resultado ni lo contradigas; tradúcelo a observaciones concretas sobre su empresa.`;

function promptUsuario(
  perfil: Perfil,
  respuestas: Respuestas,
  comentario: string,
  candidatos: { titulo: string; etiquetas: string[] }[],
): string {
  const verboLegible =
    perfil.verboCritico === "generar"
      ? "Generar"
      : perfil.verboCritico === "multiplicar"
        ? "Multiplicar"
        : "Capturar";

  return `NOTAS DEL MOTOR (para ti, no para el dueño)

- Dónde se está quedando el valor: ${verboLegible}
- Punto más flojo: ${perfil.focos.map((f) => `${f.componente} (${f.frase})`).join("; ") || "no identificado"}
- Fuerza que lo frena: ${perfil.dispersanteDominante ?? "ninguna activa"}
- Fricción interna: desenfoque ${perfil.desenfoque}/3, soledad ${perfil.soledad}/3, tolerancia ${perfil.tolerancia}/3
- Concentración estratégica: ${perfil.concentracion}/3
- Tamaño: ${perfil.tamano ?? "no declarado"} · Etapa: ${perfil.etapa ?? "no declarada"} · Rol ejercido: ${perfil.rol ?? "no declarado"}
- En sucesión: ${perfil.sucesion ? (perfil.sucesionReciente ? "acaba de recibir la empresa" : "está en proceso de entrega") : "no"}
- Nivel de acompañamiento que le corresponde: ${perfil.nivel}

LO QUE ÉL MISMO ESCRIBIÓ (úsalo, es lo más valioso que tienes)

- Qué pasaría si abandonara algo que le quita foco: "${respuestas.Q14 ?? "(no respondió)"}"
- Qué es lo que más le está costando como dueño: "${respuestas.Q15 ?? "(no respondió)"}"
- Comentario libre: "${comentario || "(ninguno)"}"

ARTÍCULOS DISPONIBLES DEL ARCHIVO DE CEDEM

${candidatos.map((a, i) => `${i + 1}. "${a.titulo}" — toca: ${a.etiquetas.join(", ")}`).join("\n")}

QUÉ TIENES QUE DEVOLVER

Un JSON con esta forma exacta:

{
  "titular": "una frase de espejo, máximo 18 palabras, que le diga al dueño que entendiste su caso. Sin su nombre y sin etiquetas.",
  "observacion": [
    "primer párrafo: qué observas en su empresa y en qué te apoyas. Entre 40 y 90 palabras.",
    "segundo párrafo: qué lo está frenando y qué consecuencia tiene. Entre 40 y 90 palabras.",
    "tercer párrafo (opcional): por dónde empezaría CEDEM y qué se lleva él de esta observación. Entre 30 y 70 palabras."
  ],
  "ejercicios": [
    { "titulo": "imperativo corto y concreto, máximo 12 palabras", "detalle": "una o dos frases que expliquen cómo hacerlo en su caso. Entre 15 y 45 palabras." },
    { "titulo": "...", "detalle": "..." },
    { "titulo": "...", "detalle": "..." }
  ],
  "articulos": ["título exacto de uno de los artículos de la lista"]
}

REGLAS DE LA OBSERVACIÓN
- Se lee como algo que un consultor escribió después de escucharlo, no como un informe: nada de viñetas, nada de "conclusión", nada de títulos internos.
- Cada afirmación se apoya en algo que él contestó o escribió. Nada de generalidades que le queden a cualquiera.
- No lo felicitas por deporte ni lo regañas: describes.

REGLAS DE LOS EJERCICIOS
- Tres, y que se puedan hacer ESTA SEMANA sin presupuesto ni permiso de nadie.
- Que se noten en su negocio, no que sean reflexiones.
- Prohibido "define tus objetivos", "haz un análisis FODA" y genéricos por el estilo.

Escribe en el tono de CEDEM: alguien que ha visto este caso cien veces y te lo dice de frente.`;
}

/* -------------------------------------------------------------------------- */
/* Generación                                                                 */
/* -------------------------------------------------------------------------- */

export async function generarLectura(
  perfil: Perfil,
  respuestas: Respuestas,
  comentario: string,
): Promise<Lectura> {
  const base = lecturaBase(perfil);

  if (!iaConfigurada()) return base;

  // Pre-filtro: nunca se le pasan los 186 artículos, solo los candidatos que
  // encajan con el arquetipo (ver docs/05-camino-del-dueno.md, §6.6).
  const candidatos = articulosPara(ETIQUETAS_BASE[perfil.arquetipo] ?? [], 8);

  const mensajes: Mensaje[] = [
    { role: "system", content: SISTEMA },
    {
      role: "user",
      content: promptUsuario(
        perfil,
        respuestas,
        comentario,
        candidatos.map((a) => ({ titulo: a.titulo, etiquetas: a.etiquetas })),
      ),
    },
  ];

  const respuesta = await llamarIA({ mensajes, json: true, maxTokens: 1600 });
  if (!respuesta.ok) {
    console.error("[ia] la observación no se pudo generar:", respuesta.error);
    return base;
  }

  try {
    const crudo = JSON.parse(respuesta.texto);
    const validada = LecturaEsquema.parse(crudo);
    return { ...validada, origen: "ia", modelo: respuesta.modelo };
  } catch (error) {
    // Si el modelo devuelve algo que no encaja, se prefiere la lectura base
    // antes que mostrarle al dueño un texto a medias.
    console.error("[ia] la observación no pasó la validación:", String(error).slice(0, 200));
    return base;
  }
}
