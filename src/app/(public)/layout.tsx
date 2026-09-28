import { HaloCursor, ProgresoLectura } from "@/components/fx/Efectos";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { BarraDeAccion } from "@/components/marketing/BarraDeAccion";

/**
 * Marco del sitio público.
 *
 * Aquí se montan los efectos que acompañan a toda la navegación: la barra de
 * progreso de lectura (arriba, fina), el halo que sigue al cursor y la barra de
 * acción del celular. Los tres son decorativos o complementarios y se apagan solos
 * en pantallas táctiles, si el sistema pide menos movimiento, o si el dueño ya
 * está en una ruta de acción; por eso viven en el marco y no en cada página.
 */
export default function LayoutPublico({ children }: LayoutProps<"/">) {
  return (
    <>
      <ProgresoLectura />
      <HaloCursor />
      <Navbar />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
      <BarraDeAccion />
    </>
  );
}
