"use client";

import { useEffect, useState } from "react";
import { IconoLuna, IconoSol } from "@/components/ui/Iconos";

/**
 * Alterna entre modo claro y oscuro y guarda la preferencia.
 * El tema inicial lo aplica el script del layout antes del primer pintado,
 * así que aquí solo se lee lo que ya está puesto.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [oscuro, setOscuro] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setOscuro(document.documentElement.classList.contains("dark"));
    setMontado(true);
  }, []);

  function alternar() {
    const siguiente = !oscuro;
    setOscuro(siguiente);
    document.documentElement.classList.toggle("dark", siguiente);
    document.documentElement.dataset.tema = siguiente ? "oscuro" : "claro";
    try {
      localStorage.setItem("cedem-tema", siguiente ? "oscuro" : "claro");
    } catch {
      /* modo privado del navegador: se ignora */
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className={`grid h-9 w-9 place-items-center rounded-full border border-border text-fg-muted transition-colors hover:border-cyan hover:text-cyan dark:hover:border-sky dark:hover:text-sky ${className}`}
    >
      {montado && oscuro ? (
        <IconoSol className="h-[18px] w-[18px]" />
      ) : (
        <IconoLuna className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
