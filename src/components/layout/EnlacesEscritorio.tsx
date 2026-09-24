"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { navegacion } from "@/content/site";

/**
 * Los enlaces de escritorio, con el indicador que se desliza.
 *
 * El detalle que hace que la barra se sienta viva sin ruido: la pastilla del
 * enlace activo no aparece y desaparece, se mueve de uno a otro con un muelle
 * corto (`layoutId` compartido). Es un solo elemento que viaja, así que no hay
 * saltos ni parpadeos.
 *
 * En móvil esta lista no se muestra: ahí manda el panel desplegable.
 */
export function EnlacesEscritorio() {
  const ruta = usePathname();
  const reducido = useReducedMotion();

  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {navegacion.map((item) => {
        const activo = ruta === item.href || ruta.startsWith(`${item.href}/`);

        return (
          <li key={item.href} className="relative">
            <Link
              href={item.href}
              aria-current={activo ? "page" : undefined}
              className={`relative block rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                activo ? "text-navy dark:text-white" : "text-fg-muted hover:text-fg"
              }`}
            >
              {activo ? (
                <motion.span
                  aria-hidden="true"
                  layoutId="nav-activo"
                  className="absolute inset-0 -z-10 rounded-full bg-sky/25 dark:bg-sky/20"
                  transition={
                    reducido
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 380, damping: 32 }
                  }
                />
              ) : null}
              {item.etiqueta}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
