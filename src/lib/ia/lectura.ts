import { z } from "zod";
import { articulosPara, EJERCICIOS_BASE, ETIQUETAS_BASE } from "@/content/camino/catalogo";
import { TITULARES, textoDispersante, type Perfil, type Respuestas } from "@/lib/camino/puntuar";
import { iaConfigurada, llamarIA, type Mensaje } from "@/lib/ia/deepseek";

/**
 * La lectura personalizada del Camino del Dueño.
 *
 * REPARTO DE RESPONSABILIDADES (esto es lo importante de este archivo):
 *
 *   · El MOTOR decide: el verbo crítico, el arquetipo, la banda, el nivel de
 *     acompañamiento y la temperatura. Nada de eso lo toca la IA.
 *   · La IA redacta: el subtítulo personalizado, la lectura del verbo y del
 *     freno, y reescribe los tres ejercicios con el contexto del dueño.
 *   · Si la IA falla, tarda o responde algo inválido, se devuelve la **lectura
 *     base** ya calculada. El dueño nunca se queda sin resultado.
 */

export const LecturaEsquema = z.object({
  subtitulo: z.string().min(10).max(180),
  verbo: z.string().min(40).max(700),
  freno: z.string().min(40).max(700),
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

  const focos = perfil.focos.map((f) => f.componente).filter(Boolean);
  const detalleFocos =
    focos.length > 1 ? `${focos[0]} y ${focos[1]}` : (focos[0] ?? verboLegible);

  return {
    origen: "base",
    subtitulo: TITULARES[perfil.arquetipo],
    verbo: `El valor se mueve en tres tiempos: se genera, se multiplica y se captura. En tu caso lo que se está quedando corto es ${verboLegible}. Lo que lo explica es ${detalleFocos.toLowerCase()}: ${
      perfil.focos[0]?.frase ?? "es donde se te está escapando el valor"
    }.`,
    freno: perfil.dispersanteDominante
      ? `${textoDispersante(perfil.dispersanteDominante)} Es la fuerza que más rápido se mueve cuando alguien piensa contigo lo que hoy piensas solo.`
      : "Hoy no traes ninguna de las tres fuerzas dispersantes activas: ni desenfoque, ni soledad, ni tolerancia. Eso no es suerte, es gobierno.",
    ejercicios: (EJERCICIOS_BASE[perfil.arquetipo] ?? []).slice(0, 3),
  };
}

/* -------------------------------------------------------------------------- */
/* Prompts                                                                    */
/* -------------------------------------------------------------------------- */

const SISTEMA = `Eres el redactor de CEDEM, una firma mexicana que desde 1985 forma y acompaña a dueños de empresa. Escribes la "lectura" que recibe un dueño al terminar un diagnóstico de cinco minutos.

CÓMO ESCRIBES
- Español de México, de tú, directo, sin florituras. Tratas al dueño como un par, no como un paciente.
- Frases cortas. Cero jerga de consultoría vacía: prohibidas "sinergia" (salvo como concepto CEDEM), "apalancar", "core business", "best practices", "disrupción", "optimizar recursos humanos".
- Usas el vocabulario propio de CEDEM cuando toca: Dueñez, generar/multiplicar/capturar valor, querencia, fórmula de gobierno, fórmula de propiedad, concentración estratégica, abandonar, fuerzas dispersantes.
- NO prometes resultados. Nada de "vas a duplicar tus ventas" ni "garantizamos".
- NO das consejos legales, fiscales, médicos ni de inversión.
- NO inventas datos del dueño que no estén en lo que se te dio.
- Nada de emojis.

LO QUE RECIBES YA ESTÁ DECIDIDO
El verbo más débil, el arquetipo del dueño y su nivel de acompañamiento ya los calculó el motor de CEDEM. Tú NO los cambias ni los contradices: los explicas con sus palabras.`;

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

  return `DATOS DEL DUEÑO (calculados por el motor, no los cambies)

- Arquetipo: ${perfil.arquetipo}
- Titular que ya se le muestra: ${TITULARES[perfil.arquetipo]}
- Verbo más débil: ${verboLegible}
- Banda del ciclo de valor: ${perfil.banda} — ${perfil.bandaTexto}
- Componentes flojos: ${perfil.focos.map((f) => `${f.componente} (${f.frase})`).join("; ") || "no identificados"}
- Fuerza que lo frena: ${perfil.dispersanteDominante ?? "ninguna activa"}
- Fricción: desenfoque ${perfil.desenfoque}/3, soledad ${perfil.soledad}/3, tolerancia ${perfil.tolerancia}/3
- Concentración estratégica: ${perfil.concentracion}/3
- Tamaño: ${perfil.tamano ?? "no declarado"} · Etapa: ${perfil.etapa ?? "no declarada"} · Rol ejercido: ${perfil.rol ?? "no declarado"}
- En sucesión: ${perfil.sucesion ? (perfil.sucesionReciente ? "acaba de recibir la empresa" : "está en proceso de entrega") : "no"}
- Nivel de acompañamiento sugerido: ${perfil.nivel}
- Temperatura comercial (apertura, no valor de cuenta): ${perfil.temperaturaEtiqueta}

LO QUE ÉL MISMO ESCRIBIÓ (úsalo, es lo más valioso que tienes)

- Qué pasaría si abandonara algo que le quita foco: "${respuestas.Q14 ?? "(no respondió)"}"
- Qué es lo que más le está costando como dueño: "${respuestas.Q15 ?? "(no respondió)"}"
- Comentario libre: "${comentario || "(ninguno)"}"

ARTÍCULOS DISPONIBLES DEL ARCHIVO DE CEDEM

${candidatos.map((a, i) => `${i + 1}. "${a.titulo}" — toca: ${a.etiquetas.join(", ")}`).join("\n")}

QUÉ TIENES QUE DEVOLVER

Un JSON con esta forma exacta:

{
  "subtitulo": "una frase de espejo, máximo 25 palabras, que le diga al dueño que entendiste su caso. Sin su nombre.",
  "verbo": "dos o tres frases sobre su verbo más débil: qué significa en su caso concreto y qué consecuencia tiene. Entre 40 y 90 palabras.",
  "freno": "dos o tres frases sobre la fuerza que lo está frenando. Entre 40 y 90 palabras.",
  "ejercicios": [
    { "titulo": "imperativo corto y concreto, máximo 12 palabras", "detalle": "una o dos frases que expliquen cómo hacerlo en su caso. Entre 15 y 45 palabras." },
    { "titulo": "...", "detalle": "..." },
    { "titulo": "...", "detalle": "..." }
  ],
  "articulos": ["título exacto de uno de los artículos de la lista"]
}

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
    console.error("[ia] la lectura no se pudo generar:", respuesta.error);
    return base;
  }

  try {
    const crudo = JSON.parse(respuesta.texto);
    const validada = LecturaEsquema.parse(crudo);
    return { ...validada, origen: "ia", modelo: respuesta.modelo };
  } catch (error) {
    // Si el modelo devuelve algo que no encaja, se prefiere la lectura base
    // antes que mostrarle al dueño un texto a medias.
    console.error("[ia] la lectura no pasó la validación:", String(error).slice(0, 200));
    return base;
  }
}
