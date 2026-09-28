"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnilloValor } from "@/components/camino/AnilloValor";
import { DescargarObservacion } from "@/components/camino/DescargarObservacion";
import { pedirLectura } from "@/app/acciones/camino";
import { BotonEnlace } from "@/components/ui/Boton";
import {
  EJERCICIOS_BASE,
  ETIQUETAS_BASE,
  articulosPara,
} from "@/content/camino/catalogo";
import { ETIQUETA_NIVEL, type Perfil } from "@/lib/camino/puntuar";
import { lecturaBase } from "@/lib/ia/lectura";

/**
 * La observación que recibe el dueño al terminar.
 *
 * QUÉ CAMBIÓ Y POR QUÉ
 *
 * Antes esto era un diagnóstico con etiquetas: «tu verbo atorado: multiplicar»,
 * «se te atora capturar valor». Decisión de Carlos: el entregable es lo que
 * escribiría un consultor de CEDEM después de escuchar al dueño. Los números del
 * motor siguen ahí —sirven para elegir los artículos y los ejercicios, y el anillo
 * los dibuja—, pero lo que se lee es una observación, y va firmada.
 *
 * Todo lo que se muestra sale del motor determinista y del catálogo local. La IA
 * sólo redacta: no puede cambiar dónde está el valor ni el nivel sugerido.
 */
