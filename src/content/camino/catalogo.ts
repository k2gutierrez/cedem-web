/**
 * Camino del Dueño · Catálogo de apoyo.
 *
 * Dos cosas que la IA puede reescribir pero nunca inventar desde cero:
 * los artículos candidatos del archivo editorial y los ejercicios base de cada
 * arquetipo. Son la red de seguridad: si la IA falla, el dueño recibe igual una
 * lectura útil (ver `docs/05-camino-del-dueno.md`, §4.5 y §6.6).
 */

export type ArticuloCatalogo = {
  titulo: string;
  url: string;
  /** Etiquetas temáticas; el pre-filtro se hace por aquí. */
  etiquetas: string[];
};

/** Artículos del archivo de CEDEM con sus etiquetas temáticas. */
export const CATALOGO: ArticuloCatalogo[] = [
  {
    titulo: "La Dueñez hace la diferencia",
    url: "https://www.cedem.com.mx/2020/04/06/la-duenez-hace-la-diferencia/",
    etiquetas: ["rol", "duenez", "gobierno"],
  },
  {
    titulo: "Chips de Dueño y Director",
    url: "https://www.cedem.com.mx/2020/05/15/chips-de-dueno-y-director/",
    etiquetas: ["rol", "gobierno", "operador"],
  },
  {
    titulo: "Lastres del crecimiento",
    url: "https://www.cedem.com.mx/2019/08/31/lastres-del-crecimiento/",
    etiquetas: ["crecimiento", "desenfoque", "soledad", "tolerancia"],
  },
  {
    titulo: "¿Solitario yo?",
    url: "https://www.cedem.com.mx/2021/04/09/solitario-yo/",
    etiquetas: ["soledad", "equipo", "multiplicar"],
  },
  {
    titulo: "Concentración Estratégica y Creación de Valor",
    url: "https://www.cedem.com.mx/2023/04/03/empresarios-en-crecimiento-concentracion-estrategica-y-creacion-de-valor/",
    etiquetas: ["concentracion", "abandono", "generar"],
  },
  {
    titulo: "¿Qué sigue después de elegir al sucesor?",
    url: "https://www.cedem.com.mx/2025/07/14/que-sigue-despues-de-elegir-al-sucesor-actualizando-el-proceso-visionario/",
    etiquetas: ["sucesion", "vision", "gobierno"],
  },
  {
    titulo: "La decisión de la Sucesión",
    url: "https://www.cedem.com.mx/2022/12/12/la-decision-de-la-sucesion/",
    etiquetas: ["sucesion", "soltar", "rol"],
  },
  {
    titulo: "Manejo de discrepancias",
    url: "https://www.cedem.com.mx/2024/07/09/manejo-discrepancias/",
    etiquetas: ["familia", "gobierno", "conflicto"],
  },
  {
    titulo: "Caída de ventas",
    url: "https://www.cedem.com.mx/2024/05/22/caida-de-ventas/",
    etiquetas: ["generar", "mercado", "diferenciacion"],
  },
  {
    titulo: "El sueldo del Dueño",
    url: "https://www.cedem.com.mx/2022/12/12/el-sueldo-del-dueno/",
    etiquetas: ["gobierno", "propiedad", "rol"],
  },
  {
    titulo: "Perfil de Roles de Poder",
    url: "https://www.cedem.com.mx/2022/12/12/perfil-de-roles-de-poder/",
    etiquetas: ["gobierno", "multiplicar", "poder"],
  },
  {
    titulo: "Vacío de poder",
    url: "https://www.cedem.com.mx/2020/08/13/vacio-de-poder/",
    etiquetas: ["rol", "vacante", "gobierno"],
  },
  {
    titulo: "Tendencia dispersante",
    url: "https://www.cedem.com.mx/2022/12/08/tendencia-dispersante/",
    etiquetas: ["desenfoque", "concentracion"],
  },
  {
    titulo: "El desenfoque, debilitamiento competitivo",
    url: "https://www.cedem.com.mx/2019/09/28/el-desenfoque-debilitamiento-competitivo/",
    etiquetas: ["desenfoque", "generar", "mercado"],
  },
  {
    titulo: "La querencia del empresario",
    url: "https://www.cedem.com.mx/2019/08/28/la-querencia-del-empresario/",
    etiquetas: ["querencia", "multiplicar", "equipo"],
  },
  {
    titulo: "Carencia de Dueñez",
    url: "https://www.cedem.com.mx/2020/05/07/carencia-de-duenez/",
    etiquetas: ["rol", "vacante", "duenez"],
  },
  {
    titulo: "Hábitos del Dueño",
    url: "https://www.cedem.com.mx/2022/12/08/habitos-del-dueno/",
    etiquetas: ["rol", "gobierno", "duenez"],
  },
  {
    titulo: "¿Cómo descubrir talentos?",
    url: "https://www.cedem.com.mx/2023/05/30/como-descubrir-talentos/",
    etiquetas: ["equipo", "multiplicar", "talento"],
  },
  {
    titulo: "Organizaciones saludables",
    url: "https://www.cedem.com.mx/2022/12/12/organizaciones-saludables/",
    etiquetas: ["capturar", "organizacion", "alineacion"],
  },
  {
    titulo: "Sistemas de Gestión",
    url: "https://www.cedem.com.mx/2023/03/22/sistemas-de-gestion/",
    etiquetas: ["capturar", "informacion", "alineacion"],
  },
  {
    titulo: "Diseñando la Estrategia en Negocios Familiares",
    url: "https://www.cedem.com.mx/2022/12/12/disenando-la-eestrategia-en-negocios-familiares/",
    etiquetas: ["generar", "estrategia", "familia"],
  },
  {
    titulo: "El Poder de la Humildad",
    url: "https://www.cedem.com.mx/2022/12/12/el-poder-de-la-humildad/",
    etiquetas: ["equipo", "multiplicar", "querencia"],
  },
];

