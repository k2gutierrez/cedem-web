/**
 * Contenido del sitio.
 *
 * NOTA DE ARQUITECTURA: en la Fase 2 todo esto se lee de Supabase para que el
 * nivel `admin` lo alimente sin programadores. Estos valores son la semilla
 * verificada con la que se construye y se revisa el diseño.
 */

export const navegacion = [
  { etiqueta: "El Camino", href: "/camino" },
  { etiqueta: "Consulting", href: "/consulting" },
  { etiqueta: "PCE", href: "/pce" },
  { etiqueta: "Máster", href: "/master" },
  { etiqueta: "Recursos", href: "/recursos" },
  { etiqueta: "Equipo", href: "/equipo" },
  { etiqueta: "Nosotros", href: "/nosotros" },
] as const;

export const sedes = [
  {
    nombre: "CEDEM, México",
    direccion: "Av. San Francisco 3601, Jardines de San Ignacio, 45040 Zapopan, Jalisco.",
    mapa: "https://goo.gl/maps/G89F7KrDnPwdiR166",
  },
  {
    nombre: "BOC Business Owner Consulting · Miami",
    direccion: "815 NW 57th Ave, Miami, FL 33126, United States.",
    mapa: "https://goo.gl/maps/4SBPagCPwhm4wqQX8",
  },
  {
    nombre: "BOC Business Owner Consulting · Houston",
    direccion: "1776 Yorktown St, Suite 510, Houston, TX 77056.",
    mapa: "https://goo.gl/maps/XDZWW8fha8MaMK2w5",
  },
] as const;

export const redes = [
  { nombre: "LinkedIn", href: "https://www.linkedin.com/company/cedem-mx" },
  {
    nombre: "Facebook",
    href: "https://www.facebook.com/people/CEDEM-Centro-de-Due%C3%B1ez-Empresaria/100057420250698/",
  },
  { nombre: "Instagram", href: "https://www.instagram.com/cedem.mx/" },
  { nombre: "WhatsApp", href: "https://api.whatsapp.com/send?phone=523322576343" },
  { nombre: "YouTube", href: "https://www.youtube.com/@cedemcentrodeduenez" },
] as const;

export const contacto = {
  telefono: "+52 33 2257 6343",
  telefonoHref: "tel:+523322576343",
  whatsapp: "https://api.whatsapp.com/send?phone=523322576343",
} as const;

/** Los cuatro momentos del Viaje del Dueño (narrativa propia de CEDEM). */
export const viajeDelDueno = [
  {
    titulo: "Cuando necesita crecer",
    texto:
      "Y no sabe cómo hacerlo sin perder el control de lo que le costó años construir.",
  },
  {
    titulo: "Cuando quiere soltar",
    texto:
      "Pero todavía no confía en la siguiente generación para entregarle el mando.",
  },
  {
    titulo: "Cuando quiere profesionalizar",
    texto: "Sin que la empresa deje de ser, en el fondo, la empresa de la familia.",
  },
  {
    titulo: "Cuando el negocio va bien",
    texto: "Pero la Dueñez está mal ejercida, y nadie se atreve a decírselo.",
  },
] as const;

/** Las tres puertas de entrada, por nivel de acompañamiento. */
export const servicios = [
  {
    clave: "consulting",
    nombre: "Consulting",
    etiqueta: "El nivel más alto de la firma",
    segmento: "Empresas desde 5 millones de dólares de ventas anuales",
    resumen:
      "Trabajo directo con los socios de CEDEM para rediseñar la fórmula de negocio, la fórmula de gobierno y el rumbo de la empresa desde el rol del dueño.",
    puntos: [
      "Pre-diagnóstico de 6 a 8 semanas para entender la realidad del negocio",
      "Proyecto de acompañamiento de 4 a 24 meses",
      "El Consultor Líder actúa como consejero personal del dueño",
      "Se instala un consejo funcional, se vigila la estrategia y se miden avances",
    ],
    href: "/consulting",
  },
  {
    clave: "pce",
    nombre: "PCE",
    etiqueta: "Concentración Estratégica",
    segmento: "Empresas por debajo de 5 millones de dólares de ventas anuales",
    resumen:
      "Consultoría de nivel intermedio: un Consultor Senior dirige a consultores de menor rango para aplicar el método a un ritmo y un alcance proporcionales al tamaño del negocio.",
    puntos: [
      "Cada negocio como si fuera el único",
      "Los mejores recursos a las mejores oportunidades",
      "Abandono estratégico de lo que no promete crecimiento",
      "Un senior supervisa cada cuenta, sin excepción",
    ],
    href: "/pce",
  },
  {
    clave: "master",
    nombre: "Máster",
    etiqueta: "Con Euncet Business School · UPC",
    segmento: "Dirigido a sucesores y miembros de la siguiente generación",
    resumen:
      "Máster en Innovación y Emprendimiento en la Empresa Familiar: 12 meses, doble titulación europea y semanas académicas en Miami y Barcelona.",
    puntos: [
      "60 ECTS · 184 horas · modalidad online con streaming",
      "Semanas académicas presenciales en Miami y Barcelona",
      "Coaching individual y consejo consultivo de 4 a 5 participantes",
      "Proyecto de creación de valor aplicado a la propia empresa",
    ],
    href: "/master",
  },
] as const;

