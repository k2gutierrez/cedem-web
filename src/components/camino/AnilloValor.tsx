"use client";

/**
 * El Anillo de Valor.
 *
 * Es el mismo objeto durante todo el recorrido: primero mide el avance y al
 * final muestra los tres verbos, cada uno con su color de la paleta de marca y
 * el más débil resaltado. Que sea el mismo objeto evita que el progreso sea un
 * adorno decorativo.
 */

const RADIO = 54;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const TERCIO = CIRCUNFERENCIA / 3;
/** Separación visual entre arcos, en unidades de circunferencia. */
const HUECO = 6;

type ClaveVerbo = "generar" | "multiplicar" | "capturar";

/** Un color de la paleta por verbo: navy, azul medio y cian. */
const TRAZO: Record<ClaveVerbo, string> = {
  generar: "stroke-navy dark:stroke-sky",
  multiplicar: "stroke-blue dark:stroke-sky/75",
  capturar: "stroke-cyan dark:stroke-sky/50",
};

const PUNTO: Record<ClaveVerbo, string> = {
  generar: "bg-navy dark:bg-sky",
  multiplicar: "bg-blue dark:bg-sky/75",
  capturar: "bg-cyan dark:bg-sky/50",
};

type Props = {
  /** Avance del recorrido, 0 a 1. Se ignora si se pasan los puntajes. */
  progreso: number;
  /** Puntajes por verbo (0-100) cuando ya hay resultado. */
  scores?: { generar: number; multiplicar: number; capturar: number };
  /** Verbo más débil, para resaltarlo. */
  verboDebil?: ClaveVerbo;
  tamano?: number;
  etiqueta?: string;
};

export function AnilloValor({
  progreso,
  scores,
  verboDebil,
  tamano = 190,
  etiqueta,
}: Props) {
  const hayResultado = Boolean(scores);

  const arcos = scores
    ? ([
        { clave: "generar", valor: scores.generar, inicio: 0 },
        { clave: "multiplicar", valor: scores.multiplicar, inicio: 1 },
        { clave: "capturar", valor: scores.capturar, inicio: 2 },
      ] as const)
    : null;

  const avance = Math.max(0, Math.min(1, progreso));

  return (
    <div className="relative inline-grid place-items-center">
      <svg
        width={tamano}
        height={tamano}
        viewBox="0 0 140 140"
        role="img"
        aria-label={
          hayResultado
            ? `Anillo de valor. Generar ${scores!.generar}, multiplicar ${scores!.multiplicar}, capturar ${scores!.capturar}. El más débil es ${verboDebil}.`
            : `Avance del recorrido: ${Math.round(avance * 100)} por ciento`
        }
      >
        {arcos ? (
          <>
            {/* Pista segmentada: los mismos tres arcos en gris, para que el
                anillo se lea como tres partes y no como un círculo continuo. */}
            {arcos.map((arco) => (
              <circle
                key={`pista-${arco.clave}`}
                cx="70"
                cy="70"
                r={RADIO}
                fill="none"
                stroke="currentColor"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${TERCIO - HUECO} ${CIRCUNFERENCIA}`}
                transform={`rotate(${-90 + arco.inicio * 120} 70 70)`}
                className="text-border"
              />
            ))}
            {arcos.map((arco) => {
              const recorrido = (arco.valor / 100) * (TERCIO - HUECO);
              if (recorrido <= 0) return null;
              const esDebil = verboDebil === arco.clave;
              return (
                <circle
                  key={arco.clave}
                  cx="70"
                  cy="70"
                  r={RADIO}
                  fill="none"
                  strokeWidth={esDebil ? 12 : 9}
                  strokeLinecap="round"
                  strokeDasharray={`${recorrido} ${CIRCUNFERENCIA}`}
                  transform={`rotate(${-90 + arco.inicio * 120} 70 70)`}
                  className={`${TRAZO[arco.clave]} transition-[stroke-dasharray] duration-700`}
                />
              );
            })}
          </>
        ) : (
          <>
            <circle
              cx="70"
              cy="70"
              r={RADIO}
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              className="text-border"
            />
            <circle
              cx="70"
              cy="70"
              r={RADIO}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${avance * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
              transform="rotate(-90 70 70)"
              className="stroke-cyan transition-[stroke-dasharray] duration-500 dark:stroke-sky"
            />
          </>
        )}
      </svg>

      <div className="absolute grid place-items-center text-center">
        {hayResultado && arcos ? (
          <div className="grid gap-1">
            {arcos.map((arco) => (
              <div key={arco.clave} className="flex items-center gap-2 text-left">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 shrink-0 rounded-full ${PUNTO[arco.clave]} ${
                    verboDebil === arco.clave ? "ring-2 ring-cyan/40 dark:ring-sky/40" : ""
                  }`}
                />
                <span className="font-display text-xs font-semibold uppercase tracking-wider text-fg-muted">
                  {arco.clave}
                </span>
                <span
                  className={`font-display text-sm ${
                    verboDebil === arco.clave ? "font-bold text-cyan dark:text-sky" : "font-bold text-fg"
                  }`}
                >
                  {arco.valor}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <span className="font-display text-3xl font-bold text-fg">
              {Math.round(avance * 100)}%
            </span>
            {etiqueta ? (
              <span className="mt-1 block text-xs uppercase tracking-wider text-fg-subtle">
                {etiqueta}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
