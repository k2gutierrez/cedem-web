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

/** Los cuatro momentos del Viaje del Dueño (narrativa propia de CEDEM).
    Regla de esta sección: una línea por momento. El dueño se reconoce o no se
    reconoce; no hay nada que explicarle. */
export const viajeDelDueno = [
  {
    titulo: "Cuando necesita crecer",
    texto: "Y no sabe cómo, sin perder el control de lo que le costó años construir.",
  },
  {
    titulo: "Cuando quiere soltar",
    texto: "Pero todavía no confía en la siguiente generación.",
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

/** Las tres puertas de entrada, por nivel de acompañamiento.
    Máximo tres viñetas por puerta: la cuarta se lee en la página del servicio. */
export const servicios = [
  {
    clave: "consulting",
    nombre: "Consulting",
    etiqueta: "El nivel más alto de la firma",
    segmento: "Desde 5 millones de dólares de ventas anuales",
    resumen:
      "Trabajas con los socios de CEDEM, no con un equipo junior. Rediseñamos la fórmula de negocio y la de gobierno, desde el rol del dueño.",
    puntos: [
      "Pre-diagnóstico de 6 a 8 semanas",
      "Proyecto de acompañamiento de 4 a 24 meses",
      "Un Consultor Líder como consejero personal del dueño",
    ],
    href: "/consulting",
  },
  {
    clave: "pce",
    nombre: "PCE",
    etiqueta: "Concentración Estratégica",
    segmento: "Por debajo de 5 millones de dólares de ventas anuales",
    resumen:
      "El mismo método, a tu tamaño. Un Consultor Senior dirige el trabajo y su equipo lo aplica en tu negocio.",
    puntos: [
      "Cada negocio como si fuera el único",
      "Los mejores recursos a las mejores oportunidades",
      "Abandonar lo que no promete crecimiento",
    ],
    href: "/pce",
  },
  {
    clave: "master",
    nombre: "Máster",
    etiqueta: "Con Euncet Business School · UPC",
    segmento: "Para sucesores y la siguiente generación",
    resumen:
      "Doce meses para formar a la siguiente generación como dueña, no como ejecutiva. Doble titulación europea.",
    puntos: [
      "60 ECTS · 184 horas, online con streaming",
      "Semanas académicas en Miami y Barcelona",
      "Proyecto de creación de valor en tu propia empresa",
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

/** Casos publicados por CEDEM. Las cifras son declaradas por la firma.
    Cada caso se lee en cinco segundos: problema, solución, resultado.
    `crecimiento` alimenta el gráfico de barras de la sección; sin él, el caso se
    presenta solo con texto (es el caso de Coppel, que no tiene cifra pública). */
export const casos = [
  {
    empresa: "Grupo D'portenis",
    persona: "Óscar Sánchez",
    cargo: "CEO",
    problema: "La empresa crecía; el gobierno familiar, no.",
    solucion: "Rediseño de la Fórmula de Gobierno.",
    resultado: "Cuadruplicaron las ventas en 10 años y el dueño ejerció su rol.",
    crecimiento: { inicio: 1, fin: 4, unidad: "veces las ventas", nota: "en 10 años" },
  },
  {
    empresa: "Grupo Caffenio",
    persona: "José Antonio Díaz Quintanar",
    cargo: "Presidente del Consejo",
    problema: "Una empresa atada a la operación y a una sola generación.",
    solucion: "Compartir la Dueñez y priorizar la creación de valor.",
    resultado: "Pasaron de empresa familiar a familia empresaria.",
    crecimiento: { inicio: 20, fin: 250, unidad: "MDD", nota: "en 21 años" },
  },
  {
    empresa: "Grupo Coppel",
    persona: "Agustín Coppel Luken",
    cargo: "Presidente del Consejo",
    problema: "Formar dueños y gestionar el valor del grupo, al mismo tiempo.",
    solucion: "Consultoría en gestión de valor y patrimonio familiar.",
    resultado: "Crecimiento del grupo y patrimonio familiar fortalecido. *",
  },
] as const;

/* Los artículos de la selección editorial ya NO viven aquí: se leen de la base
   (`obtenerArticulosDestacados()`), marcados como destacados desde el panel, y
   enlazan a `/recursos/{slug}`. Esta lista era la última dependencia del
   WordPress actual en el sitio público. */

/** Cifras de mercado de terceros, para el discurso público. */
export const datosDeMercado = [
  { cifra: "50%", texto: "de las empresas familiares mexicanas corre riesgo de desaparecer." },
  { cifra: "9%", texto: "llega a la tercera generación (11% en el mundo)." },
  { cifra: "66%", texto: "no tiene órganos de gobierno formalizados." },
] as const;

export const procedenciaDatos = "Fuente: IPADE · CIFEM";
