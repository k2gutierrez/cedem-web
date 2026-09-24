"use client";

import { useState } from "react";

/**
 * Mapa de presencia de CEDEM.
 *
 * Dibuja los países donde la firma ha tenido clientes sobre una rejilla de
 * coordenadas, con arcos desde la sede de Zapopan. Se hace en SVG puro, sin
 * librerías de mapas ni datos geográficos pesados: la posición sale de la
 * latitud y la longitud reales de cada país con una proyección equirectangular.
 *
 * TODO (Fase 2): leer los países de la tabla `countries` para que el admin los
 * agregue o quite sin tocar código, y que el mapa se pinte con esos datos.
 */

type Lugar = {
  nombre: string;
  lat: number;
  lon: number;
  /** Las sedes se dibujan distinto de los países con clientes. */
  sede?: boolean;
  /** Ciudad, para las sedes. */
  ciudad?: string;
  /** Desplazamiento vertical de la etiqueta, para los países que se solapan. */
  dy?: number;
};

const LUGARES: Lugar[] = [
  { nombre: "México", ciudad: "Zapopan", lat: 20.67, lon: -103.35, sede: true },
  { nombre: "Estados Unidos", ciudad: "Miami", lat: 25.76, lon: -80.19, sede: true },
  { nombre: "Estados Unidos", ciudad: "Houston", lat: 29.76, lon: -95.37, sede: true },
  { nombre: "Canadá", lat: 45.42, lon: -75.7 },
  { nombre: "Guatemala", lat: 14.63, lon: -90.51, dy: -9 },
  { nombre: "El Salvador", lat: 13.69, lon: -89.19, dy: 12 },
  { nombre: "Panamá", lat: 8.98, lon: -79.52 },
  { nombre: "Colombia", lat: 4.71, lon: -74.07 },
  { nombre: "Venezuela", lat: 10.48, lon: -66.9 },
  { nombre: "Ecuador", lat: -1.83, lon: -78.18 },
  { nombre: "Puerto Rico", lat: 18.22, lon: -66.59 },
  { nombre: "España", lat: 40.42, lon: -3.7, dy: 13 },
  { nombre: "Andorra", lat: 42.51, lon: 1.52, dy: -7 },
];

/* Ventana geográfica que se dibuja: de Canadá a Ecuador y de México a Andorra. */
const LON_MIN = -130;
const LON_MAX = 15;
const LAT_MIN = -12;
const LAT_MAX = 56;

const ANCHO = 800;
const ALTO = 500;

/** Proyección equirectangular: suficiente y honesta para este uso. */
function proyectar(lat: number, lon: number) {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * ANCHO;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * ALTO;
  return { x, y };
}

const SEDE_ORIGEN = LUGARES[0];
const ORIGEN = proyectar(SEDE_ORIGEN.lat, SEDE_ORIGEN.lon);

/** Curva suave entre dos puntos, para que los trazos no parezcan reglas. */
function arco(a: { x: number; y: number }, b: { x: number; y: number }) {
  const medioX = (a.x + b.x) / 2;
  const medioY = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.18 - 12;
  return `M ${a.x} ${a.y} Q ${medioX} ${medioY} ${b.x} ${b.y}`;
}

export function MapaClientes() {
  const [activo, setActivo] = useState<string | null>(null);

  /** Un punto por país (las tres sedes comparten dos países). */
  const paises = LUGARES.reduce<Lugar[]>((acc, lugar) => {
    if (!acc.some((p) => p.nombre === lugar.nombre)) acc.push(lugar);
    return acc;
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-navy">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <h3 className="tagline text-sky">Presencia en doce países</h3>
        <ul className="flex items-center gap-5 text-[12px] text-[#a9b8d6]">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rotate-45 bg-cyan" aria-hidden="true" />
            Sedes
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky" aria-hidden="true" />
            Países con clientes
          </li>
        </ul>
      </div>

      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`Mapa con las tres sedes de CEDEM y ${paises.length} países donde ha tenido clientes`}
      >
        {/* Rejilla de coordenadas */}
        <g className="text-white/10" stroke="currentColor" strokeWidth="0.7">
          {Array.from({ length: 16 }, (_, i) => {
            const x = (i / 15) * ANCHO;
            return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={ALTO} />;
          })}
          {Array.from({ length: 11 }, (_, i) => {
            const y = (i / 10) * ALTO;
            return <line key={`h${i}`} x1={0} y1={y} x2={ANCHO} y2={y} />;
          })}
        </g>

        {/* Trópicos como referencia */}
        <g stroke="currentColor" strokeWidth="0.9" strokeDasharray="5 6" className="text-sky/25">
          <line
            x1={0}
            y1={proyectar(23.44, LON_MIN).y}
            x2={ANCHO}
            y2={proyectar(23.44, LON_MAX).y}
          />
          <line
            x1={0}
            y1={proyectar(0, LON_MIN).y}
            x2={ANCHO}
            y2={proyectar(0, LON_MAX).y}
          />
        </g>

        {/* Arcos desde la sede principal */}
        <g fill="none" strokeWidth="1.4" className="text-cyan/45">
          {LUGARES.filter((l) => l !== SEDE_ORIGEN).map((lugar, i) => (
            <path
              key={`${lugar.nombre}-${lugar.ciudad ?? i}`}
              d={arco(ORIGEN, proyectar(lugar.lat, lugar.lon))}
              stroke="currentColor"
              strokeDasharray="4 5"
            />
          ))}
        </g>

        {/* Nodos */}
        {LUGARES.map((lugar, i) => {
          const { x, y } = proyectar(lugar.lat, lugar.lon);
          const clave = `${lugar.nombre}-${lugar.ciudad ?? i}`;
          const esActivo = activo === clave;
          return (
            <g
              key={clave}
              onMouseEnter={() => setActivo(clave)}
              onMouseLeave={() => setActivo(null)}
              className="cursor-pointer"
            >
              {lugar.sede ? (
                <>
                  <circle cx={x} cy={y} r="11" className="fill-cyan/25">
                    <animate
                      attributeName="r"
                      values="9;15;9"
                      dur="2.6s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.5;0;0.5"
                      dur="2.6s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <rect
                    x={x - 5}
                    y={y - 5}
                    width="10"
                    height="10"
                    transform={`rotate(45 ${x} ${y})`}
                    className="fill-cyan"
                  />
                </>
              ) : (
                <>
                  <circle cx={x} cy={y} r="5.5" className="fill-sky/30">
                    <animate
                      attributeName="r"
                      values="4.5;9;4.5"
                      dur="3.4s"
                      begin={`${i * 0.3}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.45;0;0.45"
                      dur="3.4s"
                      begin={`${i * 0.3}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle cx={x} cy={y} r="4" className="fill-sky" />
                </>
              )}

              {/* Etiqueta: solo en pantallas medianas hacia arriba */}
              <g className="hidden md:block">
                <text
                  x={x + 10}
                  y={y + 4 + (lugar.dy ?? 0)}
                  className={`font-display text-[11px] ${
                    esActivo || lugar.sede ? "fill-white" : "fill-[#c7d2e8]"
                  }`}
                >
                  {lugar.ciudad ? `${lugar.ciudad}` : lugar.nombre}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

    </div>
  );
}
