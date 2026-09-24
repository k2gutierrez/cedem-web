import type { Metadata } from "next";
import { Recorrido } from "@/components/camino/Recorrido";

export const metadata: Metadata = {
  title: "Camino del Dueño · Diagnóstico gratuito de 5 minutos",
  description:
    "Quince preguntas para saber en qué verbo se te está atorando el valor: generar, multiplicar o capturar. Al final, tu lectura, tres artículos para tu caso y tres ejercicios para esta semana. Gratis y sin registro para empezar.",
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
export default function PaginaCamino() {
  return <Recorrido />;
}
