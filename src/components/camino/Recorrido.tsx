"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Boton } from "@/components/ui/Boton";
import { IconoFlecha } from "@/components/ui/Iconos";
import {
  APERTURA,
  PILDORAS,
  PREGUNTAS,
  RECORRIDO,
  TOTAL_PANTALLAS,
  type Opcion,
  type Pregunta,
} from "@/content/camino/config";
import { guardarDiagnostico } from "@/app/acciones/camino";
import { calcularPerfil } from "@/lib/camino/puntuar";
import {
  canalAtom,
  comentarioAtom,
  consentimientoAtom,
  contactoAtom,
  inicioAtom,
  modoAtom,
  pasoAtom,
  reiniciarAtom,
  respuestasAtom,
  segundosAtom,
  sessionIdAtom,
} from "@/lib/estado/camino";
import { Resultado } from "@/components/camino/Resultado";

/** Descarta las pantallas que el modo express no muestra. */
function indicesVisibles(modo: "normal" | "express"): number[] {
  return RECORRIDO.map((_, i) => i).filter((i) => {
    if (modo === "normal") return true;
    const pantalla = RECORRIDO[i];
    if (pantalla.tipo === "pregunta" && pantalla.id === "Q12") return false;
    return true;
  });
}

export function Recorrido() {
  /* El avance, las respuestas y el modo viven en átomos con persistencia
     automática (ver src/lib/estado/camino.ts). El contacto NO se persiste:
     son datos personales y no tienen por qué quedar en el dispositivo. */
  const [pasoCrudo, setPaso] = useAtom(pasoAtom);
  const [respuestas, setRespuestas] = useAtom(respuestasAtom);
  const [modo, setModo] = useAtom(modoAtom);
  const [comentario, setComentario] = useAtom(comentarioAtom);
  const [contacto, setContacto] = useAtom(contactoAtom);
  const [canal, setCanal] = useAtom(canalAtom);
  const [consentimiento, setConsentimiento] = useAtom(consentimientoAtom);
  const [segundos, setSegundos] = useAtom(segundosAtom);
  const [sessionId, setSessionId] = useAtom(sessionIdAtom);
  const setInicio = useSetAtom(inicioAtom);
  const reiniciar = useSetAtom(reiniciarAtom);
  const inicioRecorrido = useAtomValue(inicioAtom);

  const [guardando, setGuardando] = useState(false);
  const [avisoGuardado, setAvisoGuardado] = useState<string | null>(null);

  /* El avance está guardado en el dispositivo y el servidor no puede saberlo: en
     el HTML del servidor no hay nada restaurado. `useSyncExternalStore` resuelve
     exactamente eso —falso en el servidor y en la hidratación, verdadero después—
     sin el `useEffect(() => setMontado(true))` de antes, que provocaba un render
     en cascada y React marcaba como error. */
  const montado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  /* Portada: se muestra mientras el dueño no haya decidido. Si venía con avance
     guardado, la portada le ofrece seguir donde iba; si no, le presenta el
     recorrido. Antes esto se resolvía con un `useEffect` que solo corría al
     montar, y tenía un efecto colateral: la pantalla de "¿Seguimos?" era
     inalcanzable, porque la misma condición que la habilitaba la saltaba. */
  const [decision, setDecision] = useState<"seguir" | "nuevo" | null>(null);

  /* El avance está guardado en el dispositivo y puede quedar FUERA del recorrido:
     basta con quitar o reordenar una pantalla para que quien iba por la 20 se
     quede con un índice que ya no existe. Sin acotarlo, `RECORRIDO[paso].tipo`
     reventaba y el dueño veía «This page couldn't load» en lugar del Camino.
     Se corrige aquí, en un solo sitio, en vez de repartir comprobaciones por todo
     el render; a partir de este valor todo lo demás ya es válido. */
  const paso = Number.isFinite(pasoCrudo)
    ? Math.min(Math.max(pasoCrudo, 0), RECORRIDO.length - 1)
    : 0;

  const pantalla = RECORRIDO[paso];
  const hayProgreso = paso > 0 && paso < RECORRIDO.length - 1;
  const enApertura = pantalla.tipo === "apertura" || (hayProgreso && decision === null);

  /* El cronómetro por pantalla se inicializa en el efecto, no en el render:
     `Date.now()` es impuro y llamarlo al renderizar da resultados distintos en
     cada pasada. */
  const inicioPantalla = useRef(0);

  // Tiempo por pantalla: alimenta la telemetría del recorrido.
  useEffect(() => {
    inicioPantalla.current = Date.now();
    return () => {
      setSegundos((s) => s + Math.round((Date.now() - inicioPantalla.current) / 1000));
    };
  }, [paso, setSegundos]);

  /* ------------------------------------------------------------------ */
  /* Navegación                                                          */
  /* ------------------------------------------------------------------ */

  const visibles = useMemo(() => indicesVisibles(modo), [modo]);
  const posicionVisible = visibles.indexOf(paso);
  const progreso = posicionVisible / (visibles.length - 1);

  const avanzar = useCallback(() => {
    setPaso((p) => {
      let siguiente = p + 1;
      if (modo === "express") {
        // El modo express omite la tercera fuerza dispersante (Q12).
        while (siguiente < RECORRIDO.length) {
          const candidata = RECORRIDO[siguiente];
          if (candidata.tipo === "pregunta" && candidata.id === "Q12") {
            siguiente++;
            continue;
          }
          break;
        }
      }
      return Math.min(siguiente, RECORRIDO.length - 1);
    });
  }, [modo, setPaso]);

  const retroceder = useCallback(() => {
    setPaso((p) => Math.max(0, p - 1));
  }, [setPaso]);

  function responderOpcion(pregunta: Pregunta, opcion: Opcion) {
    setRespuestas((previas) => ({ ...previas, [pregunta.id]: opcion.id }));
    // Pequeña pausa para que se vea la selección antes de avanzar.
    window.setTimeout(avanzar, 260);
  }

  function responderAbierta(pregunta: Pregunta, texto: string) {
    setRespuestas((previas) => ({ ...previas, [pregunta.id]: texto }));
  }

  /* ------------------------------------------------------------------ */
  /* Reanudar                                                            */
  /* ------------------------------------------------------------------ */

  /** El avance ya está restaurado: solo hay que salir de la portada. */
  function reanudar() {
    setDecision("seguir");
  }

  function empezarDeNuevo() {
    reiniciar();
    setDecision("nuevo");
  }

  function empezar(express: boolean) {
    setModo(express ? "express" : "normal");
    setInicio(Date.now());
    setDecision("nuevo");
    avanzar();
  }

  /**
   * Guarda el diagnóstico y muestra la lectura.
   *
   * El guardado NO puede impedir que el dueño vea su resultado: si falla, se
   * avisa con discreción y el recorrido termina igual. Nunca se pierde el valor
   * entregado por un problema técnico.
   */
  async function enviarYVerLectura() {
    setGuardando(true);
    setAvisoGuardado(null);
    try {
      const resultado = await guardarDiagnostico({
        respuestas,
        nombre: contacto.nombre,
        correo: canal === "correo" ? contacto.correo : undefined,
        whatsapp: canal === "whatsapp" ? contacto.whatsapp : undefined,
        comentario,
        consentimiento,
        // La duración se mide de principio a fin: el contador por pantalla se
        // pierde al desmontar el componente y llegaba a guardarse en cero.
        segundos: inicioRecorrido ? Math.round((Date.now() - inicioRecorrido) / 1000) : segundos,
        modo,
      });
      if (!resultado.ok) setAvisoGuardado(resultado.mensaje);
      else if (resultado.sessionId) setSessionId(resultado.sessionId);
    } catch {
      setAvisoGuardado(
        "No pudimos guardar tu lectura, pero aquí la tienes. Escríbenos si quieres que la revisemos contigo.",
      );
    } finally {
      setGuardando(false);
      avanzar();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const perfil = useMemo(() => calcularPerfil(respuestas), [respuestas]);

  if (!montado) {
    return (
      <Marco progreso={0} etiqueta="Camino del Dueño" alVolver={null}>
        <p className="tagline text-cyan dark:text-sky">{APERTURA.kicker}</p>
        <h1 className="mt-4 text-h1 text-fg">{APERTURA.titulo}</h1>
        <p className="mt-5 text-lead text-fg-muted">Preparando tu recorrido…</p>
      </Marco>
    );
  }

  if (pantalla.tipo === "apertura" || enApertura) {
    return (
      <Marco progreso={0} etiqueta="Empieza aquí" alVolver={null}>
        {hayProgreso ? (
          <div className="rounded-2xl border border-cyan/40 bg-sky/10 p-5 text-sm dark:border-sky/40">
            <p className="font-semibold text-fg">Ya habías empezado este recorrido.</p>
            <p className="mt-1.5 text-fg-muted">
              Ibas en la pantalla {paso} de {TOTAL_PANTALLAS - 2}. ¿Seguimos?
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Boton onClick={reanudar} tamano="md">
                Seguir donde iba
              </Boton>
              <Boton onClick={empezarDeNuevo} variante="secundario" tamano="md">
                Empezar de nuevo
              </Boton>
            </div>
          </div>
        ) : (
          <>
            <p className="tagline text-cyan dark:text-sky">{APERTURA.kicker}</p>
            <h1 className="mt-4 text-h1 text-fg">{APERTURA.titulo}</h1>
            <p className="mt-5 text-lead text-fg-muted">{APERTURA.cuerpo}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Boton onClick={() => empezar(false)} tamano="lg">
                {APERTURA.botonPrincipal}
                <IconoFlecha className="h-4 w-4" />
              </Boton>
              <Boton onClick={() => empezar(true)} variante="secundario" tamano="lg">
                {APERTURA.botonExpress}
              </Boton>
            </div>

            <p className="mt-6 text-[13px] leading-relaxed text-fg-subtle">
              {APERTURA.pie}
            </p>
          </>
        )}
      </Marco>
    );
  }

  if (pantalla.tipo === "pildora") {
    const pildora = PILDORAS.find((p) => p.id === pantalla.id)!;
    return (
      <Marco progreso={progreso} etiqueta={pildora.titulo} alVolver={retroceder}>
        <p className="tagline text-cyan dark:text-sky">Para entender lo que sigue</p>
        <h2 className="mt-4 text-h2 text-fg">{pildora.titulo}</h2>
        <p
          className="mt-5 text-lead text-fg-muted [&_strong]:font-semibold [&_strong]:text-fg"
          dangerouslySetInnerHTML={{
            __html: pildora.texto.replace(
              /\*\*(.+?)\*\*/g,
              "<strong>$1</strong>",
            ),
          }}
        />
        <div className="mt-8">
          <Boton onClick={avanzar} tamano="lg">
            Continuar
            <IconoFlecha className="h-4 w-4" />
          </Boton>
        </div>
      </Marco>
    );
  }

  if (pantalla.tipo === "pregunta") {
    const pregunta = PREGUNTAS.find((p) => p.id === pantalla.id)!;
    return (
      <Marco progreso={progreso} etiqueta={pregunta.id} alVolver={retroceder}>
        {pregunta.kicker ? (
          <p className="mb-4 text-sm font-medium text-cyan dark:text-sky">
            {pregunta.kicker}
          </p>
        ) : null}
        <h2 className="text-h3 text-fg">{pregunta.enunciado}</h2>
        {pregunta.ayuda ? (
          <p className="mt-2 text-[13px] text-fg-subtle">{pregunta.ayuda}</p>
        ) : null}

        {pregunta.tipo === "opcion" && pregunta.opciones ? (
          <ul className="mt-6 space-y-2.5">
            {pregunta.opciones.map((opcion) => {
              const elegida = respuestas[pregunta.id] === opcion.id;
              return (
                <li key={opcion.id}>
                  <button
                    type="button"
                    onClick={() => responderOpcion(pregunta, opcion)}
                    aria-pressed={elegida}
                    className={`w-full rounded-2xl border px-5 py-4 text-left text-[15px] transition-colors ${
                      elegida
                        ? "border-cyan bg-sky/15 font-semibold text-fg dark:border-sky"
                        : "border-border text-fg-muted hover:border-cyan/60 hover:text-fg dark:hover:border-sky/60"
                    }`}
                  >
                    {opcion.texto}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <PreguntaAbierta
            key={pregunta.id}
            pregunta={pregunta}
            valor={respuestas[pregunta.id] ?? ""}
            onCambio={(texto) => responderAbierta(pregunta, texto)}
            onContinuar={avanzar}
            onSalida={() => {
              if (pregunta.salida) {
                setRespuestas((previas) => ({
                  ...previas,
                  [`__${pregunta.salida!.marca}`]: "true",
                }));
              }
              avanzar();
            }}
          />
        )}

        {pregunta.tipo === "opcion" ? (
          <p className="mt-6 text-[12.5px] text-fg-subtle">
            Elige una. Puedes volver atrás cuando quieras.
          </p>
        ) : null}
      </Marco>
    );
  }

  if (pantalla.tipo === "captura") {
    const puedeEnviar =
      consentimiento &&
      contacto.nombre.trim().length > 1 &&
      (canal === "correo"
        ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contacto.correo)
        : contacto.whatsapp.replace(/\D/g, "").length >= 10);

    return (
      <Marco
        progreso={progreso}
        etiqueta="Último paso"
        alVolver={retroceder}
      >
        <h2 className="text-h3 text-fg">Ya casi. ¿A dónde te mando tu lectura?</h2>
        <div className="mt-6 flex gap-2">
          {(["correo", "whatsapp"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCanal(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                canal === c
                  ? "bg-navy text-white dark:bg-cyan dark:text-[#04102e]"
                  : "border border-border text-fg-muted"
              }`}
            >
              {c === "correo" ? "Correo" : "WhatsApp"}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="nombre" className="mb-1.5 block text-[13px] font-medium text-fg-muted">
              Tu nombre
            </label>
            <input
              id="nombre"
              value={contacto.nombre}
              onChange={(e) => setContacto({ ...contacto, nombre: e.target.value })}
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-fg outline-none focus:border-cyan dark:focus:border-sky"
              placeholder="Cómo te llamas"
            />
          </div>

          {canal === "correo" ? (
            <div>
              <label htmlFor="correo" className="mb-1.5 block text-[13px] font-medium text-fg-muted">
                Tu correo
              </label>
              <input
                id="correo"
                type="email"
                value={contacto.correo}
                onChange={(e) => setContacto({ ...contacto, correo: e.target.value })}
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-fg outline-none focus:border-cyan dark:focus:border-sky"
                placeholder="tucorreo@empresa.com"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="whatsapp" className="mb-1.5 block text-[13px] font-medium text-fg-muted">
                Tu WhatsApp
              </label>
              <input
                id="whatsapp"
                type="tel"
                value={contacto.whatsapp}
                onChange={(e) => setContacto({ ...contacto, whatsapp: e.target.value })}
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-fg outline-none focus:border-cyan dark:focus:border-sky"
                placeholder="+52 33 1234 5678"
              />
            </div>
          )}

          <div>
            <label htmlFor="comentario" className="mb-1.5 block text-[13px] font-medium text-fg-muted">
              ¿Algo más que quieras que sepa de tu caso? (opcional)
            </label>
            <textarea
              id="comentario"
              rows={3}
              maxLength={400}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full resize-y rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-fg outline-none focus:border-cyan dark:focus:border-sky"
              placeholder="Lo que quieras agregar"
            />
          </div>

          <label className="flex cursor-pointer gap-3 text-[13px] leading-relaxed text-fg-muted">
            <input
              type="checkbox"
              checked={consentimiento}
              onChange={(e) => setConsentimiento(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#00a1e0]"
            />
            Acepto que CEDEM guarde mis respuestas para darme seguimiento y me
            contacte. Puedo pedir que las borren cuando quiera.
          </label>
        </div>

        <div className="mt-7">
          <Boton
            onClick={enviarYVerLectura}
            tamano="lg"
            disabled={!puedeEnviar || guardando}
            className="w-full sm:w-auto"
          >
            {guardando ? "Guardando…" : "Ver mi lectura"}
            {!guardando ? <IconoFlecha className="h-4 w-4" /> : null}
          </Boton>
          <p className="mt-4 text-[12.5px] text-fg-subtle">
            Nada de spam. Un correo, y si quieres hablamos.
          </p>
          {avisoGuardado ? (
            <p className="mt-3 text-[12.5px] text-amber-700 dark:text-amber-300">
              {avisoGuardado}
            </p>
          ) : null}
        </div>
      </Marco>
    );
  }

  /* --- Revelado ------------------------------------------------------- */

  return (
    <Marco progreso={1} etiqueta="Tu lectura" alVolver={null} ancho="ancho">
      <Resultado
        perfil={perfil}
        comentario={comentario}
        nombre={contacto.nombre}
        segundos={segundos}
        modo={modo}
        sessionId={sessionId}
      />
    </Marco>
  );
}

/* -------------------------------------------------------------------------- */
/* Piezas auxiliares                                                          */
/* -------------------------------------------------------------------------- */

function Marco({
  children,
  progreso,
  etiqueta,
  alVolver,
  ancho = "estrecho",
}: {
  children: React.ReactNode;
  progreso: number;
  etiqueta: string;
  alVolver: (() => void) | null;
  ancho?: "estrecho" | "ancho";
}) {
  return (
    <div className="min-h-[70vh] bg-bg-soft py-10 lg:py-16">
      <div
        className={`mx-auto w-full px-5 sm:px-8 ${
          ancho === "ancho" ? "max-w-[900px]" : "max-w-[680px]"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          {alVolver ? (
            <button
              type="button"
              onClick={alVolver}
              className="text-[13px] font-medium text-fg-subtle transition-colors hover:text-fg"
            >
              ← Atrás
            </button>
          ) : (
            <span className="text-[13px] font-medium text-fg-subtle">
              Camino del Dueño
            </span>
          )}
          <div className="flex items-center gap-3">
            <span className="text-[12px] uppercase tracking-wider text-fg-subtle">
              {etiqueta}
            </span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border sm:w-36">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan to-sky transition-all duration-500"
                style={{ width: `${Math.round(progreso * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-bg p-6 shadow-sm sm:p-9">
          {children}
        </div>

        <p className="mt-5 text-center text-[12px] text-fg-subtle">
          CEDEM · Centro de Dueñez Empresaria · &ldquo;Dueñez®&rdquo; es una marca
          registrada por Carlos A. Dumois Núñez.
        </p>
      </div>
    </div>
  );
}

function PreguntaAbierta({
  pregunta,
  valor,
  onCambio,
  onContinuar,
  onSalida,
}: {
  pregunta: Pregunta;
  valor: string;
  onCambio: (texto: string) => void;
  onContinuar: () => void;
  onSalida: () => void;
}) {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const maximo = pregunta.maximoCaracteres ?? 240;

  return (
    <div className="mt-6">
      <textarea
        rows={3}
        maxLength={maximo}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={pregunta.placeholder}
        className="w-full resize-y rounded-2xl border border-border bg-bg px-5 py-4 text-[15px] text-fg outline-none focus:border-cyan dark:focus:border-sky"
      />

      {pregunta.chips ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {pregunta.chips.map((chip) => (
            <li key={chip}>
              <button
                type="button"
                onClick={() => onCambio(valor ? `${valor} ${chip}` : chip)}
                className="rounded-full border border-border px-3.5 py-1.5 text-[13px] text-fg-muted transition-colors hover:border-cyan hover:text-fg dark:hover:border-sky"
              >
                {chip}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Boton onClick={onContinuar} tamano="lg" disabled={valor.trim().length < 3}>
          Continuar
          <IconoFlecha className="h-4 w-4" />
        </Boton>
        {pregunta.salida ? (
          <button
            type="button"
            onClick={onSalida}
            className="text-[13px] font-medium text-fg-subtle underline underline-offset-4 hover:text-fg"
          >
            {pregunta.salida.texto}
          </button>
        ) : null}
      </div>

      <p className="mt-3 flex items-center justify-between text-[12px] text-fg-subtle">
        <span>{segundos >= 18 ? "Cuando quieras, seguimos." : "\u00A0"}</span>
        <span>
          {valor.length}/{maximo}
        </span>
      </p>
    </div>
  );
}
