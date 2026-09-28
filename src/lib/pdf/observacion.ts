import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * La observación del Camino del Dueño, en PDF para imprimir.
 *
 * POR QUÉ SE GENERA EN EL NAVEGADOR Y NO EN EL SERVIDOR
 *
 * Es un documento de una sola persona, con sus datos. Generarlo en el servidor
 * obligaría a mandar la observación de vuelta por la red, a guardarla en algún
 * lado o a volver a generarla (y a pagar la IA otra vez). Aquí el PDF se arma con
 * lo que ya está en pantalla y se descarga: nada viaja y nada se almacena.
 *
 * POR QUÉ pdf-lib Y NO UNA PLANTILLA HTML IMPRESA
 *
 * `window.print()` depende de los márgenes y los encabezados del navegador del
 * dueño, y sale distinto en cada computadora. Con pdf-lib el documento sale
 * idéntico siempre: A4, tipografía, colores de marca y el logo de CEDEM.
 *
 * El logo se toma del propio sitio (`/brand/cedem-logo-blanco.png`) para que no
 * haya dos versiones del logotipo en circulación. Si no se puede cargar —sin red,
 * por ejemplo—, el documento se genera igual: primero el contenido, después el
 * adorno.
 */

const NAVY = rgb(0.059, 0.125, 0.424); // #0F206C
const CYAN = rgb(0, 0.631, 0.878); // #00A1E0
const SKY = rgb(0.424, 0.773, 0.914); // #6CC5E9
const TINTA = rgb(0.051, 0.078, 0.141); // #0d1424
const APAGADO = rgb(0.322, 0.376, 0.478); // #52607a
const LINEA = rgb(0.89, 0.906, 0.937); // #e3e7ef
const BLANCO = rgb(1, 1, 1);

const A4: [number, number] = [595.28, 841.89];
const MARGEN = 56;
const ANCHO = A4[0] - MARGEN * 2;
const PIE = 64;

export type DatosObservacion = {
  nombre: string;
  titular: string;
  observacion: string[];
  fecha: Date;
  version: string;
  scores: { generar: number; multiplicar: number; capturar: number };
  verboCritico: "generar" | "multiplicar" | "capturar";
  focos: { componente: string; frase: string }[];
  dispersante: { titulo: string; texto: string } | null;
  nivel: string;
  articulos: { titulo: string; porque: string }[];
  ejercicios: { titulo: string; detalle: string }[];
  sitio: string;
};

const NOMBRE_VERBO = {
  generar: "Generar valor",
  multiplicar: "Multiplicar valor",
  capturar: "Capturar valor",
} as const;

/** Parte el texto en líneas que caben en el ancho dado. */
function partir(texto: string, fuente: PDFFont, tamano: number, ancho: number): string[] {
  const palabras = texto.replace(/\s+/g, " ").trim().split(" ");
  const lineas: string[] = [];
  let actual = "";

  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (fuente.widthOfTextAtSize(prueba, tamano) <= ancho) {
      actual = prueba;
    } else {
      if (actual) lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);

  return lineas;
}

