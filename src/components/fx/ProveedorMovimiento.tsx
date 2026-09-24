"use client";

import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";

/**
 * Configuración del movimiento y los avisos de toda la aplicación.
 *
 * DOS COSAS QUE SE DECIDEN AQUÍ Y NO EN CADA COMPONENTE
 *
 * 1 · `reducedMotion="user"` — si el sistema operativo pide menos movimiento
 *     (accesibilidad, mareos, batería), `motion` desactiva las animaciones por su
 *     cuenta. Es la forma de cumplir la norma sin llenar el código de
 *     comprobaciones.
 *
 * 2 · El `Toaster` de sonner — un solo sitio para los avisos de la plataforma.
 *     Se usa para confirmar acciones (guardado, descarga, cambio de rol) y para
 *     errores que antes se perdían en un párrafo. Se apoya en los tokens de marca
 *     para que el aviso se vea de CEDEM y no de una librería.
 */
export function ProveedorMovimiento({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}

      <Toaster
        position="bottom-right"
        closeButton
        richColors={false}
        toastOptions={{
          className:
            "!rounded-2xl !border !border-border !bg-bg !text-fg !font-sans !shadow-[0_18px_50px_-22px_rgba(15,32,108,0.35)]",
          descriptionClassName: "!text-fg-muted !text-[13px]",
          classNames: {
            title: "!font-display !font-semibold !text-[14px]",
            actionButton: "!bg-navy !text-white !rounded-full !font-display !text-[13px]",
            cancelButton: "!border !border-border !text-fg-muted !rounded-full !text-[13px]",
            closeButton: "!bg-bg !border !border-border !text-fg-muted",
          },
        }}
      />
    </MotionConfig>
  );
}
