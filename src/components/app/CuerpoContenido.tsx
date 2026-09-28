import type { JSX } from "react";
import { sanearHtml } from "@/lib/contenido/sanear-html";

/**
 * Renderiza el cuerpo de un contenido, en el formato en que está escrito.
 *
 * Existe como componente porque el mismo cuerpo se pinta en varios lugares —el
 * artículo público, la lectura de un documento del método, la vista previa del
 * panel— y tener varias copias del mismo renderizador es la forma más segura de
 * que dos de ellas se comporten distinto.
 *
 * DOS FORMATOS, Y NO ES UN DETALLE
 *
 * El cuerpo llega de dos orígenes que no se parecen:
 *
 *   · `html` — los 186 artículos migrados de WordPress. Traen `<p>`, `<h4>`,
 *     `<em>`, `<a>` y `<br>`; se publican tal cual, con una lista blanca de
 *     etiquetas que aplicó el importador.
 *   · `markdown` — lo que se escribe en el panel y los doce documentos del
 *     método, que `importar-documentos.mjs` compone párrafo a párrafo.
 *
 * Tratar el HTML como markdown —lo que hacía la versión anterior de esta página—
 * envolvía cada bloque en un `<p>` propio y producía `<p><p>…</p></p>`. Eso es
 * HTML inválido: el navegador lo repara mientras React hidrata y la consola
 * escupe `Minified React error #418` en cada artículo. Se veía, pero la
 * hidratación estaba rota.
 *
 * SEGURIDAD
 *
 * Solo el HTML pasa por `dangerouslySetInnerHTML`, y el texto lo limpió el
 * importador con una lista blanca de etiquetas (ver `scripts/importar-wordpress.mjs`):
 * nada de `<script>`, `<iframe>` ni atributos `on*`. El markdown se construye
 * nodo a nodo, y las negritas son la única conversión a HTML.
 *
 * EL HTML SE SANEA ANTES DE PINTARLO
 *
 * El HTML de WordPress trae etiquetas sin cerrar (hay un `<a>` que nunca cierra en
 * uno de los artículos migrados). Eso hace que el navegador construya un DOM
 * distinto del que React espera y la hidratación falle con el error #418. El
 * saneado es determinista, así que servidor y cliente pintan lo mismo; el detalle
 * está en `src/lib/contenido/sanear-html.ts`.
 */
export function CuerpoContenido({
  texto,
  formato = "markdown",
  className = "",
}: {
  texto: string;
  /** Cómo está escrito el cuerpo. Por omisión, markdown (lo que se escribe en el panel). */
  formato?: "markdown" | "html" | null;
  /** Clases del contenedor. Por defecto, la tipografía de lectura del sitio. */
  className?: string;
}) {
  if (!texto.trim()) return null;

  if (formato === "html") return <CuerpoHtml texto={texto} className={className} />;

  const clases =
    className ||
    "space-y-5 text-base leading-relaxed text-fg-muted [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-h3 [&_h2]:text-fg [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-fg";

  const bloques = texto.split(/\n{2,}/).map((bloque, i): JSX.Element | null => {
    const limpio = bloque.trim();
    if (!limpio) return null;

    if (limpio.startsWith("## ")) {
      return <h2 key={i}>{limpio.replace(/^##\s+/, "")}</h2>;
    }
    if (limpio.startsWith("### ")) {
      return <h3 key={i}>{limpio.replace(/^###\s+/, "")}</h3>;
    }
    if (/^[-*]\s/m.test(limpio)) {
      return (
        <ul key={i}>
          {limpio
            .split("\n")
            .filter((l) => l.trim())
            .map((linea, j) => (
              <li key={j}>{linea.replace(/^[-*]\s+/, "")}</li>
            ))}
        </ul>
      );
    }

    return (
      <p
        key={i}
        dangerouslySetInnerHTML={{
          __html: limpio.replace(
            /\*\*(.+?)\*\*/g,
            '<strong class="font-semibold text-fg">$1</strong>',
          ),
        }}
      />
    );
  });

  return <div className={clases}>{bloques}</div>;
}

/**
 * El cuerpo en HTML, tal como lo devolvió WordPress.
 *
 * El envoltorio es un `<div>` con las clases de tipografía aplicadas a los hijos
 * (`[&_p]`, `[&_h4]`…): el HTML del artículo trae sus propias etiquetas y no se
 * reescribe. Lo único que se añade por CSS es que los enlaces se distingan como
 * enlaces y que la tipografía del sitio mande sobre la del editor original.
 */
function CuerpoHtml({ texto, className }: { texto: string; className?: string }) {
  // Se sanea aquí, y no al guardar, porque el cuerpo también lo escribe una
  // persona desde el panel: la defensa tiene que estar en el camino de salida.
  const saneado = sanearHtml(texto);

  const clases =
    className ||
    [
      "text-base leading-relaxed text-fg-muted",
      "[&_p]:mb-5",
      "[&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-h3 [&_h2]:text-fg",
      "[&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-fg",
      "[&_h4]:mt-8 [&_h4]:font-display [&_h4]:text-base [&_h4]:font-bold [&_h4]:text-fg",
      "[&_ul]:mb-5 [&_ul]:space-y-2 [&_ol]:mb-5 [&_ol]:space-y-2",
      "[&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal",
      "[&_strong]:font-semibold [&_strong]:text-fg",
      "[&_em]:italic",
      "[&_blockquote]:border-l-2 [&_blockquote]:border-cyan/60 [&_blockquote]:pl-4 [&_blockquote]:italic",
      "[&_a]:font-medium [&_a]:text-navy [&_a]:underline [&_a]:decoration-cyan/50 [&_a]:underline-offset-2 hover:[&_a]:decoration-cyan dark:[&_a]:text-sky",
      "[&_img]:my-6 [&_img]:rounded-xl",
      "[&_hr]:my-8 [&_hr]:border-border",
    ].join(" ");

  return <div className={clases} dangerouslySetInnerHTML={{ __html: saneado }} />;
}
