/**
 * Contenido de las tres puertas de entrada.
 *
 * Todo lo verificable está tomado de fuentes primarias de CEDEM:
 * el sitio actual, el brochure del Máster con Euncet y los PDFs metodológicos.
 * Las cifras de casos son declaradas por la firma y así se presentan.
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
      "Acompañamiento de largo plazo para rediseñar la fórmula de negocio, la fórmula de gobierno y el rumbo de la empresa desde el rol del dueño. Trabajas con los socios, no con un equipo junior.",
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
      "Empresas donde el director general manda porque el dueño nunca ocupó su lugar.",
      "Quien va a enfrentar una sucesión y quiere hacerlo sin romper a la familia ni a la empresa.",
    ],
    problema: [
      {
        titulo: "El negocio va bien, pero el patrimonio no está gobernado",
        texto:
          "Crecimos atendiendo la operación y nunca definimos quién decide qué. El resultado se ve en los números, no en el sistema de gobierno.",
      },
      {
        titulo: "Las oportunidades se multiplican más rápido que los recursos",
        texto:
          "Cada nueva idea parece buena y terminamos atendiendo más frentes de los que podemos ganar. Nadie decide a qué se renuncia.",
      },
      {
        titulo: "La sucesión se posterga porque nadie sabe cuándo es el momento",
        texto:
          "El fundador quiere soltar pero no confía; el sucesor está listo pero no tiene espacio. Y el proceso se estira años.",
      },
    ],
    solucion: [
      {
        titulo: "1 · Pre-diagnóstico de 6 a 8 semanas",
        texto:
          "Antes de proponer nada, entendemos la realidad particular de la empresa: su fórmula de negocio, su estructura de poder, su dinámica familiar y sus números.",
      },
      {
        titulo: "2 · Proyecto de consultoría de 4 a 24 meses",
        texto:
          "Definimos el alcance con el dueño. No es un plan de escritorio: se ejecuta con su equipo y se ajusta con la realidad del mercado.",
      },
      {
        titulo: "3 · Un Consultor Líder como consejero personal del dueño",
        texto:
          "El Consultor Líder de CEDEM acompaña al dueño en la revisión de sus negocios y de su sistema de gobierno familiar-empresarial. Alguien con quien pensar lo que no se piensa en junta.",
      },
      {
        titulo: "4 · Se instala un consejo funcional y se vigila la estrategia",
        texto:
          "Se crea el órgano de gobierno que corresponde a la etapa de la empresa, se vigila la estrategia, se miden los avances y se fomenta el ejercicio de la Dueñez.",
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
      "El pre-diagnóstico es el primer paso. En seis a ocho semanas sabrás exactamente dónde está el valor que no estás capturando.",
  },

  pce: {
    slug: "pce",
    nombre: "PCE",
    antetitulo: "Concentración Estratégica",
    titulo: "El mismo método, al alcance de tu tamaño",
    entrada:
      "Consultoría de nivel intermedio para empresas que aún no llegan a los cinco millones de dólares. Un Consultor Senior dirige el trabajo y consultores de menor rango ejecutan la aplicación en tu negocio.",
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
      "Negocios con una buena oportunidad detectada a la que no le están dando los mejores recursos.",
      "Dueños que quieren entrar al método de CEDEM antes de poder pagar el nivel de Consulting.",
    ],
    problema: [
      {
        titulo: "Desenfoque",
        texto:
          "Conforme acumulamos éxitos, el acopio de recursos y la multiplicación de oportunidades abre un abanico de negocios, productos y mercados que parece no tener fin.",
      },
      {
        titulo: "Soledad",
        texto:
          "El dueño termina ocupando el sillón del director en solitario, y esa soledad se prolonga por años mientras no aprende a multiplicar el poder que ejerce.",
      },
      {
        titulo: "Tolerancia",
        texto:
          "El éxito nos duerme en los laureles: dejamos pasar la improductividad, el desperdicio y las omisiones porque los resultados recientes las justifican.",
      },
    ],
    solucion: [
      {
        titulo: "1 · Cada negocio como si fuera el único",
        texto:
          "Se pintan rayas: cuentas separadas, planes separados y criterios propios para cada negocio. Sin mezclar ni promediar, porque el promedio esconde al negocio malo y castiga al bueno.",
      },
      {
        titulo: "2 · Los mejores recursos a las mejores oportunidades",
        texto:
          "El mejor tiempo, la mejor gente y el mejor producto van a los mejores mercados, proyectos y clientes. Es un reacomodo continuo, no una decisión que se toma una vez.",
      },
      {
        titulo: "3 · Abandonar el resto",
        texto:
          "Lo que no fue elegido no cabe. La decisión cabal de concentración no existe si no hay abandono: es fruto del coraje y de la voluntad de crecer sin engordar.",
      },
    ],
    resultados: [
      {
        cifra: "3 postulados",
        texto:
          "Un método claro y verificable, no un diagnóstico que se queda en el cajón.",
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
          "El objetivo del taller y del acompañamiento es el camino de alta rentabilidad, no el crecimiento por volumen.",
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
      "Doce meses para formar a la siguiente generación como dueños, no solo como ejecutivos. Doble titulación europea, con semanas académicas presenciales en Miami y Barcelona.",
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
      "Miembros de la siguiente generación que necesitan criterio propio, no solo un puesto.",
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
          "La mayoría de las familias forman a sus sucesores para ser gerentes: maestrías en administración, libros de management, cursos de liderazgo. Y el rol que van a ejercer es otro.",
      },
      {
        titulo: "La sucesión se decide tarde",
        texto:
          "Cuando el proceso se vuelve urgente, ya no hay tiempo de formar: se improvisa y se pone en riesgo la continuidad de la empresa.",
      },
      {
        titulo: "Llegar al consejo sin criterio de dueño",
        texto:
          "Entrar a la mesa sin entender de valuación, gobierno, propiedad y riesgo convierte al sucesor en un espectador de las decisiones importantes.",
      },
    ],
    solucion: [
      {
        titulo: "Once módulos sobre el método de CEDEM",
        texto:
          "Estrategias de Creación de Valor · Sinergia Organizacional y Multiplicación de Valor · Alineación Estratégica y Captura de Valor · Dueñez Compartida en la Empresa Familiar · Enfoque Competitivo · Innovación · Gestión Ágil · Transformación Digital · Finanzas del Valor.",
      },
      {
        titulo: "Coaching individual y consejo consultivo",
        texto:
          "Cada participante trabaja con su coach y con un consejo consultivo de cuatro a cinco compañeros. Se discuten casos vivenciales con empresarios que ya pasaron por ahí.",
      },
      {
        titulo: "Un proyecto de creación de valor en tu propia empresa",
        texto:
          "El trabajo de fin de máster no es un ensayo: es la aplicación del método a tu empresa, con portada, tareas aplicadas y conclusiones. Se sale con algo hecho, no con apuntes.",
      },
      {
        titulo: "Semanas académicas en Miami y Barcelona",
        texto:
          "Presenciales en la University of Miami Herbert Business School y en Euncet (Terrassa, Barcelona), con visitas a empresas y networking internacional.",
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
      "El programa abre en septiembre y las plazas son limitadas. El equipo de admisiones de CEDEM puede orientarte sobre el proceso y las facilidades de pago.",
  },
};
