"use client";

import { useAtom } from "jotai";
import { useEffect } from "react";
import { IconoLuna, IconoSol } from "@/components/ui/Iconos";
import { aplicarTema, temaAtom, temaListoAtom } from "@/lib/estado/tema";

/**
 * Conmutador de tema.
 *
 * El tema vive en un átomo con persistencia (Jotai), no en `localStorage` a mano.
 *
 * Detalle importante del arranque: el script del layout aplica el tema **antes
 * del primer pintado** para que no haya destello, y lo hace sin pasar por el
 * átomo. Por eso, al montar, se adopta lo que el documento ya tiene puesto: si
 * no, el átomo creería que el tema es el de por defecto y el botón diría lo
 * contrario de lo que se ve.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [tema, setTema] = useAtom(temaAtom);
  const [listo, setListo] = useAtom(temaListoAtom);

  useEffect(() => {
    const aplicado = document.documentElement.classList.contains("dark")
      ? "oscuro"
      : "claro";
    if (aplicado !== tema) setTema(aplicado);
    setListo(true);
    // Solo al montar: después manda el átomo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const oscuro = tema === "oscuro";

  /**
   * La etiqueta depende de `listo` para que el HTML del servidor y el primer
   * render del cliente coincidan. Sin esto, React avisa de un desajuste de
   * hidratación: el servidor no puede saber qué tema eligió la persona.
   */
  const etiqueta = !listo
    ? "Cambiar de tema"
    : oscuro
      ? "Cambiar a modo claro"
      : "Cambiar a modo oscuro";

  return (
    <button
      type="button"
      onClick={() => {
        const siguiente = oscuro ? "claro" : "oscuro";
        setTema(siguiente);
        aplicarTema(siguiente);
      }}
      aria-label={etiqueta}
      title={listo && oscuro ? "Modo claro" : "Modo oscuro"}
      className={`grid h-9 w-9 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-cyan hover:text-cyan dark:hover:border-sky dark:hover:text-sky ${className}`}
    >
      {listo && oscuro ? (
        <IconoSol className="h-[18px] w-[18px]" />
      ) : (
        <IconoLuna className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