/** Los tres verbos del método, con sus componentes. */
export const metodo = [
  {
    verbo: "Generar",
    marco: "Enfoque competitivo",
    componentes: ["Fertilidad de mercados", "Caminos de diferenciación", "Posicionamiento"],
    idea: "El cliente es la única fuente de generación de valor.",
  },
  {
    verbo: "Multiplicar",
    marco: "Sinergia organizacional",
    componentes: ["Querencia", "Fórmula de Gobierno", "Fórmula de Propiedad"],
    idea: "No se multiplica el valor de la empresa sin multiplicar el poder.",
  },
  {
    verbo: "Capturar",
    marco: "Alineación estratégica",
    componentes: ["Alineación de la organización", "de los recursos", "de la información"],
    idea: "La clave no es estar alineado: es estar siempre alineándose.",
  },
] as const;

/** Casos publicados por CEDEM. Las cifras son declaradas por la firma. */
export const casos = [
  {
    empresa: "Grupo D'portenis",
    persona: "Óscar Sánchez",
    cargo: "CEO",
    problema: "La empresa crecía, pero el gobierno familiar no acompañaba ese crecimiento.",
    solucion: "Rediseño de la Fórmula de Gobierno con la metodología de Dueñez Empresaria.",
    resultado: "En 10 años cuadruplicaron las ventas y el dueño ejerció su rol de verdad.",
  },
  {
    empresa: "Grupo Caffenio",
    persona: "José Antonio Díaz Quintanar",
    cargo: "Presidente del Consejo",
    problema: "Una empresa familiar atada a la operación y a la visión de una sola generación.",
    solucion: "Acompañamiento para compartir la Dueñez y priorizar la creación de valor.",
    resultado: "Pasaron de empresa familiar a familia empresaria.",
  },
  {
    empresa: "Grupo Coppel",
    persona: "Agustín Coppel Luken",
    cargo: "Presidente del Consejo",
    problema: "Integrar la formación de dueños con la gestión de valor del grupo empresarial.",
    solucion: "Consultoría especializada en gestión de valor y fortalecimiento del patrimonio familiar.",
    resultado:
      "Crecimiento del grupo empresarial y fortalecimiento del patrimonio familiar. *",
  },
] as const;

/** Artículos de la selección editorial (docs/08-seleccion-articulos.md). */
export const articulosDestacados = [
  {
    titulo: "El rol que nadie te enseñó a ejercer",
    original: "La Dueñez hace la diferencia",
    extracto:
      "Nadie puede sustituir al dueño en las tareas que le corresponden. La Dueñez se puede compartir, pero no es delegable.",
    fecha: "2020-04-06",
    url: "https://www.cedem.com.mx/2020/04/06/la-duenez-hace-la-diferencia/",
    etiquetas: ["Dueñez", "Rol de dueño"],
  },
  {
    titulo: "¿Estás creciendo o solo engordando?",
    original: "Lastres del crecimiento",
    extracto:
      "Muchas empresas engordan en lugar de crecer: destruyen valor al aumentar de tamaño. Inercia, desenfoque, soledad y tolerancia.",
    fecha: "2019-08-31",
    url: "https://www.cedem.com.mx/2019/08/31/lastres-del-crecimiento/",
    etiquetas: ["Crecimiento", "Valor"],
  },
  {
    titulo: "Nadie te advirtió que dirigir se sentiría tan solo",
    original: "¿Solitario yo?",
    extracto:
      "Pocos empresarios reconocen que su soledad es costosa y generada por ellos mismos.",
    fecha: "2021-04-09",
    url: "https://www.cedem.com.mx/2021/04/09/solitario-yo/",
    etiquetas: ["Liderazgo", "Dueñez"],
  },
] as const;

/** Cifras de mercado de terceros, para el discurso público. */
export const datosDeMercado = [
  { cifra: "50%", texto: "de las empresas familiares mexicanas tiene riesgo serio de desaparecer." },
  { cifra: "9%", texto: "llega a la tercera generación (11% a nivel internacional)." },
  { cifra: "66%", texto: "no cuenta con órganos de gobierno formalizados." },
] as const;

export const procedenciaDatos = "Fuente: IPADE · CIFEM";
