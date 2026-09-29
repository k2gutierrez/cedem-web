import type { Metadata } from "next";
import { Recorrido } from "@/components/camino/Recorrido";
import { MarcoFoto } from "@/components/marketing/MarcoFoto";
import { Container } from "@/components/ui/Container";
import { mapaDeCatalogo } from "@/lib/datos/recomendaciones";
import { hayArchivo } from "@/lib/fotos-locales";

export const metadata: Metadata = {
  title: "Camino del Dueño · Diagnóstico gratuito de 5 minutos",
  /* El lenguaje es el nuevo: el entregable es una observación, no un veredicto
     sobre «en qué verbo se te atora el valor». Si se cambia el entregable otra
     vez, esta línea y las de la portada del recorrido tienen que cambiar con él. */
  description:
    "Quince preguntas, cinco minutos. Al terminar recibes una observación escrita sobre tu caso, tres artículos para leer y tres acciones para esta semana. Gratis y sin registro.",
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

  /* Apoyo visual de la apertura. Las dos fotos se miran al compilar y sólo se
     dibuja lo que existe.
     La franja es deliberadamente baja y no respeta la proporción del archivo: a
     3:2 mediría casi 500 px y empujaría el botón de empezar fuera de la pantalla
     —que es justo lo que el dueño viene a hacer—. Medido en Chrome: con 170 px el
     botón sigue a la vista en una laptop de 900 px de alto. En el celular se
     muestra una sola foto. */
  const fotoLaptop = hayArchivo("camino-laptop.jpg");
  const fotoCafe = hayArchivo("camino-cafe.jpg");

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

      {/* Franja de fotos de la apertura. Se dibuja sólo si alguna existe y sólo
          cuando hay altura de sobra: en una laptop de 768 px de alto empujaría el
          botón de empezar fuera del primer pantallazo, y el recorrido manda. La
          foto cuadrada va a su tamaño, sin recorte. */}
      {fotoLaptop || fotoCafe ? (
        <Container className="hidden pt-5 [@media(min-height:800px)]:block sm:pt-6">
          <div
            className={`grid gap-4 ${
              fotoLaptop && fotoCafe ? "sm:grid-cols-[1fr_170px]" : ""
            }`}
          >
            {fotoLaptop ? (
              <MarcoFoto
                archivo="camino-laptop.jpg"
                alt="Persona frente a una laptop abierta en una mesa de casa, al caer la tarde, con café y lentes al lado"
                proporcion="h-[140px] sm:h-[170px]"
                sizes="(max-width: 640px) 100vw, 60vw"
                prioridad
              />
            ) : null}
            {fotoCafe ? (
              <MarcoFoto
                archivo="camino-cafe.jpg"
                alt="Dueña de empresa sentada sola en una mesa de café junto a la ventana, con el teléfono y un café sobre la mesa"
                proporcion="h-[140px] w-[140px] sm:h-[170px] sm:w-[170px]"
                sizes="170px"
                className={fotoLaptop ? "hidden sm:block" : ""}
              />
            ) : null}
          </div>
        </Container>
      ) : null}

      <Recorrido catalogo={catalogo} />
    </>
  );
}
