"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { BotonEnlace } from "@/components/ui/Boton";
import { IconoCerrar, IconoMenu } from "@/components/ui/Iconos";
import { navegacion } from "@/content/site";

/**
 * Barra de navegación: ligera, estática (sin menús desplegables) y responsive.
 * En móvil se convierte en un panel a pantalla completa.
 */
export function Navbar() {
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();

  // Cierra el panel al cambiar de página
  useEffect(() => {
    setAbierto(false);
  }, [ruta]);

  // Bloquea el scroll del fondo mientras el panel está abierto
  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  useEffect(() => {
    function alEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    window.addEventListener("keydown", alEscape);
    return () => window.removeEventListener("keydown", alEscape);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur-md">
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8"
      >
        <Link href="/" aria-label="CEDEM, ir al inicio" className="shrink-0">
          <Logo alto={30} prioridad />
        </Link>

        {/* Escritorio */}
        <ul className="hidden items-center gap-1 lg:flex">
          {navegacion.map((item) => {
            const activo = ruta === item.href || ruta.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={activo ? "page" : undefined}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    activo
                      ? "text-cyan dark:text-sky"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {item.etiqueta}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/acceso"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-fg-muted transition-colors hover:text-fg sm:block"
          >
            Entrar
          </Link>
          <BotonEnlace href="/unete" className="hidden sm:inline-flex">
            Únete
          </BotonEnlace>
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-fg-muted lg:hidden"
          >
            {abierto ? (
              <IconoCerrar className="h-5 w-5" />
            ) : (
              <IconoMenu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Panel móvil */}
      <div
        id="menu-movil"
        hidden={!abierto}
        className="border-t border-border bg-bg lg:hidden"
      >
        <ul className="mx-auto flex w-full max-w-[1200px] flex-col px-5 py-3 sm:px-8">
          {navegacion.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block border-b border-border py-3.5 font-display text-lg font-semibold text-fg"
              >
                {item.etiqueta}
              </Link>
            </li>
          ))}
          <li className="flex flex-col gap-3 py-4">
            <BotonEnlace href="/unete" tamano="lg">
              Únete a CEDEM 2.0
            </BotonEnlace>
            <BotonEnlace href="/acceso" variante="secundario" tamano="lg">
              Entrar
            </BotonEnlace>
          </li>
        </ul>
      </div>
    </header>
  );
}
