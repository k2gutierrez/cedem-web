import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * El indicador flotante de desarrollo tapa contenido en las capturas de
   * verificación visual (y en móvil se superpone a las cifras del hero).
   * Los errores de compilación y de ejecución se siguen mostrando.
   */
  devIndicators: false,
};

export default nextConfig;
