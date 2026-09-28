import type { Metadata } from "next";
import { Recorrido } from "@/components/camino/Recorrido";
import { mapaDeCatalogo } from "@/lib/datos/recomendaciones";

export const metadata: Metadata = {
  title: "Camino del Dueño · Diagnóstico gratuito de 5 minutos",
  description:
    "Quince preguntas para saber en qué verbo se te atora el valor. Al terminar, tu lectura, tres artículos para tu caso y tres ejercicios para esta semana. Gratis y sin registro.",
  robots: { index: true, follow: true },
};

/**
 * El Camino del Dueño.
 *
 * Hoy el recorrido vive completamente en el navegador: el avance se guarda en
 * el dispositivo y el perfil lo calcula el motor determinista en el cliente.
 *
 * TODO (Fase 3): crear la sesión anónima en Supabase al empezar y persistir
 * respuestas y resultado; al dejar el correo, vincular la identidad para que la
 * cuenta pase a permanente sin perder el avance.
 * TODO (Fase 4): llamar a DeepSeek al responder Q13 para que la lectura llegue
 * ya redactada, con los artículos elegidos entre los candidatos pre-filtrados.
 */
/* Los artículos que el recorrido recomienda viven hoy en la plataforma. El mapa
   que traduce las rutas del catálogo a slugs se resuelve aquí, en el servidor, y
   viaja al componente de cliente: así las recomendaciones enlazan dentro del
   sitio y no al WordPress actual. */
export const revalidate = 3600;

export default async function PaginaCamino() {
  const catalogo = await mapaDeCatalogo();

  return (
    <>
      {/* El recorrido es interactivo: sin JavaScript solo se ve la portada. En
          lugar de dejar al visitante con una pantalla a medias, se le explica y
          se le da la salida. */}
      <noscript>
        <div className="border-b border-amber-300/60 bg-amber-50 px-5 py-4 text-center text-sm leading-relaxed text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
          El Camino del Dueño necesita JavaScript para funcionar. Actívalo y vuelve a
          entrar; si prefieres, escríbenos desde la página de{" "}
          <a href="/contacto" className="font-semibold underline underline-offset-4">
            contacto
          </a>{" "}
          y lo hacemos contigo.
        </div>
      </noscript>

      <Recorrido catalogo={catalogo} />
    </>
  );
}