/** Etiquetas con las que se pre-filtran los artículos de cada arquetipo. */
export const ETIQUETAS_BASE: Record<string, string[]> = {
  gobernado: ["vision", "gobierno", "concentracion"],
  ausente: ["rol", "vacante", "gobierno"],
  sucesion_pasando: ["sucesion", "gobierno", "soltar"],
  recien_heredada: ["sucesion", "rol", "duenez"],
  carga_todo: ["soledad", "operador", "equipo"],
  sin_captura: ["capturar", "alineacion", "informacion"],
  sin_multiplicar: ["querencia", "multiplicar", "equipo"],
  sin_generar: ["generar", "mercado", "diferenciacion"],
};

/** Ejercicios por defecto de cada arquetipo (la IA los reescribe con contexto). */
export const EJERCICIOS_BASE: Record<string, { titulo: string; detalle: string }[]> = {
  gobernado: [
    {
      titulo: "Escribe las tres apuestas del año",
      detalle:
        "Una hoja, tres oportunidades, y al lado qué recursos —gente, dinero, tu tiempo— le vas a poner a cada una.",
    },
    {
      titulo: "Pregúntale a tu consejo qué NO deberías estar haciendo",
      detalle:
        "La pregunta incómoda al revés: en vez de pedir ideas nuevas, pide que te digan qué sobra.",
    },
    {
      titulo: "Fija la fecha de la siguiente revisión de tu fórmula de gobierno",
      detalle: "Lo que no tiene fecha en el calendario, no pasa.",
    },
  ],
  ausente: [
    {
      titulo: "Haz una lista de las cinco decisiones que se tomaron sin ti el mes pasado",
      detalle:
        "No para reclamarlas: para ver con claridad qué espacio del poder está ocupado por alguien más.",
    },
    {
      titulo: "Define cuáles de esas cinco te corresponden por ser dueño",
      detalle:
        "El resto se delega con gusto. Estas cinco se retoman, aunque incomode.",
    },
    {
      titulo: "Agenda una hora semanal que no sea de operación",
      detalle:
        "Solo para pensar el negocio como dueño: mercado, patrimonio, gobierno. Una hora, sin interrupciones.",
    },
  ],
  sucesion_pasando: [
    {
      titulo: "Escribe qué le toca decidir al sucesor y qué te toca a ti",
      detalle:
        "Si la lista se cruza en más de dos puntos, el proceso está a medias y eso explica el desgaste.",
    },
    {
      titulo: "Pon fecha a tu salida de la operación",
      detalle:
        "Una fecha real, aunque sea lejana. Sin fecha, el sucesor no termina de tomar fuerza y tú no terminas de soltar.",
    },
    {
      titulo: "Actualiza la visión con la siguiente generación en la mesa",
      detalle:
        "No para corregirlos: para que la visión deje de ser tuya y empiece a ser de todos.",
    },
  ],
  recien_heredada: [
    {
      titulo: "Escucha a los diez clientes más importantes sin vender nada",
      detalle:
        "Vas a encontrar el negocio real, que no siempre coincide con el que te contaron.",
    },
    {
      titulo: "Identifica quién decide hoy lo que de verdad importa",
      detalle:
        "Si la respuesta no eres tú, no es un problema de autoridad: es que el rol todavía no está ejercido.",
    },
    {
      titulo: "Elige una sola cosa que vas a cambiar este trimestre",
      detalle:
        "Una. Los cambios en paquete se leen como desconfianza hacia el equipo que te entregó la empresa.",
    },
  ],
  carga_todo: [
    {
      titulo: "Escribe todo lo que pasó por tus manos esta semana",
      detalle:
        "Sin filtrar. Después marca lo que solo tú podías hacer. La diferencia es tu problema, no tu virtud.",
    },
    {
      titulo: "Busca una persona de confianza para pensar la decisión grande",
      detalle:
        "No tiene que ser un consultor: puede ser un par, otro dueño, alguien que ya pasó por ahí.",
    },
    {
      titulo: "Elige qué vas a dejar de hacer este mes",
      detalle:
        "Una cosa, con fecha, y avisa a quien tenga que saberlo. Abandonar también se practica.",
    },
  ],
  sin_captura: [
    {
      titulo: "Define los cinco números que de verdad mueven tu negocio",
      detalle:
        "Cinco, no veinte. Y que quepan en una pantalla de celular para verlos cada lunes.",
    },
    {
      titulo: "Amarra una meta de cada área a una de tus prioridades del año",
      detalle: "Si un área no tiene meta ligada a una prioridad, está trabajando en otra cosa.",
    },
    {
      titulo: "Pregunta cuánto de lo vendido se convirtió en efectivo",
      detalle:
        "Vender no es capturar. La diferencia entre las dos cosas suele estar en la cobranza y en el inventario.",
    },
  ],
  sin_multiplicar: [
    {
      titulo: "Pregunta a tu equipo de dirección qué proyecto común defienden",
      detalle:
        "Si cada uno nombra el suyo, no hay querencia: hay cinco proyectos compitiendo por el mismo dinero.",
    },
    {
      titulo: "Revisa si tu consejo existe de verdad o solo en el acta",
      detalle: "Un consejo que no discute la estrategia es una reunión cara.",
    },
    {
      titulo: "Escribe el plan de propiedad y sucesión, aunque sea en una cuartilla",
      detalle:
        "Qué pasa con las acciones si alguien se muere, se divorcia o se quiere salir. Escrito, no hablado.",
    },
  ],
  sin_generar: [
    {
      titulo: "Pregunta a tus mejores clientes por qué te compran a ti",
      detalle:
        "Con sus palabras, no con las tuyas. Lo que digan es tu posicionamiento real.",
    },
    {
      titulo: "Explora un mercado o una zona que todavía no tocas",
      detalle:
        "No para lanzarte: para saber si tu fórmula actual aguanta otro mercado sin romperse.",
    },
    {
      titulo: "Elige una cosa que vas a abandonar para liberar recursos",
      detalle:
        "Los mejores recursos tienen que ir a las mejores oportunidades. Algo tiene que salir para que algo entre.",
    },
  ],
};

/** Elige hasta 3 artículos del catálogo según las etiquetas del arquetipo. */
export function articulosPara(etiquetas: string[], maximo = 3): ArticuloCatalogo[] {
  const puntuados = CATALOGO.map((articulo) => {
    const coincidencias = articulo.etiquetas.filter((e) => etiquetas.includes(e)).length;
    return { articulo, coincidencias };
  })
    .filter((p) => p.coincidencias > 0)
    .sort((a, b) => b.coincidencias - a.coincidencias);

  // Si no hubiera suficientes coincidencias, se completa con el archivo general
  // en lugar de devolver una lista corta.
  const elegidos = puntuados.slice(0, maximo).map((p) => p.articulo);
  if (elegidos.length < maximo) {
    for (const articulo of CATALOGO) {
      if (elegidos.length >= maximo) break;
      if (!elegidos.includes(articulo)) elegidos.push(articulo);
    }
  }
  return elegidos;
}
