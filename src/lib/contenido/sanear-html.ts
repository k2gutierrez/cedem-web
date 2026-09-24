/**
 * Saneado del HTML que viene de WordPress.
 *
 * POR QUÉ HACE FALTA
 *
 * El HTML de los 186 artículos migrados no siempre está bien formado. El caso que
 * lo destapó, en el artículo *Empresarios en crecimiento*:
 *
 *     <p>c_dumois@cedem.com.mx<br>
 *     <a href="http://www.cedem.com.mx" target="_blank" rel="noopener noreferrer">www.cedem.com.mx<br>
 *     Carlos A. Dumois es Presidente y Consultor de CEDEM.<br>
 *     <strong><em>…</em></strong>…</p>          ← el <a> nunca se cierra
 *
 * Un `<a>` sin cerrar no es un detalle cosmético: el navegador lo cierra donde
 * puede —al final del párrafo— y deja un DOM distinto del que React espera. Al
 * hidratar, React compara, no coincide, y lanza
 *
 *     Hydration failed because the server rendered HTML didn't match the client
 *
 * (el `Minified React error #418`), regenerando el árbol en el cliente. La página
 * se veía, pero cualquier componente interactivo dentro del cuerpo habría fallado.
 *
 * No se arregla solo en los datos: el cuerpo lo escribe una persona en un editor y
 * va a volver a pasar. Este saneado es determinista —el mismo texto da siempre el
 * mismo resultado—, que es la condición para que servidor y cliente coincidan.
 *
 * QUÉ HACE Y QUÉ NO
 *
 * Cierra lo que quedó abierto y descarta cierres huérfanos. No reescribe el
 * contenido, no reordena nada y no toca los atributos: la limpieza de etiquetas
 * peligrosas (`<script>`, `on*`) es trabajo del importador, con su lista blanca,
 * y aquí no se duplica.
 */

/** Etiquetas que nunca se cierran (`<br>`, `<img>`…). */
const VACIAS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/** Etiquetas que abren un bloque nuevo. */
const BLOQUES = new Set([
  "p",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "table",
  "tr",
  "td",
  "th",
  "blockquote",
  "section",
  "article",
  "figure",
  "figcaption",
]);

/**
 * Anidamientos que el navegador acepta sin cerrar el contenedor. Lo que no está
 * aquí —un `<a>` dentro de un `<p>`, un `<p>` dentro de otro `<p>`— se cierra al
 * abrir el bloque siguiente, igual que haría el parser.
 */
const ANIDABLES = new Set([
  "li>ul",
  "li>ol",
  "li>p",
  "td>p",
  "th>p",
  "blockquote>p",
  "div>p",
  "div>div",
  "div>ul",
  "div>ol",
  "div>table",
  "div>blockquote",
  "div>figure",
  "section>div",
  "article>div",
  "figcaption>p",
  "ul>li",
  "ol>li",
  "tr>td",
  "tr>th",
  "table>tr",
  "table>tbody",
  "tbody>tr",
]);

const ETIQUETA = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;

export function sanearHtml(html: string): string {
  if (!html.includes("<")) return html;

  const pila: string[] = [];
  let salida = "";
  let ultimo = 0;

  for (const coincidencia of html.matchAll(ETIQUETA)) {
    const [completa, nombre, resto] = coincidencia;
    const etiqueta = nombre.toLowerCase();
    const posicion = coincidencia.index ?? 0;

    salida += html.slice(ultimo, posicion);
    ultimo = posicion + completa.length;

    if (VACIAS.has(etiqueta)) {
      salida += completa;
      continue;
    }

    if (completa.startsWith("</")) {
      const indice = pila.lastIndexOf(etiqueta);
      // Un cierre sin apertura se descarta: es basura del editor, no contenido.
      if (indice === -1) continue;
      while (pila.length > indice) salida += `</${pila.pop()}>`;
      continue;
    }

    // Los bloques que quedaron abiertos se cierran ANTES de abrir el nuevo: si se
    // emitiera primero la apertura, el cierre saldría dentro de ella.
    if (BLOQUES.has(etiqueta)) {
      while (pila.length && !ANIDABLES.has(`${pila[pila.length - 1]}>${etiqueta}`)) {
        salida += `</${pila.pop()}>`;
      }
    }

    salida += completa;
    if (!/\/\s*$/.test(resto ?? "")) pila.push(etiqueta); // <img /> viene cerrada
  }

  salida += html.slice(ultimo);
  while (pila.length) salida += `</${pila.pop()}>`;

  return salida;
}