export function Resultado({
  perfil,
  catalogo = {},
  comentario,
  nombre,
  segundos,
  modo,
  sessionId,
}: {
  perfil: Perfil;
  /** Ruta antigua del artículo → slug en la plataforma (lo resuelve el servidor). */
  catalogo?: Record<string, string>;
  comentario: string;
  nombre: string;
  segundos: number;
  modo: "normal" | "express";
  sessionId?: string;
}) {
  const [hechos, setHechos] = useState<Record<number, boolean>>({});

  // La lectura base se muestra de inmediato; en cuanto la IA responde, se
  // sustituye sin que el dueño haya tenido que esperar. Si falla, se queda la
  // base: nunca se ve una pantalla a medias.
  const [lectura, setLectura] = useState(() => lecturaBase(perfil));
  const [afinando, setAfinando] = useState(Boolean(sessionId));

  useEffect(() => {
    if (!sessionId) return;
    let vigente = true;
    pedirLectura(sessionId)
      .then((r) => {
        if (vigente && r.ok && r.lectura) setLectura(r.lectura);
      })
      .catch(() => {
        /* se conserva la lectura base */
      })
      .finally(() => {
        if (vigente) setAfinando(false);
      });
    return () => {
      vigente = false;
    };
  }, [sessionId]);

  const articulos = articulosPara(ETIQUETAS_BASE[perfil.arquetipo] ?? []).map((articulo) => {
    // Si el artículo ya vive en la plataforma, se enlaza aquí dentro; si no, se
    // deja la ruta original, que la plataforma redirige igual.
    const ruta = articulo.url
      .replace(/^https?:\/\/(www\.)?cedem\.com\.mx/, "")
      .replace(/\/$/, "");
    const slug = catalogo[ruta];
    return { ...articulo, href: slug ? `/recursos/${slug}` : articulo.url, interno: Boolean(slug) };
  });
  const ejercicios = lectura.ejercicios?.length ? lectura.ejercicios : (EJERCICIOS_BASE[perfil.arquetipo] ?? []);
  const titular = lectura.titular;

  const nombrePila = nombre.trim().split(/\s+/)[0] ?? "";
  const saludo = nombrePila ? `${nombrePila}, ` : "";

  const verboLegible =
    perfil.verboCritico === "generar"
      ? "Generar"
      : perfil.verboCritico === "multiplicar"
        ? "Multiplicar"
        : "Capturar";

  return (
    <div>
      {/* Titular */}
      <p className="tagline text-cyan dark:text-sky">Observación de CEDEM</p>
      <h1 className="mt-4 text-h2 text-fg">
        {saludo}
        {titular}
      </h1>
      <p className="mt-3 text-sm text-fg-subtle">
        Camino del Dueño · observación escrita para tu caso
      </p>
      {afinando ? (
        <p className="mt-3 text-sm text-cyan dark:text-sky">
          Estoy afinando tu observación con lo que me escribiste…
        </p>
      ) : null}

      {modo === "express" ? (
        <p className="mt-3 text-sm text-fg-subtle">
          Con lo que me contaste me alcanza para escribirte esto. Si quieres afinarlo,
          lo completamos otro día.
        </p>
      ) : null}

      {/* Anillo: el dato, sin etiquetas */}
      <div className="mt-10 grid justify-items-center gap-8 sm:grid-cols-[auto_1fr] sm:items-center sm:justify-items-start">
        <AnilloValor
          progreso={1}
          scores={{
            generar: perfil.scoreGenerar,
            multiplicar: perfil.scoreMultiplicar,
            capturar: perfil.scoreCapturar,
          }}
          verboDebil={perfil.verboCritico}
          tamano={200}
        />
        <div>
          <h2 className="font-display text-lg font-bold text-fg">
            Así se mueve hoy tu valor
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            Los tres movimientos del método, medidos con tus respuestas. El más bajo
            —{verboLegible.toLowerCase()}— es el que hoy te está costando más valor.
          </p>
          {perfil.focos.length ? (
            <ul className="mt-4 space-y-2">
              {perfil.focos.map((foco) => (
                <li key={foco.item} className="flex gap-2.5 text-sm text-fg-muted">
                  <span
                    aria-hidden="true"
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan dark:bg-sky"
                  />
                  <span>
                    <strong className="font-semibold text-fg">{foco.componente}</strong>:{" "}
                    {foco.frase}.
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {/* La observación, firmada */}
      <section className="mt-10 rounded-3xl border border-border bg-bg-soft p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold text-fg">Lo que observamos</h2>
        <div className="mt-4 space-y-4">
          {lectura.observacion.map((parrafo, i) => (
            <p key={i} className="text-base leading-relaxed text-fg-muted">
              {parrafo}
            </p>
          ))}
        </div>
        <p className="mt-5 border-t border-border pt-4 text-sm text-fg-subtle">
          — Equipo de consultoría de CEDEM
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <DescargarObservacion
            datos={{
              nombre: nombre || "Dueño de empresa",
              titular,
              observacion: lectura.observacion,
              fecha: new Date(),
              version: perfil.version,
              scores: {
                generar: perfil.scoreGenerar,
                multiplicar: perfil.scoreMultiplicar,
                capturar: perfil.scoreCapturar,
              },
              verboCritico: perfil.verboCritico,
              focos: perfil.focos.map((f) => ({ componente: f.componente, frase: f.frase })),
              dispersante: null,
              nivel: ETIQUETA_NIVEL[perfil.nivel],
              articulos: articulos.slice(0, 3).map((a) => ({
                titulo: a.titulo,
                porque: a.etiquetas.slice(0, 2).join(" y "),
              })),
              ejercicios,
              sitio: "cedem.com.mx",
            }}
          />
          <span className="text-sm text-fg-subtle">
            Con el logo de CEDEM, para imprimir o compartir con tu consejo.
          </span>
        </div>
      </section>

      {/* Para leer */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-fg">
          Para leer esta semana
        </h2>
        <ul className="mt-4 space-y-3">
          {articulos.map((articulo) => (
            <li
              key={articulo.href}
              className="rounded-2xl border border-border p-5 transition-colors hover:border-cyan/60 dark:hover:border-sky/60"
            >
              {articulo.interno ? (
                <Link
                  href={articulo.href}
                  className="font-display text-base font-semibold text-fg hover:text-cyan dark:hover:text-sky"
                >
                  {articulo.titulo}
                </Link>
              ) : (
                <a
                  href={articulo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display text-base font-semibold text-fg hover:text-cyan dark:hover:text-sky"
                >
                  {articulo.titulo}
                </a>
              )}
              <p className="mt-1.5 text-sm text-fg-subtle">
                Porque toca {articulo.etiquetas.slice(0, 2).join(" y ")}.
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Para hacer */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-fg">
          Para hacer esta semana
        </h2>
        <ul className="mt-4 space-y-3">
          {ejercicios.map((ejercicio, i) => (
            <li key={ejercicio.titulo}>
              <label className="flex cursor-pointer gap-4 rounded-2xl border border-border p-5 transition-colors hover:border-cyan/60 dark:hover:border-sky/60">
                <input
                  type="checkbox"
                  checked={Boolean(hechos[i])}
                  onChange={(e) => setHechos({ ...hechos, [i]: e.target.checked })}
                  className="mt-1 h-5 w-5 shrink-0 accent-[#00a1e0]"
                />
                <span>
                  <span
                    className={`block font-display text-base font-semibold ${
                      hechos[i] ? "text-fg-subtle line-through" : "text-fg"
                    }`}
                  >
                    {ejercicio.titulo}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-fg-muted">
                    {ejercicio.detalle}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      {/* Hablemos */}
      <section className="mt-10 rounded-3xl bg-navy p-7 text-white sm:p-9">
        <h2 className="font-display text-xl font-bold text-white">
          ¿Lo revisamos juntos?
        </h2>
        <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-[#c7d2e8]">
          {perfil.temperaturaEtiqueta === "urgente" || perfil.temperaturaEtiqueta === "caliente"
            ? "Por lo que contestaste, vale la pena una conversación de treinta minutos con un socio de CEDEM. Sin compromiso y sin presentación de por medio."
            : "Si quieres, seguimos platicando: puedes escribirnos o dejar que un socio de CEDEM revise tu caso contigo."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <BotonEnlace
            href={`https://api.whatsapp.com/send?phone=523322576343&text=${encodeURIComponent(
              "Hice el Camino del Dueño y quiero hablar con un socio.",
            )}`}
            externo
            variante="claro"
            tamano="lg"
          >
            Quiero hablar con un socio
          </BotonEnlace>
          <BotonEnlace
            href="/recursos"
            variante="secundario"
            tamano="lg"
            className="border-white/40 text-white hover:border-sky hover:text-sky"
          >
            Ver más recursos
          </BotonEnlace>
        </div>
      </section>

      {/* Pie */}
      <footer className="mt-8 space-y-3 border-t border-border pt-6">
        <p className="text-sm text-fg-muted">
          Nivel de acompañamiento que te corresponde por tamaño y etapa:{" "}
          <strong className="font-semibold text-fg">{ETIQUETA_NIVEL[perfil.nivel]}</strong>.
          Esto no es una propuesta: es una observación.
        </p>
        {comentario ? (
          <p className="text-sm text-fg-subtle">
            Guardamos también lo que nos escribiste. Lo vamos a leer antes de hablar contigo.
          </p>
        ) : null}
        <p className="text-xs leading-relaxed text-fg-subtle">
          Esta observación es un apoyo para tu reflexión, no sustituye asesoría legal, fiscal ni
          financiera. Tus respuestas quedan en tu perfil y puedes pedir que las borremos
          cuando quieras.{" "}
          <Link href="/aviso-de-privacidad" className="underline underline-offset-4">
            Aviso de privacidad
          </Link>
          .
        </p>
        <p className="text-xs text-fg-subtle">
          Calculado con el motor {perfil.version}
          {segundos > 0 ? ` · ${Math.round(segundos / 60)} min de recorrido` : ""} ·
          confianza {perfil.confianza}.
        </p>
      </footer>
    </div>
  );
}
