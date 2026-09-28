/**
 * Contenido de las tres puertas de entrada.
 *
 * Todo lo verificable está tomado de fuentes primarias de CEDEM:
 * el sitio actual, el brochure del Máster con Euncet y los PDFs metodológicos.
 * Las cifras de casos son declaradas por la firma y así se presentan.
 *
 * Regla de redacción: bloques de máximo tres ideas y párrafos de máximo 220
 * caracteres. Cada bloque abre con la tensión del dueño y cierra con una promesa
 * concreta. El visitante tiene 40 años o más: frases cortas, cero relleno.
 */

export type Servicio = {
  slug: string;
  nombre: string;
  antetitulo: string;
  titulo: string;
  entrada: string;
  segmento: string;
  datosClave: { etiqueta: string; valor: string }[];
  paraQuien: string[];
  noEsParaQuien?: string[];
  problema: { titulo: string; texto: string }[];
  solucion: { titulo: string; texto: string }[];
  resultados: { cifra: string; texto: string; fuente: string }[];
  testimonio?: { texto: string; autor: string; cargo: string };
  ctaTitulo: string;
  ctaTexto: string;
};

export const serviciosDetalle: Record<string, Servicio> = {
  consulting: {
    slug: "consulting",
    nombre: "Consulting",
    antetitulo: "El nivel más alto de la firma",
    titulo: "Asesoría directa con los socios de CEDEM",
    entrada:
      "Aquí no te atiende un equipo junior: trabajas con los socios. Rediseñamos contigo la fórmula de negocio y la de gobierno, desde tu rol de dueño.",
    segmento: "Para empresas desde 5 millones de dólares de ventas anuales",
    datosClave: [
      { etiqueta: "Pre-diagnóstico", valor: "6 a 8 semanas" },
      { etiqueta: "Proyecto", valor: "4 a 24 meses" },
      { etiqueta: "Con quién", valor: "Socios y Consultor Líder" },
      { etiqueta: "Frecuencia", valor: "Sesiones, retiros y consejo" },
    ],
    paraQuien: [
      "El dueño que ya validó su negocio y creció, pero perdió el control del rumbo.",
      "Grupos familiares con varias generaciones que necesitan gobernarse, no solo administrarse.",
      "Quien va a enfrentar una sucesión y quiere hacerlo sin romper a la familia ni a la empresa.",
    ],
    problema: [
      {
        titulo: "El negocio va bien, pero el patrimonio no está gobernado",
        texto:
          "Creciste atendiendo la operación y nunca definiste quién decide qué. Se ve en los números, no en un sistema de gobierno.",
      },
      {
        titulo: "Las oportunidades se multiplican más rápido que los recursos",
        texto:
          "Cada idea nueva parece buena y acabas atendiendo más frentes de los que puedes ganar. Nadie decide a qué renuncias.",
      },
      {
        titulo: "La sucesión se posterga porque nadie sabe cuándo es el momento",
        texto:
          "El fundador quiere soltar pero no confía; el sucesor está listo pero no tiene espacio. Así pasan años.",
      },
    ],
    solucion: [
      {
        titulo: "Pre-diagnóstico de 6 a 8 semanas",
        texto:
          "Antes de proponerte nada entendemos tu fórmula de negocio, tu estructura de poder, tu dinámica familiar y tus números.",
      },
      {
        titulo: "Un Consultor Líder como tu consejero",
        texto:
          "Alguien con quien pensar lo que no se piensa en junta. Revisa contigo tus negocios y tu gobierno familiar-empresarial.",
      },
      {
        titulo: "Un consejo que vigila la estrategia",
        texto:
          "Instalamos el órgano de gobierno que corresponde a tu etapa, medimos avances y ejercemos contigo el rol de dueño.",
      },
    ],
    resultados: [
      {
        cifra: "20 → 250 MDD",
        texto: "Crecimiento de Grupo Caffenio en 21 años de acompañamiento.",
        fuente: "Declarado por CEDEM",
      },
      {
        cifra: "×4 ventas",
        texto:
          "Grupo D'portenis cuadruplicó sus ventas en 10 años tras rediseñar su Fórmula de Gobierno.",
        fuente: "Declarado por CEDEM y la empresa",
      },
      {
        cifra: "17 → 1,000+ MDD",
        texto: "Crecimiento de Sukarne en 25 años.",
        fuente: "Declarado por CEDEM",
      },
    ],
    testimonio: {
      texto:
        "Con CEDEM rediseñamos nuestra Fórmula de Gobierno exitosamente. En 10 años logramos cuadruplicar las ventas y ejercer el verdadero Rol de Dueño.",
      autor: "Alán Smithers",
      cargo: "Presidente, IFA Celtics",
    },
    ctaTitulo: "¿Es Consulting el nivel que tu empresa necesita?",
    ctaTexto:
      "El pre-diagnóstico es el primer paso. En seis a ocho semanas sabrás dónde está el valor que no estás capturando.",
  },

  pce: {
    slug: "pce",
    nombre: "PCE",
    antetitulo: "Concentración Estratégica",
    titulo: "El mismo método, al alcance de tu tamaño",
    entrada:
      "Aún no llegas a los cinco millones de dólares y no por eso vas a trabajar con juniors. Un Consultor Senior dirige el trabajo y su equipo lo aplica en tu negocio.",
    segmento: "Para empresas por debajo de 5 millones de dólares de ventas anuales",
    datosClave: [
      { etiqueta: "Quién dirige", valor: "Consultor Senior" },
      { etiqueta: "Quién aplica", valor: "Equipo de consultores" },
      { etiqueta: "Enfoque", valor: "Concentración Estratégica" },
      { etiqueta: "Objetivo", valor: "Alta rentabilidad" },
    ],
    paraQuien: [
      "El dueño que hace de todo y sabe que necesita enfocarse, pero no sabe en qué.",
      "Empresas rentables que se dispersaron abriendo líneas, productos o mercados de más.",
      "Negocios con una buena oportunidad a la que no le están dando sus mejores recursos.",
    ],
    problema: [
      {
        titulo: "Desenfoque",
        texto:
          "Conforme acumulas éxitos se abren negocios, productos y mercados que parecen no tener fin. Y los atiendes todos a la vez.",
      },
      {
        titulo: "Soledad",
        texto:
          "Acabas ocupando el sillón del director en solitario, y esa soledad se prolonga años mientras no multiplicas tu poder.",
      },
      {
        titulo: "Tolerancia",
        texto:
          "El éxito duerme: dejas pasar la improductividad y el desperdicio porque los resultados recientes los justifican.",
      },
    ],
    solucion: [
      {
        titulo: "Cada negocio como si fuera el único",
        texto:
          "Cuentas, planes y criterios separados para cada negocio. El promedio esconde al malo y castiga al bueno.",
      },
      {
        titulo: "Los mejores recursos a las mejores oportunidades",
        texto:
          "Tu mejor tiempo, tu mejor gente y tu mejor producto van a los mejores mercados. Es un reacomodo continuo.",
      },
      {
        titulo: "Abandonar el resto",
        texto:
          "Lo que no elegiste no cabe. Sin abandono no hay concentración: hay coraje o hay dispersión.",
      },
    ],
    resultados: [
      {
        cifra: "3 postulados",
        texto: "Un método claro y verificable, no un diagnóstico que se queda en el cajón.",
        fuente: "Metodología CEDEM",
      },
      {
        cifra: "2 niveles",
        texto:
          "Un Consultor Senior supervisa cada cuenta, sin excepción, con un equipo que aplica.",
        fuente: "Modelo de intervención CEDEM",
      },
      {
        cifra: "Alta rentabilidad",
        texto:
          "El objetivo es el camino de alta rentabilidad, no el crecimiento por volumen.",
        fuente: "Taller Concentración Estratégica, 2025",
      },
    ],
    ctaTitulo: "Deja de atender más frentes de los que puedes ganar",
    ctaTexto:
      "Empezamos identificando cuál es tu mejor oportunidad vigente y qué hay que abandonar para perseguirla en serio.",
  },

  master: {
    slug: "master",
    nombre: "Máster",
    antetitulo: "Con Euncet Business School · UPC",
    titulo: "Máster en Innovación y Emprendimiento en la Empresa Familiar",
    entrada:
      "Doce meses para que la siguiente generación llegue como dueña, no solo como ejecutiva. Doble titulación europea, con semanas en Miami y Barcelona.",
    segmento: "Dirigido a sucesores y miembros de la siguiente generación",
    datosClave: [
      { etiqueta: "Duración", valor: "12 meses · 60 ECTS" },
      { etiqueta: "Modalidad", valor: "Online con streaming" },
      { etiqueta: "Titulación", valor: "Euncet + UPC" },
      { etiqueta: "Semanas", valor: "Miami y Barcelona" },
    ],
    paraQuien: [
      "Sucesores que van a recibir la estafeta y quieren llegar preparados.",
      "Hijos e hijas de dueños que hoy son ejecutivos y mañana serán propietarios.",
      "Familias que quieren formar a su relevo antes de que la sucesión sea urgente.",
    ],
    noEsParaQuien: [
      "Quien busca un MBA tradicional: aquí se forma el rol de dueño, no el de directivo.",
      "Quien quiere solo contenidos: el programa exige aplicar un proyecto real en su empresa.",
    ],
    problema: [
      {
        titulo: "Se forman ejecutivos, no dueños",
        texto:
          "Las familias forman a sus sucesores para ser gerentes: maestrías, libros de management, cursos de liderazgo. El rol que van a ejercer es otro.",
      },
      {
        titulo: "La sucesión se decide tarde",
        texto:
          "Cuando el proceso se vuelve urgente ya no hay tiempo de formar: se improvisa y se pone en riesgo la continuidad.",
      },
      {
        titulo: "Llegar al consejo sin criterio de dueño",
        texto:
          "Sin entender de valuación, gobierno, propiedad y riesgo, el sucesor acaba de espectador en las decisiones que importan.",
      },
    ],
    solucion: [
      {
        titulo: "Un proyecto de creación de valor en tu empresa",
        texto:
          "El trabajo de fin de máster no es un ensayo: aplicas el método a tu empresa. Sales con algo hecho, no con apuntes.",
      },
      {
        titulo: "Coaching individual y consejo consultivo",
        texto:
          "Cada participante trabaja con su coach y con un consejo de cuatro a cinco compañeros. Casos vivenciales de quien ya pasó por ahí.",
      },
      {
        titulo: "Semanas académicas en Miami y Barcelona",
        texto:
          "Presenciales en la University of Miami Herbert Business School y en Euncet, con visitas a empresas y networking internacional.",
      },
    ],
    resultados: [
      {
        cifra: "9,56 / 10",
        texto: "Satisfacción declarada de los estudiantes del programa.",
        fuente: "Brochure oficial 2026-2027",
      },
      {
        cifra: "Doble título",
        texto:
          "Título propio de Euncet Business School y título propio reconocido por la UPC.",
        fuente: "Brochure oficial 2026-2027",
      },
      {
        cifra: "184 horas",
        texto: "Repartidas en 60 ECTS a lo largo de doce meses.",
        fuente: "Brochure oficial 2026-2027",
      },
    ],
    testimonio: {
      texto:
        "Entendí que mi función como Dueño va más allá de la operación del negocio.",
      autor: "Óscar Sánchez",
      cargo: "CEO, Grupo D'portenis",
    },
    ctaTitulo: "Forma a tu sucesor antes de que sea urgente",
    ctaTexto:
      "El programa abre en septiembre y las plazas son limitadas. Admisiones te orienta sobre el proceso y las facilidades de pago.",
  },
};