export async function generarPdfObservacion(datos: DatosObservacion): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.setTitle(`Camino del Dueño · Observación de CEDEM`);
  pdf.setAuthor("CEDEM · Centro de Dueñez Empresaria");
  pdf.setSubject("Observación del Camino del Dueño");

  let pagina = pdf.addPage(A4);
  // El contenido empieza debajo de la banda de encabezado.
  let y = A4[1] - 128 - 34;

  const nuevaPagina = () => {
    pagina = pdf.addPage(A4);
    y = A4[1] - MARGEN - 28;
  };

  /** Deja espacio o salta de página. */
  const espacio = (necesario: number) => {
    if (y - necesario < PIE) nuevaPagina();
  };

  const parrafo = (
    texto: string,
    opciones: {
      fuente?: PDFFont;
      tamano?: number;
      color?: ReturnType<typeof rgb>;
      interlinea?: number;
      sangria?: number;
      ancho?: number;
    } = {},
  ) => {
    const fuente = opciones.fuente ?? normal;
    const tamano = opciones.tamano ?? 10.5;
    const color = opciones.color ?? TINTA;
    const interlinea = opciones.interlinea ?? tamano * 1.5;
    const sangria = opciones.sangria ?? 0;
    const ancho = opciones.ancho ?? ANCHO - sangria;

    for (const linea of partir(texto, fuente, tamano, ancho)) {
      espacio(interlinea);
      pagina.drawText(linea, { x: MARGEN + sangria, y, size: tamano, font: fuente, color });
      y -= interlinea;
    }
  };

  const titulo = (texto: string) => {
    espacio(34);
    y -= 8;
    pagina.drawText(texto.toUpperCase(), {
      x: MARGEN,
      y,
      size: 8.5,
      font: negrita,
      color: CYAN,
    });
    y -= 16;
  };

  /* --- Cuerpo ------------------------------------------------------------ */

  // Frase de espejo
  for (const linea of partir(datos.titular, negrita, 19, ANCHO)) {
    espacio(26);
    pagina.drawText(linea, { x: MARGEN, y, size: 19, font: negrita, color: NAVY });
    y -= 25;
  }

  y -= 4;
  parrafo(
    `Observación hecha para ${datos.nombre} · ${datos.fecha.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`,
    { tamano: 9, color: APAGADO, interlinea: 14 },
  );

  // Observación
  titulo("Observación de CEDEM");
  for (const bloque of datos.observacion) {
    parrafo(bloque);
    y -= 8;
  }

  // Cómo se mueve el valor
  titulo("Cómo se mueve tu valor");
  const filas: [keyof typeof NOMBRE_VERBO, number][] = [
    ["generar", datos.scores.generar],
    ["multiplicar", datos.scores.multiplicar],
    ["capturar", datos.scores.capturar],
  ];
  for (const [verbo, valor] of filas) {
    espacio(22);
    const critico = verbo === datos.verboCritico;
    pagina.drawText(NOMBRE_VERBO[verbo], {
      x: MARGEN,
      y,
      size: 10,
      font: critico ? negrita : normal,
      color: critico ? TINTA : APAGADO,
    });
    const barraX = MARGEN + 130;
    const barraAncho = ANCHO - 130 - 46;
    pagina.drawRectangle({
      x: barraX,
      y: y - 1,
      width: barraAncho,
      height: 7,
      color: LINEA,
    });
    pagina.drawRectangle({
      x: barraX,
      y: y - 1,
      width: Math.max(4, (barraAncho * Math.min(100, Math.max(0, valor))) / 100),
      height: 7,
      color: critico ? CYAN : SKY,
    });
    pagina.drawText(String(valor), {
      x: A4[0] - MARGEN - 30,
      y,
      size: 10,
      font: negrita,
      color: critico ? NAVY : APAGADO,
    });
    y -= 22;
  }

  // Lo que vimos
  if (datos.focos.length) {
    titulo("Lo que vimos, punto por punto");
    for (const foco of datos.focos) {
      espacio(18);
      pagina.drawCircle({ x: MARGEN + 3, y: y + 3, size: 2.2, color: CYAN });
      parrafo(`${foco.componente}: ${foco.frase}.`, { sangria: 14 });
      y -= 4;
    }
  }

  // El freno
  if (datos.dispersante) {
    titulo(datos.dispersante.titulo);
    parrafo(datos.dispersante.texto);
  }

  // Para leer
  if (datos.articulos.length) {
    titulo("Para leer esta semana");
    for (const [i, articulo] of datos.articulos.entries()) {
      espacio(30);
      pagina.drawText(`${i + 1}.`, { x: MARGEN, y, size: 10.5, font: negrita, color: CYAN });
      parrafo(articulo.titulo, { fuente: negrita, sangria: 16, tamano: 10.5, interlinea: 15 });
      parrafo(`Porque toca ${articulo.porque}.`, {
        sangria: 16,
        tamano: 9.5,
        color: APAGADO,
        interlinea: 14,
      });
      y -= 8;
    }
  }

  // Para hacer
  if (datos.ejercicios.length) {
    titulo("Para hacer esta semana");
    for (const ejercicio of datos.ejercicios) {
      espacio(46);
      pagina.drawRectangle({
        x: MARGEN,
        y: y - 1,
        width: 11,
        height: 11,
        borderColor: CYAN,
        borderWidth: 1,
        color: BLANCO,
      });
      pagina.drawText(ejercicio.titulo, {
        x: MARGEN + 20,
        y,
        size: 11,
        font: negrita,
        color: TINTA,
        maxWidth: ANCHO - 20,
      });
      y -= 17;
      parrafo(ejercicio.detalle, { sangria: 20, tamano: 10, color: APAGADO, interlinea: 14.5 });
      y -= 10;
    }
  }

  // Cierre
  titulo("El nivel de acompañamiento que te corresponde");
  parrafo(datos.nivel, { fuente: negrita });
  y -= 6;
  parrafo(
    "Esta observación es un apoyo para tu reflexión y no sustituye asesoría legal, fiscal ni financiera. Tus respuestas quedan en tu perfil y puedes pedir que las borremos cuando quieras.",
    { tamano: 8.5, color: APAGADO, interlinea: 12.5 },
  );
  y -= 4;
  parrafo(`Calculado con el motor ${datos.version} del método de Dueñez Empresaria.`, {
    tamano: 8.5,
    color: APAGADO,
    interlinea: 12.5,
  });

  /* --- Encabezado y pie de TODAS las páginas ----------------------------- */

  let logo: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
  try {
    const respuesta = await fetch("/brand/cedem-logo-blanco.png");
    if (respuesta.ok) logo = await pdf.embedPng(await respuesta.arrayBuffer());
  } catch {
    /* sin logo: el documento sigue siendo válido */
  }

  const paginas = pdf.getPages();
  paginas.forEach((p: PDFPage, i: number) => {
    // Banda superior
    p.drawRectangle({ x: 0, y: A4[1] - 92, width: A4[0], height: 92, color: NAVY });
    p.drawRectangle({ x: 0, y: A4[1] - 95, width: A4[0], height: 3, color: CYAN });

    if (logo) {
      const alto = 24;
      const ancho = (logo.width / logo.height) * alto;
      p.drawImage(logo, { x: MARGEN, y: A4[1] - 62, width: ancho, height: alto });
    } else {
      p.drawText("CEDEM", { x: MARGEN, y: A4[1] - 58, size: 18, font: negrita, color: BLANCO });
    }

    p.drawText("CAMINO DEL DUEÑO", {
      x: MARGEN,
      y: A4[1] - 78,
      size: 7.5,
      font: negrita,
      color: SKY,
    });

    const marca = "Centro de Dueñez Empresaria";
    p.drawText(marca, {
      x: A4[0] - MARGEN - normal.widthOfTextAtSize(marca, 8.5),
      y: A4[1] - 58,
      size: 8.5,
      font: normal,
      color: BLANCO,
    });

    // Pie
    p.drawLine({
      start: { x: MARGEN, y: 52 },
      end: { x: A4[0] - MARGEN, y: 52 },
      thickness: 0.75,
      color: LINEA,
    });
    p.drawText(datos.sitio, { x: MARGEN, y: 38, size: 8.5, font: normal, color: APAGADO });

    const numero = `${i + 1} / ${paginas.length}`;
    p.drawText(numero, {
      x: A4[0] - MARGEN - normal.widthOfTextAtSize(numero, 8.5),
      y: 38,
      size: 8.5,
      font: normal,
      color: APAGADO,
    });
  });

  return pdf.save();
}
