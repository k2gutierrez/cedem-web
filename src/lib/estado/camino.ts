"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { Respuestas } from "@/lib/camino/puntuar";

/**
 * Estado del Camino del Dueño.
 *
 * Vive en átomos y no en el componente por dos razones concretas:
 *
 *  · **Persistencia sin código a mano.** `atomWithStorage` guarda el avance en el
 *    dispositivo y lo devuelve al volver. Antes eso era un `useEffect` que
 *    escribía y leía `localStorage`; aquí es una línea y no se puede olvidar.
 *  · **El recorrido puede crecer.** Si mañana el Camino se parte en varias rutas
 *    o se añade una pantalla fuera del componente, el estado ya está compartido.
 *
 * Lo que NO se persiste: el contacto (nombre, correo, WhatsApp). Son datos
 * personales y no tienen por qué quedar en el dispositivo de cualquiera.
 */

export const pasoAtom = atomWithStorage("cedem-camino-paso", 0, undefined, {
  getOnInit: true,
});

export const respuestasAtom = atomWithStorage<Respuestas>(
  "cedem-camino-respuestas",
  {},
  undefined,
  { getOnInit: true },
);

export const modoAtom = atomWithStorage<"normal" | "express">(
  "cedem-camino-modo",
  "normal",
  undefined,
  { getOnInit: true },
);

/** Segundos acumulados de recorrido, para medir la duración real. */
export const segundosAtom = atom(0);

/** Momento en que empezó el recorrido (en memoria: no tiene sentido persistirlo). */
export const inicioAtom = atom<number | null>(null);

/** Comentario libre y datos de contacto: en memoria, nunca en el dispositivo. */
export const comentarioAtom = atom("");
export const contactoAtom = atom({ nombre: "", correo: "", whatsapp: "" });
export const canalAtom = atom<"correo" | "whatsapp">("correo");
export const consentimientoAtom = atom(false);

/** Identificador de la sesión guardada, para pedir la lectura con IA. */
export const sessionIdAtom = atom<string | undefined>(undefined);

/** ¿Hay un recorrido a medias que se pueda retomar? */
export const hayProgresoAtom = atom((get) => {
  const paso = get(pasoAtom);
  return paso > 0;
});

/** Borra todo el avance guardado. */
export const reiniciarAtom = atom(null, (_get, set) => {
  set(pasoAtom, 0);
  set(respuestasAtom, {});
  set(modoAtom, "normal");
  set(segundosAtom, 0);
  set(inicioAtom, null);
  set(comentarioAtom, "");
  set(contactoAtom, { nombre: "", correo: "", whatsapp: "" });
  set(consentimientoAtom, false);
  set(sessionIdAtom, undefined);
});
