"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Navegación de la plataforma.
 *
 * QUÉ FALTABA
 *
 * Las pestañas no marcaban en cuál estabas: ninguna llevaba `aria-current`, así
 * que ni el lector de pantalla ni el ojo sabían dónde se estaba. Con ocho
 * secciones de administración, eso se nota.
 *
 * Ahora la activa se marca y el subrayado se desliza de una a otra con un muelle
 * corto (un solo elemento que viaja, igual que en el menú del sitio público). Y si
 * la pestaña activa queda fuera de la vista en un teléfono, se desplaza sola para
 * que aparezca: quien entra a «Auditoría» desde un enlace no tiene que buscarla.
 */
export function EnlacesPlataforma({
  enlaces,
}: {
  enlaces: { etiqueta: string; href: string }[];
}) {
  const ruta = usePathname();
  const reducido = useReducedMotion();
  const contenedor = useRef<HTMLElement>(null);
  const activo = useRef<HTMLAnchorElement>(null);

  /** La sección activa es la coincidencia más larga, para que `/app/admin/contenido/nuevo`
   *  marque «Contenido» y no «Mi panel». */
  const actual = enlaces
    .filter((e) => ruta === e.href || ruta.startsWith(`${e.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  useEffect(() => {
    const el = activo.current;
    const caja = contenedor.current;
    if (!el || !caja) return;

    // Solo se desplaza si de verdad quedó fuera: mover la barra sin necesidad
    // desorienta más de lo que ayuda.
    const sobraIzquierda = el.offsetLeft < caja.scrollLeft;
    const sobraDerecha = el.offsetLeft + el.offsetWidth > caja.scrollLeft + caja.clientWidth;
    if (sobraIzquierda || sobraDerecha) {
      caja.scrollTo({
        left: el.offsetLeft - 24,
        behavior: reducido ? "auto" : "smooth",
      });
    }
  }, [actual, reducido]);

  return (
    <nav
      ref={contenedor}
      aria-label="Navegación de la plataforma"
      className="-mb-px flex gap-1 overflow-x-auto"
    >
      {enlaces.map((enlace) => {
        const esActual = enlace.href === actual;

        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            ref={esActual ? activo : undefined}
            aria-current={esActual ? "page" : undefined}
            className={`relative whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors ${
              esActual ? "text-fg" : "text-fg-muted hover:text-fg"
            }`}
          >
            {enlace.etiqueta}
            {esActual ? (
              <motion.span
                aria-hidden="true"
                layoutId="plataforma-activa"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-cyan to-sky"
                transition={
                  reducido ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }
                }
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
