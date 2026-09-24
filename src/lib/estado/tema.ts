"use client";

import { atomWithStorage } from "jotai/utils";
import { atom } from "jotai";

/**
 * Estado global del tema (claro / oscuro).
 *
 * Se usa Jotai con `atomWithStorage` en lugar de manejar `localStorage` a mano:
 * la preferencia queda en un solo sitio y cualquiera puede leerla (el
 * conmutador, el script que la aplica antes del primer pintado y, más adelante,
 * la preferencia guardada en la cuenta).
 *
 * OJO CON EL FORMATO: el script de `layout.tsx` lee esta misma clave antes de
 * que React arranque, y **no** entiende JSON. Por eso se guarda en texto plano
 * (`oscuro`, no `"oscuro"`). Guardarlo con el serializador por defecto de Jotai
 * rompía el arranque: el script no reconocía el valor y el tema volvía a claro
 * en cada recarga.
 */

export type Tema = "claro" | "oscuro";

/** Almacenamiento en texto plano, compatible con el script de arranque. */
const almacenTexto = {
  getItem(clave: string, inicial: Tema): Tema {
    if (typeof window === "undefined") return inicial;
    const valor = window.localStorage.getItem(clave);
    return valor === "oscuro" || valor === "claro" ? valor : inicial;
  },
  setItem(clave: string, valor: Tema) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(clave, valor);
  },
  removeItem(clave: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(clave);
  },
  subscribe(clave: string, callback: (valor: Tema) => void) {
    if (typeof window === "undefined") return () => {};
    const escucha = (evento: StorageEvent) => {
      if (evento.key === clave && (evento.newValue === "oscuro" || evento.newValue === "claro")) {
        callback(evento.newValue);
      }
    };
    window.addEventListener("storage", escucha);
    return () => window.removeEventListener("storage", escucha);
  },
};

export const temaAtom = atomWithStorage<Tema>("cedem-tema", "claro", almacenTexto, {
  getOnInit: true,
});

/** true cuando el tema ya se leyó del almacenamiento. */
export const temaListoAtom = atom(false);

/**
 * Aplica el tema al documento. Se llama desde el conmutador y desde el efecto
 * que adopta lo que el script ya aplicó, para que la clase del `<html>` y el
 * átomo nunca se separen.
 */
export function aplicarTema(tema: Tema) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", tema === "oscuro");
  document.documentElement.dataset.tema = tema;
}
