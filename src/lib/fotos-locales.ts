import manifiesto from "@/content/fotos.json";

/**
 * Las imágenes que existen de verdad en `public/`, según el manifiesto que se
 * genera al compilar (`scripts/generar-manifiesto-fotos.mjs`).
 *
 * PARA AGREGAR UNA IMAGEN NO SE TOCA CÓDIGO: se deja el archivo en
 * `public/fotos/` (o `public/logos/`, `public/og/`) y se vuelve a compilar. Si el
 * archivo está, se muestra; si no, el componente dibuja el hueco de marca.
 *
 * Por qué el manifiesto y no `fs.existsSync` en el momento: en Amplify el
 * servidor puede correr sin la carpeta `public/`, y entonces una foto que sí
 * está publicada se vería como si faltara. La lista se calcula al compilar, así
 * que la respuesta viaja con el código.
 */

export type CarpetaPublica = "fotos" | "logos" | "og" | "graficos";

const LISTAS: Record<CarpetaPublica, string[]> = {
  fotos: manifiesto.fotos,
  logos: manifiesto.logos,
  og: manifiesto.og,
  graficos: manifiesto.graficos,
};

/** ¿Existe el archivo? `nombre` es relativo a la carpeta, con extensión. */
export function hayArchivo(nombre: string, carpeta: CarpetaPublica = "fotos"): boolean {
  return LISTAS[carpeta].includes(nombre);
}

/**
 * Ruta pública (`/fotos/…`) si el archivo existe; `undefined` si no.
 * Los componentes la usan para decidir entre la imagen y el hueco de marca.
 */
export function rutaDeArchivo(
  nombre: string,
  carpeta: CarpetaPublica = "fotos",
): string | undefined {
  return hayArchivo(nombre, carpeta) ? `/${carpeta}/${nombre}` : undefined;
}

/** Todos los archivos de una carpeta. Se usa en el carrusel de logos. */
export function archivosDe(carpeta: CarpetaPublica): string[] {
  return [...LISTAS[carpeta]];
}

/**
 * ¿Están TODAS las fotos de un grupo?
 *
 * Se usa donde las fotos se ven juntas y una sola faltante dejaría el bloque a
 * medias: los cuatro momentos del viaje, los tres casos de la home. Ahí es mejor
 * no mostrar ninguna que mostrar tres fotos y un hueco de marca en medio. Para una
 * foto suelta (una sección, una página de servicio) se usa `hayArchivo()`.
 */
export function estanTodas(nombres: string[], carpeta: CarpetaPublica = "fotos"): boolean {
  return nombres.length > 0 && nombres.every((nombre) => hayArchivo(nombre, carpeta));
}
