/**
 * El ciclo del valor, dibujado.
 *
 * POR QUÉ UN GRÁFICO Y NO TRES PÁRRAFOS
 *
 * Generar → multiplicar → capturar es un ciclo, no una lista, y el punto del
 * método es que el valor se escapa por el eslabón más débil. Eso se entiende de un
 * vistazo en un diagrama y no se entiende leyendo.
 *
 * Es SVG y no una imagen generada a propósito: pesa unos kilobytes, se ve nítido
 * en cualquier pantalla, hereda los colores de la marca y se puede traducir o
 * cambiar sin volver a exportar nada.
 *
 * Va sobre el navy del bloque del método, así que usa blanco, celeste y cian.
 */

const NODOS = [
  {
    n: "01",
    verbo: "Generar",
    detalle: "En el mercado",
    x: 210,
    y: 74,
  },
  {
    n: "02",
    verbo: "Multiplicar",
    detalle: "En la organización",
    x: 82,
    y: 268,
  },
  {
    n: "03",
    verbo: "Capturar",
    detalle: "En el patrimonio",
    x: 338,
    y: 268,
  },
] as const;

export function CicloDelValor({ className = "" }: { className?: string }) {
  return (
    <figure className={`relative ${className}`}>
      <svg
        viewBox="0 0 420 340"
        role="img"
        aria-label="El ciclo del valor: se genera en el mercado, se multiplica en la organización y se captura en el patrimonio."
        className="h-auto w-full max-w-[420px]"
      >
        <defs>
          <linearGradient id="ciclo-trazo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00a1e0" />
            <stop offset="100%" stopColor="#6cc5e9" />
          </linearGradient>
        </defs>

        {/* El triángulo que une los tres verbos: el ciclo */}
        <path
          d="M210 96 L100 250 M320 250 L210 96 M104 262 L316 262"
          fill="none"
          stroke="url(#ciclo-trazo)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="7 9"
          opacity="0.85"
        />

        {/* Flechas: el ciclo gira, siempre hacia el siguiente verbo */}
        <g fill="#00a1e0">
          <path d="M152 166 l-12 12 l16 6 z" />
          <path d="M268 166 l12 12 l-16 6 z" />
          <path d="M214 262 l-10 0 l5 9 z" />
        </g>

        {/* El centro: lo que está en juego */}
        <circle cx="210" cy="205" r="46" fill="rgba(255,255,255,0.05)" />
        <circle
          cx="210"
          cy="205"
          r="46"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1"
        />
        <text
          x="210"
          y="199"
          textAnchor="middle"
          className="fill-white font-display text-[13px] font-bold"
        >
          VALOR
        </text>
        <text x="210" y="219" textAnchor="middle" className="fill-sky text-[11px]">
          se escapa por
        </text>
        <text x="210" y="234" textAnchor="middle" className="fill-sky text-[11px]">
          el eslabón débil
        </text>

        {/* Un nodo por verbo */}
        {NODOS.map((nodo) => (
          <g key={nodo.verbo}>
            <circle
              cx={nodo.x}
              cy={nodo.y}
              r="30"
              className="fill-navy-deep"
              stroke="#00a1e0"
              strokeWidth="1.5"
            />
            <text
              x={nodo.x}
              y={nodo.y + 5}
              textAnchor="middle"
              className="fill-sky font-display text-[13px] font-bold"
            >
              {nodo.n}
            </text>
            <text
              x={nodo.x}
              y={nodo.y + (nodo.y < 150 ? -44 : 52)}
              textAnchor="middle"
              className="fill-white font-display text-[17px] font-bold"
            >
              {nodo.verbo}
            </text>
            <text
              x={nodo.x}
              y={nodo.y + (nodo.y < 150 ? -26 : 70)}
              textAnchor="middle"
              className="fill-[#a9b8d6] text-[12px]"
            >
              {nodo.detalle}
            </text>
          </g>
        ))}
      </svg>

      <figcaption className="sr-only">
        Los tres verbos del método de CEDEM, en ciclo: generar valor en el mercado,
        multiplicarlo en la organización y capturarlo en el patrimonio.
      </figcaption>
    </figure>
  );
}
