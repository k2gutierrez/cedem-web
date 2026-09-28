"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconoDescarga } from "@/components/ui/Iconos";
import type { DatosObservacion } from "@/lib/pdf/observacion";

/**
 * Descarga la observación en PDF.
 *
 * El generador de PDF se carga SÓLO al hacer clic (importación dinámica): son
 * cientos de kilobytes que no tienen por qué viajar con la página para alguien
 * que nunca va a descargar el documento.
 *
 * Si algo falla, se avisa y no se deja al dueño con un botón que no responde:
 * puede imprimir la página o pedirle el documento al equipo.
 */
export function DescargarObservacion({
  datos,
  className = "",
}: {
  datos: DatosObservacion;
  className?: string;
}) {
  const [generando, setGenerando] = useState(false);

  async function descargar() {
    setGenerando(true);
    try {
      const { generarPdfObservacion } = await import("@/lib/pdf/observacion");
      const bytes = await generarPdfObservacion(datos);

      // `slice()` devuelve un ArrayBuffer propio: sin él, TypeScript tipa el
      // buffer como posiblemente compartido y el Blob no compila.
      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      const nombre = datos.nombre.trim().split(/\s+/)[0] || "Camino";
      enlace.href = url;
      enlace.download = `CEDEM-Camino-del-Dueno-${nombre}.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      // Se libera en el siguiente ciclo: revocar de inmediato cancela la descarga
      // en algunos navegadores.
      setTimeout(() => URL.revokeObjectURL(url), 4000);

      toast.success("Tu observación se está descargando.");
    } catch (error) {
      console.error("[pdf] no se pudo generar la observación:", error);
      toast.error("No pudimos armar el PDF. Intenta de nuevo o escríbenos.");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={descargar}
      disabled={generando}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-border-strong px-6 py-3 font-display text-sm font-semibold text-fg transition-colors hover:border-cyan hover:text-cyan disabled:opacity-60 dark:hover:border-sky dark:hover:text-sky ${className}`}
    >
      <IconoDescarga className="h-4 w-4" />
      {generando ? "Armando el PDF…" : "Descargar en PDF"}
    </button>
  );
}
