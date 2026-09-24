/**
 * Cliente de DeepSeek.
 *
 * Solo se usa desde el servidor: la clave nunca llega al navegador.
 *
 * Detalles de la API que conviene tener presentes (verificados en la
 * documentación oficial):
 *  · El modo pensamiento viene **activado por defecto**. Para respuestas
 *    rápidas y en JSON se desactiva con `thinking: { type: "disabled" }`; con
 *    el modo pensamiento activo el modelo gasta tokens razonando antes de
 *    responder y puede quedarse sin margen para el contenido.
 *  · En modo pensamiento no se admiten `temperature`, `presence_penalty` ni
 *    `frequency_penalty` (no dan error, simplemente se ignoran).
 *  · Para forzar JSON se usa `response_format: { type: "json_object" }` y hay
 *    que pedir el JSON también en el mensaje.
 *  · Forzar `tool_choice` en modo pensamiento devuelve error: por eso la salida
 *    estructurada se resuelve con JSON mode + validación en el servidor.
 */

const URL_API = "https://api.deepseek.com/chat/completions";

export type Mensaje = { role: "system" | "user" | "assistant"; content: string };

export type OpcionesLlamada = {
  mensajes: Mensaje[];
  /** `deepseek-v4-pro` para análisis; `deepseek-flash` para tareas acotadas. */
  modelo?: string;
  maxTokens?: number;
  /** Si es true, pide JSON y desactiva el modo pensamiento. */
  json?: boolean;
  /** Milisegundos antes de abandonar. */
  timeoutMs?: number;
};

export type RespuestaIA =
  | { ok: true; texto: string; modelo: string; tokensEntrada: number; tokensSalida: number }
  | { ok: false; error: string };

/** ¿Está configurada la IA? Sin clave, la plataforma usa la lectura base. */
export function iaConfigurada(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function llamarIA({
  mensajes,
  modelo = process.env.DEEPSEEK_MODELO_LECTURA || "deepseek-v4-pro",
  maxTokens = 1200,
  json = false,
  timeoutMs = 45000,
}: OpcionesLlamada): Promise<RespuestaIA> {
  const clave = process.env.DEEPSEEK_API_KEY;
  if (!clave) return { ok: false, error: "sin_clave" };

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);

  try {
    const respuesta = await fetch(URL_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelo,
        messages: mensajes,
        max_tokens: maxTokens,
        stream: false,
        ...(json
          ? {
              response_format: { type: "json_object" },
              thinking: { type: "disabled" },
            }
          : {}),
      }),
      signal: controlador.signal,
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      return { ok: false, error: `http_${respuesta.status}: ${detalle.slice(0, 200)}` };
    }

    const datos = (await respuesta.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const texto = datos.choices?.[0]?.message?.content?.trim() ?? "";
    if (!texto) return { ok: false, error: "respuesta_vacia" };

    return {
      ok: true,
      texto,
      modelo,
      tokensEntrada: datos.usage?.prompt_tokens ?? 0,
      tokensSalida: datos.usage?.completion_tokens ?? 0,
    };
  } catch (error) {
    const motivo = error instanceof Error ? error.message : "error_desconocido";
    return { ok: false, error: motivo.includes("abort") ? "timeout" : motivo };
  } finally {
    clearTimeout(temporizador);
  }
}
