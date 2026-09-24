import type { NextConfig } from "next";
import redirecciones from "./src/lib/redirecciones.json";

const nextConfig: NextConfig = {
  /**
   * El indicador flotante de desarrollo tapa contenido en las capturas de
   * verificación visual (y en móvil se superpone a las cifras del hero).
   * Los errores de compilación y de ejecución se siguen mostrando.
   */
  devIndicators: false,

  /**
   * Redirecciones permanentes desde el sitio anterior.
   *
   * El mapa lo genera `scripts/generar-redirecciones.mjs` a partir de la URL
   * original que se guardó con cada artículo migrado. Sin esto, al apuntar el
   * dominio al sitio nuevo se perderían seis años de posicionamiento y todos los
   * enlaces que la gente ya compartió.
   */
  async redirects() {
    return redirecciones.map((r) => ({
      source: r.source,
      destination: r.destination,
      permanent: true,
    }));
  },
};

export default nextConfig;
