import { HaloCursor, ProgresoLectura } from "@/components/fx/Efectos";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

/**
 * Marco del sitio público.
 *
 * Aquí se montan los dos efectos que acompañan a toda la navegación: la barra de
 * progreso de lectura (arriba, fina) y el halo que sigue al cursor. Los dos son
 * decorativos y se apagan solos en pantallas táctiles o si el sistema pide menos
 * movimiento; por eso viven en el marco y no en cada página.
 */
export default function LayoutPublico({ children }: LayoutProps<"/">) {
  return (
    <>
      <ProgresoLectura />
      <HaloCursor />
      <Navbar />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
    </>
  );
}
