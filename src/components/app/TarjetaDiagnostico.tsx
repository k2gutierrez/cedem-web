import Link from "next/link";
import { ETIQUETA_NIVEL, TITULARES, textoDispersante, type Verbo } from "@/lib/camino/puntuar";
import type { DiagnosticoGuardado } from "@/lib/datos/camino";
import type { ArticuloResuelto } from "@/lib/datos/recomendaciones";

/**
 * Un diagnóstico del historial.
 *
 * Es un `<details>` nativo y no un acordeón con JavaScript: funciona sin
 * hidratar, se puede imprimir abierto y en el teléfono se comporta como espera
 * cualquiera. El más reciente llega abierto desde el servidor.
 */

const NOMBRE_VERBO: Record<Verbo, string> = {
  generar: "Generar valor",
  multiplicar: "Multiplicar valor",
  capturar: "Capturar valor",
};

/** El mismo nombre, para usarlo dentro de una frase («Se te atora…»). */
export const NOMBRE_VERBO_CORTO: Record<Verbo, string> = {
  generar: "generar valor",
  multiplicar: "multiplicar valor",
  capturar: "capturar valor",
};

const NOMBRE_DISPERSANTE: Record<string, string> = {
  desenfoque: "Desenfoque",
  soledad: "Soledad",
  tolerancia: "Tolerancia",
};

const ETIQUETA_TEMPERATURA: Record<string, { texto: string; clase: string }> = {
  frio: { texto: "Sin prisa", clase: "bg-sky/15 text-navy dark:text-sky" },
  tibio: { texto: "Para conversar", clase: "bg-sky/15 text-navy dark:text-sky" },
  caliente: {
    texto: "Conviene hablarlo pronto",
    clase: "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200",
  },
  urgente: {
    texto: "Urgente",
    clase: "bg-red-100 text-red-900 dark:bg-red-400/15 dark:text-red-200",
  },
};

