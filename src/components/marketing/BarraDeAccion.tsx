"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconoCerrar, IconoFlecha } from "@/components/ui/Iconos";

/**
 * Barra de acción del celular.
 *
 * POR QUÉ EXISTE
 *
 * En el celular, la llamada a la acción de la home queda a varias pantallas de
 * scroll. Esta barra aparece cuando el dueño ya pasó el hero —o sea, cuando ya
 * leyó de qué se trata— y le deja el diagnóstico a un toque. Antes de eso no se
 * muestra: un botón que persigue antes de explicar estorba.
 *
 * Se puede cerrar y no vuelve en toda la sesión (se guarda en `sessionStorage`).
 * Sólo se dibuja en pantallas chicas: en escritorio el botón del hero y el del
 * cierre están siempre a la vista, y una barra flotante sobraría.
 */

/** Rutas donde la barra no tiene sentido: ahí el dueño ya está en la acción. */
const SIN_BARRA = ["/camino", "/acceso", "/registro", "/recuperar", "/restablecer", "/invitacion"];

/** Clave con la que se recuerda, dentro de la sesión, que el dueño la cerró. */
const CLAVE_CERRADA = "cedem-barra-cerrada";

export function BarraDeAccion() {
  const ruta = usePathname();
  const [visible, setVisible] = useState(false);
  const [cerrada, setCerrada] = useState(false);

  useEffect(() => {
    /* Todo el estado se decide dentro de manejadores (scroll y primer cuadro), no
       en el cuerpo del efecto: leer el almacenamiento del navegador durante el
       render rompería la coincidencia con lo que pintó el servidor. */
    function alDesplazar() {
      if (window.scrollY <= 700) {
        setVisible(false);
        return;
      }

      let cerradaAntes = false;
      try {
        cerradaAntes = sessionStorage.getItem(CLAVE_CERRADA) === "1";
      } catch {
        /* navegador sin almacenamiento: se muestra igual */
      }

      if (cerradaAntes) {
        setCerrada(true);
        return;
      }

      setVisible(true);
    }

    const primerCuadro = requestAnimationFrame(alDesplazar);
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => {
      cancelAnimationFrame(primerCuadro);
      window.removeEventListener("scroll", alDesplazar);
    };
  }, []);

  const enRutaDeAccion = SIN_BARRA.some((p) => ruta === p || ruta.startsWith(`${p}/`));
  if (cerrada || enRutaDeAccion) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="border-t border-border bg-bg/95 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/camino"
            className="barrido inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-navy px-5 py-3 font-display text-sm font-semibold text-white dark:bg-cyan dark:text-[#04102e]"
          >
            Hacer el Camino del Dueño
            <IconoFlecha className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setCerrada(true);
              try {
                sessionStorage.setItem(CLAVE_CERRADA, "1");
              } catch {
                /* da igual: se oculta en esta vista */
              }
            }}
            aria-label="Ocultar esta barra"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-fg-subtle"
          >
            <IconoCerrar className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-fg-subtle">
          5 minutos · Gratis · Sin registro
        </p>
      </div>
    </div>
  );
}
