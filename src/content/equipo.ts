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