function fechaLarga(iso: string | null): string {
  if (!iso) return "Sin fecha";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function duracion(segundos: number | null): string | null {
  if (!segundos || segundos < 30) return null;
  const minutos = Math.round(segundos / 60);
  return minutos < 1 ? "menos de un minuto" : `${minutos} min`;
}

/** Una barra de 0 a 100, con el nombre del verbo al lado. */
function Barra({ etiqueta, valor, critico }: { etiqueta: string; valor: number; critico: boolean }) {
  return (
    <li>
      <span className="flex items-baseline justify-between gap-3">
        <span className={`text-[13px] ${critico ? "font-semibold text-fg" : "text-fg-muted"}`}>
          {etiqueta}
        </span>
        <span className="text-[12px] tabular-nums text-fg-subtle">{valor}</span>
      </span>
      <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-border">
        <span
          className={`block h-full rounded-full ${critico ? "bg-cyan dark:bg-sky" : "bg-navy/30 dark:bg-sky/30"}`}
          style={{ width: `${Math.max(3, Math.min(100, valor))}%` }}
        />
      </span>
    </li>
  );
}

export function TarjetaDiagnostico({
  diagnostico,
  recomendaciones,
  abierto = false,
}: {
  diagnostico: DiagnosticoGuardado;
  recomendaciones: ArticuloResuelto[];
  abierto?: boolean;
}) {
  const { perfil, lectura } = diagnostico;
  const temperatura = ETIQUETA_TEMPERATURA[perfil.temperaturaEtiqueta] ?? ETIQUETA_TEMPERATURA.frio;
  const larga = duracion(diagnostico.duracionSegundos);

  /* La lectura base usa el titular del arquetipo como subtítulo. Cuando la IA
     afinó la lectura, el subtítulo es suyo y sí aporta: se muestra. Cuando no,
     repetirlo sería decir dos veces lo mismo. */
  const titular = TITULARES[perfil.arquetipo];
  const subtitulo = lectura.subtitulo.trim() === titular.trim() ? null : lectura.subtitulo;

  return (
    <details
      open={abierto}
      className="group rounded-2xl border border-border bg-bg open:border-cyan/50 dark:open:border-sky/50"
    >
      <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 p-6 [&::-webkit-details-marker]:hidden">
        <span className="font-display text-[15px] font-bold text-fg">
          {fechaLarga(diagnostico.completadaEn)}
        </span>
        <span className="rounded-full bg-sky/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-navy dark:text-sky">
          Se te atora {NOMBRE_VERBO[perfil.verboCritico]}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${temperatura.clase}`}>
          {temperatura.texto}
        </span>
        <span className="ml-auto text-[12px] text-fg-subtle group-open:hidden">
          Ver la lectura
        </span>
        <span className="ml-auto hidden text-[12px] text-fg-subtle group-open:inline">
          Ocultar
        </span>
      </summary>

      <div className="border-t border-border px-6 pb-6 pt-5">
        <h3 className="font-display text-lg font-bold leading-snug text-fg">{titular}</h3>
        {subtitulo ? (
          <p className="mt-2 text-[14.5px] leading-relaxed text-fg-muted">{subtitulo}</p>
        ) : null}

        {diagnostico.motorAntiguo ? (
          <p className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-[12.5px] leading-relaxed text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
            Este diagnóstico se calculó con una versión anterior del motor
            {diagnostico.motor ? ` (${diagnostico.motor})` : ""}. Lo que leas aquí está
            recalculado con las reglas de hoy, así que puede no coincidir con lo que viste
            entonces.
          </p>
        ) : null}

        {/* Los tres verbos */}
        <ul className="mt-6 space-y-3">
          {(
            [
              ["generar", perfil.scoreGenerar],
              ["multiplicar", perfil.scoreMultiplicar],
              ["capturar", perfil.scoreCapturar],
            ] as [Verbo, number][]
          ).map(([verbo, valor]) => (
            <Barra
              key={verbo}
              etiqueta={NOMBRE_VERBO[verbo]}
              valor={valor}
              critico={perfil.verboCritico === verbo}
            />
          ))}
        </ul>

        {/* La lectura */}
        <div className="mt-7 space-y-4 text-[14.5px] leading-relaxed text-fg-muted">
          <p>{lectura.verbo}</p>
          <p>{lectura.freno}</p>
        </div>

        {/* Lo que frena */}
        <div className="mt-7 rounded-xl border border-border bg-bg-soft p-5">
          <p className="tagline text-fg-subtle">Lo que lo frena</p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {(
              [
                ["desenfoque", perfil.desenfoque],
                ["soledad", perfil.soledad],
                ["tolerancia", perfil.tolerancia],
              ] as [string, number][]
            ).map(([cual, valor]) => (
              <li key={cual} className="text-[13px] text-fg-muted">
                {NOMBRE_DISPERSANTE[cual]}{" "}
                <span className="tabular-nums text-fg-subtle">{valor} de 3</span>
              </li>
            ))}
          </ul>
          {perfil.dispersanteDominante ? (
            <p className="mt-3 text-[13.5px] leading-relaxed text-fg-muted">
              {textoDispersante(perfil.dispersanteDominante)}
            </p>
          ) : (
            <p className="mt-3 text-[13.5px] leading-relaxed text-fg-muted">
              Ninguna de las tres fuerzas dispersantes está activa. Eso no es suerte: es
              gobierno.
            </p>
          )}
        </div>

        {/* Para leer */}
        {recomendaciones.length ? (
          <div className="mt-7">
            <p className="font-display text-[15px] font-bold text-fg">Para leer</p>
            <ul className="mt-3 space-y-2">
              {recomendaciones.map((articulo) => (
                <li key={articulo.href}>
                  {articulo.interno ? (
                    <Link
                      href={articulo.href}
                      className="text-[14px] font-medium text-navy hover:text-cyan dark:text-sky"
                    >
                      {articulo.titulo}
                    </Link>
                  ) : (
                    <a
                      href={articulo.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] font-medium text-navy hover:text-cyan dark:text-sky"
                    >
                      {articulo.titulo}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Para hacer */}
        {lectura.ejercicios?.length ? (
          <div className="mt-7">
            <p className="font-display text-[15px] font-bold text-fg">Para hacer esa semana</p>
            <ul className="mt-3 space-y-3">
              {lectura.ejercicios.map((ejercicio) => (
                <li key={ejercicio.titulo} className="rounded-xl border border-border p-4">
                  <span className="block font-display text-[14px] font-semibold text-fg">
                    {ejercicio.titulo}
                  </span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-fg-muted">
                    {ejercicio.detalle}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Pie: el contexto y el nivel sugerido */}
        <p className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-4 text-[12.5px] text-fg-subtle">
          <span>
            Nivel sugerido:{" "}
            <strong className="font-semibold text-fg-muted">{ETIQUETA_NIVEL[perfil.nivel]}</strong>
          </span>
          {larga ? (
            <>
              <span aria-hidden="true">·</span>
              <span>Lo hiciste en {larga}</span>
            </>
          ) : null}
          {diagnostico.modo ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{diagnostico.modo === "express" ? "Versión con prisa" : "Recorrido completo"}</span>
            </>
          ) : null}
          {diagnostico.confianza ? (
            <>
              <span aria-hidden="true">·</span>
              <span>Confianza {diagnostico.confianza}</span>
            </>
          ) : null}
          {lectura.origen === "ia" ? (
            <>
              <span aria-hidden="true">·</span>
              <span>Lectura afinada con IA</span>
            </>
          ) : null}
        </p>

        {diagnostico.comentario ? (
          <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
            <span className="text-fg-subtle">Lo que escribiste: </span>
            {diagnostico.comentario}
          </p>
        ) : null}

        <p className="mt-4 text-[12px] leading-relaxed text-fg-subtle">
          Las recomendaciones salen de tu diagnóstico: apuntan a{" "}
          {NOMBRE_VERBO_CORTO[perfil.verboCritico]}, que es donde se te atora. El Camino se
          puede repetir: si tu empresa cambió, vuelve a hacerlo y compara.
        </p>
      </div>
    </details>
  );
}
