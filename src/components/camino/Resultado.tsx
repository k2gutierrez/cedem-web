"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnilloValor } from "@/components/camino/AnilloValor";
import { pedirLectura } from "@/app/acciones/camino";
import { BotonEnlace } from "@/components/ui/Boton";
import {
  EJERCICIOS_BASE,
  ETIQUETAS_BASE,
  articulosPara,
} from "@/content/camino/catalogo";
import { ETIQUETA_NIVEL, TITULARES, type Perfil } from "@/lib/camino/puntuar";
import { lecturaBase } from "@/lib/ia/lectura";

/**
 * La lectura que recibe el dueño al terminar.
 *
 * Todo lo que se muestra aquí sale del motor determinista y del catálogo local.
 * Cuando la IA esté conectada (Fase 4) reescribirá la redacción con el contexto
 * del dueño, pero no podrá cambiar el verbo crítico, el arquetipo ni el nivel.
 */
export function Resultado({
  perfil,
  comentario,
  nombre,
  segundos,
  modo,
  sessionId,
}: {
  perfil: Perfil;
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

  const articulos = articulosPara(ETIQUETAS_BASE[perfil.arquetipo] ?? []);
  const ejercicios = lectura.ejercicios?.length ? lectura.ejercicios : (EJERCICIOS_BASE[perfil.arquetipo] ?? []);
  const titular = TITULARES[perfil.arquetipo];

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
      <p className="tagline text-cyan dark:text-sky">Tu lectura</p>
      <h1 className="mt-4 text-h2 text-fg">
        {saludo}
        {titular}
      </h1>
      <p className="mt-4 text-lead text-fg-muted">{lectura.subtitulo}</p>
      <p className="mt-2 text-sm text-fg-subtle">{perfil.bandaTexto}</p>
      {afinando ? (
        <p className="mt-3 text-[12.5px] text-cyan dark:text-sky">
          Estoy afinando tu lectura con lo que me escribiste…
        </p>
      ) : null}

      {modo === "express" ? (
        <p className="mt-3 text-[13px] text-fg-subtle">
          Con lo que me contaste me alcanza para darte una lectura. Si quieres afinarla,
          la completamos otro día.
        </p>
      ) : null}

      {/* Anillo */}
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
            Tu verbo atorado: {verboLegible}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{lectura.verbo}</p>
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

      {/* Freno o logro */}
      <section className="mt-10 rounded-2xl border border-border bg-bg-soft p-6">
        {perfil.dispersanteDominante ? (
          <>
            <h2 className="font-display text-base font-bold text-fg">
              Lo que te está frenando
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{lectura.freno}</p>
          </>
        ) : (
          <>
            <h2 className="font-display text-base font-bold text-fg">
              Lo que ya hiciste bien
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
              Hoy no traes ninguna de las tres fuerzas dispersantes activas: ni desenfoque,
              ni soledad, ni tolerancia. Eso no es suerte, es gobierno. El siguiente
              movimiento ya no es apagar fuegos: es decidir qué sigue.
            </p>
          </>
        )}
      </section>

      {/* Para leer */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-fg">
          Para leer esta semana
        </h2>
        <ul className="mt-4 space-y-3">
          {articulos.map((articulo) => (
            <li
              key={articulo.url}
              className="rounded-2xl border border-border p-5 transition-colors hover:border-cyan/60 dark:hover:border-sky/60"
            >
              <a
                href={articulo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-[15px] font-semibold text-fg hover:text-cyan dark:hover:text-sky"
              >
                {articulo.titulo}
              </a>
              <p className="mt-1.5 text-[13px] text-fg-subtle">
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
                  className="mt-1 h-4 w-4 shrink-0 accent-[#00a1e0]"
                />
                <span>
                  <span
                    className={`block font-display text-[15px] font-semibold ${
                      hechos[i] ? "text-fg-subtle line-through" : "text-fg"
                    }`}
                  >
                    {ejercicio.titulo}
                  </span>
                  <span className="mt-1.5 block text-[13px] leading-relaxed text-fg-muted">
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
        <h2 className="font-display text-xl font-bold text-white">Hablemos</h2>
        <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-[#c7d2e8]">
          {perfil.temperaturaEtiqueta === "urgente" || perfil.temperaturaEtiqueta === "caliente"
            ? "Por lo que contestaste, vale la pena una conversación de treinta minutos con un socio de CEDEM. Sin compromiso y sin presentación de por medio."
            : "Si quieres, seguimos platicando: puedes escribirnos o dejar que un socio de CEDEM revise tu caso contigo."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <BotonEnlace
            href={`https://api.whatsapp.com/send?phone=523322576343&text=${encodeURIComponent(
              `Hice el Camino del Dueño y quiero hablar con un socio. Mi lectura: ${titular}`,
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
          Esto no es una propuesta: es una lectura.
        </p>
        {comentario ? (
          <p className="text-[13px] text-fg-subtle">
            Guardamos también lo que nos escribiste. Lo vamos a leer antes de hablar contigo.
          </p>
        ) : null}
        <p className="text-[12px] leading-relaxed text-fg-subtle">
          Esta lectura es un apoyo para tu reflexión, no sustituye asesoría legal, fiscal ni
          financiera. Tus respuestas quedan en tu perfil y puedes pedir que las borremos
          cuando quieras.{" "}
          <Link href="/aviso-de-privacidad" className="underline underline-offset-4">
            Aviso de privacidad
          </Link>
          .
        </p>
        <p className="text-[11px] text-fg-subtle">
          Diagnóstico calculado con el motor {perfil.version}
          {segundos > 0 ? ` · ${Math.round(segundos / 60)} min de recorrido` : ""} ·
          confianza {perfil.confianza}.
        </p>
      </footer>
    </div>
  );
}
