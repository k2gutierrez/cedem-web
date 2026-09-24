import type { MetadataRoute } from "next";

/**
 * Reglas para los rastreadores.
 *
 * El sitio público se abre completo: es el escaparate de la firma y de los 186
 * artículos del archivo. La plataforma, el acceso y las invitaciones se cierran:
 * no aportan nada en resultados de búsqueda y algunas llevan datos de personas.
 */

const BASE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.cedem.com.mx";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/app",
          "/app/",
          "/acceso",
          "/registro",
          "/invitacion/",
          "/api/",
          // Las búsquedas internas generan infinitas URLs con el mismo contenido.
          "/recursos?q=",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
