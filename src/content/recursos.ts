/**
 * Contenido de la página de Recursos.
 *
 * Los webinars son la serie real que CEDEM publicó en su canal; los artículos
 * viven en src/content/site.ts (articulosDestacados) y la biblioteca de miembros
 * son los PDFs metodológicos que la firma ya tiene.
 * Todavía no hay podcasts: la página lo dice en lugar de inventar episodios.
 */

/** Mismo canal que en `redes` de site.ts. */
export const canalYouTube = "https://www.youtube.com/@cedemcentrodeduenez";

export const serieWebinars = "El Rol de Dueño en Tiempos de Incertidumbre";

export type Webinar = {
  titulo: string;
  duracion: string;
};

export const webinars: readonly Webinar[] = [
  { titulo: "La Dueñez hace la diferencia", duracion: "1:02:11" },
  { titulo: "Dueñez Liderazgo en la Cima", duracion: "1:08:03" },
  { titulo: "Estrategia de Enfoque Competitivo", duracion: "1:02:22" },
  { titulo: "Viraje Estratégico: Cambiar o Morir", duracion: "1:06:58" },
  { titulo: "Mejora Discontinua", duracion: "1:07:00" },
  { titulo: "Súper-Flexibilidad", duracion: "1:05:35" },
  { titulo: "El Talento: Concepto vs. Estrategia", duracion: "1:04:44" },
  { titulo: "El Optimismo de la Dueñez", duracion: "1:20:59" },
];

/** La biblioteca que se abre al entrar a CEDEM 2.0. */
export const bibliotecaMiembros = {
  documentos: 11,
  texto:
    "Once documentos metodológicos de CEDEM en PDF, descargables: los marcos con los que se aplica el método en la empresa.",
} as const;
