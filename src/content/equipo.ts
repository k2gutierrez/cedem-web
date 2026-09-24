/**
 * El equipo de CEDEM.
 *
 * Los nombres y los cargos son los de la lista verificada con la firma.
 * NO se publican fotografías: las que existen son de baja resolución. Mientras
 * CEDEM no entregue los originales, cada persona se presenta con su avatar de
 * iniciales sobre navy (ver src/components/marketing/AvatarIniciales.tsx).
 */

export type Persona = {
  nombre: string;
  cargo: string;
};

export type AreaEquipo = {
  titulo: string;
  descripcion: string;
  personas: readonly Persona[];
};

export const equipo: readonly AreaEquipo[] = [
  {
    titulo: "Socios y consejo",
    descripcion: "Los fundadores, el consejo y los socios consultores que responden por la firma.",
    personas: [
      { nombre: "Carlos A. Dumois", cargo: "Presidente y Socio Fundador" },
      { nombre: "Guillermo Gutiérrez", cargo: "Fundador y Socio Consejero" },
      { nombre: "Francisco Baumgarten", cargo: "Co-Fundador y Socio Consejero" },
      { nombre: "Alfonso Orozco", cargo: "Miembro del Consejo y Socio Consultor" },
      { nombre: "Guillermo Estrada", cargo: "Socio Consultor" },
      { nombre: "Eduardo Martínez", cargo: "Socio Consultor" },
    ],
  },
  {
    titulo: "Consultores",
    descripcion: "Quienes aplican el método en cada empresa, con un senior supervisando cada cuenta.",
    personas: [
      { nombre: "Baltazar Madrid", cargo: "Consultor" },
      { nombre: "Alfonso Pompa", cargo: "Consultor" },
      { nombre: "Juan Carlos Ruvalcaba", cargo: "Consultor" },
      { nombre: "Javier Baquerizo", cargo: "Consultor" },
      { nombre: "Eduardo Musi", cargo: "Consultor" },
    ],
  },
  {
    titulo: "Dirección y coordinación",
    descripcion: "La dirección de la firma y la coordinación de los proyectos.",
    personas: [
      { nombre: "Carlos Dumois López", cargo: "Director General" },
      { nombre: "Lorena Espinoza", cargo: "Directora de Desarrollo Tecnológico" },
      { nombre: "Laura Niebla", cargo: "Directora Comercial" },
      { nombre: "Ildefonso Aviléz", cargo: "Director Regional" },
      { nombre: "Galia Gil", cargo: "Coordinadora de Consultoría" },
      { nombre: "Mónica Osorio", cargo: "Coordinadora de Proyectos" },
      { nombre: "Elsa Abarca", cargo: "Coordinadora de Proyectos" },
      { nombre: "Carlos Gutiérrez", cargo: "Coordinador de Proyectos" },
      { nombre: "David Nelson", cargo: "Coordinador de Proyectos" },
    ],
  },
];

/** El claustro del Máster que CEDEM imparte con Euncet Business School (UPC). */
export const claustroMaster = {
  docentes: 19,
  instituciones: [
    "Euncet Business School",
    "Strategyzer",
    "Mobile World Capital Barcelona",
    "Trend Watching",
  ],
} as const;

/**
 * Áreas del equipo.
 *
 * El contenido semilla de arriba es el respaldo: se usa mientras la base de
 * datos no tenga consultores registrados. En cuanto el administrador carga al
 * equipo desde el panel, esa información manda.
 */
export function agruparEnAreas(
  personas: { nombre: string; cargo: string }[],
): AreaEquipo[] {
  const socios: Persona[] = [];
  const consultores: Persona[] = [];
  const direccion: Persona[] = [];

  for (const persona of personas) {
    const cargo = persona.cargo.toLowerCase();
    if (cargo.includes("fundador") || cargo.includes("consejo") || cargo.includes("socio")) {
      socios.push(persona);
    } else if (cargo.includes("coordinador") || cargo.includes("director")) {
      // Esta comprobación va antes que "consultor" a propósito: una
      // "coordinadora de consultoría" coordina el trabajo, no lo aplica en las
      // empresas, y su lugar es la dirección.
      direccion.push(persona);
    } else if (cargo.includes("consultor")) {
      consultores.push(persona);
    } else {
      direccion.push(persona);
    }
  }

  return [
    {
      titulo: "Socios y consejo",
      descripcion:
        "Los fundadores, el consejo y los socios consultores que responden por la firma.",
      personas: socios,
    },
    {
      titulo: "Consultores",
      descripcion:
        "Quienes aplican el método en cada empresa, con un senior supervisando cada cuenta.",
      personas: consultores,
    },
    {
      titulo: "Dirección y coordinación",
      descripcion: "La dirección de la firma y la coordinación de los proyectos.",
      personas: direccion,
    },
  ].filter((area) => area.personas.length > 0);
}
