import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { supabaseConfigurado } from "@/lib/supabase/configurado";
import { VERSION_MOTOR } from "@/content/camino/config";
import { calcularPerfil, type Perfil, type Respuestas } from "@/lib/camino/puntuar";
import { normalizarLectura, lecturaBase, type Lectura } from "@/lib/ia/lectura";

/**
 * El historial del Camino del Dueño de un miembro.
 *
 * QUÉ SE GUARDA Y POR QUÉ SE PUEDE RECONSTRUIR
 *
 * Cuando el dueño termina el recorrido, `guardarDiagnostico()` escribe en
 * `journey_sessions.segment_scores` **el perfil completo y las respuestas**. Eso
 * permite dos cosas que no se pueden hacer con el resultado ya digerido:
 *
 *   · volver a calcular el perfil con el motor actual, en lugar de confiar en un
 *     número suelto guardado hace meses;
 *   · sacar de ahí los focos y las recomendaciones, que son lo que el dueño
 *     quiere ver al volver.
 *
 * El motor es determinista y está versionado (`engine_version`): si la versión
 * cambia, el historial lo dice en lugar de mentir. Así el equipo sabe que un
 * diagnóstico antiguo se calculó con otras reglas.
 *
 * La lectura completa —la de la IA si la hay, la base si no— se reconstruye con
 * el mismo camino que la pantalla de resultado, para que el dueño lea al volver
 * exactamente lo mismo que leyó al terminar.
 */

export type DiagnosticoGuardado = {
  id: string;
  completadaEn: string | null;
  duracionSegundos: number | null;
  modo: string | null;
  dispositivo: string | null;
  /** Versión del motor con la que se calculó. Si no coincide con la actual, se avisa. */
  motor: string | null;
  /** `true` si se calculó con una versión anterior del motor. */
  motorAntiguo: boolean;
  perfil: Perfil;
  lectura: Lectura;
  comentario: string | null;
  nombreDeclarado: string | null;
  confianza: string | null;
};

type FilaSesion = {
  id: string;
  completed_at: string | null;
  duration_seconds: number | null;
  source: string | null;
  device: string | null;
  engine_version: string | null;
  ai_summary_md: string | null;
  segment_scores: Record<string, unknown> | null;
};

/**
 * Recupera la lectura guardada de la IA.
 *
 * Se normaliza con el mismo esquema con el que se guardó —y con el anterior, para
 * no invalidar las lecturas ya escritas—: una lectura vieja o incompleta no se
 * muestra a medias, se sustituye por la base.
 */
function lecturaGuardada(crudo: string | null, perfil: Perfil): Lectura {
  if (!crudo) return lecturaBase(perfil);

  try {
    return normalizarLectura(JSON.parse(crudo), perfil);
  } catch {
    // Un JSON roto no debe impedir ver el historial: se cae a la lectura base.
    return lecturaBase(perfil);
  }
}

function aDiagnostico(fila: FilaSesion): DiagnosticoGuardado | null {
  const guardado = (fila.segment_scores ?? {}) as Record<string, unknown>;
  const respuestas = (guardado.respuestas ?? {}) as Respuestas;

  // Sin respuestas no se puede reconstruir el perfil: la fila se descarta en vez
  // de mostrar un diagnóstico inventado.
  if (Object.keys(respuestas).length === 0) return null;

  const perfil = calcularPerfil(respuestas);

  return {
    id: fila.id,
    completadaEn: fila.completed_at,
    duracionSegundos: fila.duration_seconds,
    modo: fila.source,
    dispositivo: fila.device,
    motor: fila.engine_version,
    motorAntiguo: Boolean(fila.engine_version && fila.engine_version !== VERSION_MOTOR),
    perfil,
    lectura: lecturaGuardada(fila.ai_summary_md, perfil),
    comentario: typeof guardado.comentario === "string" ? guardado.comentario : null,
    nombreDeclarado:
      typeof guardado.nombre_declarado === "string" ? guardado.nombre_declarado : null,
    confianza: typeof guardado.confianza === "string" ? guardado.confianza : null,
  };
}

/**
 * Los diagnósticos DEL MIEMBRO, del más reciente al más antiguo.
 *
 * POR QUÉ SE FILTRA POR USUARIO AQUÍ Y NO SE DEJA SOLO A LA RLS
 *
 * El primer intento confió en la RLS (`journey_sessions_select_self`) y no filtró.
 * Funciona para un miembro corriente… y falla justo para quien más lo va a usar:
 * un administrador. La policy `journey_sessions_select_admin` le deja ver TODAS
 * las sesiones, así que «Mi Camino» le mostraba los diagnósticos de los demás.
 * Y en CEDEM los administradores son los consultores: Carlos habría abierto su
 * historial y habría visto el de todo el mundo.
 *
 * Lección: una consulta sin filtro se apoya en la RLS, y la RLS responde «¿puede
 * verlo?», no «¿es suyo?». Cuando la pregunta es la segunda, hay que preguntarla.
 */
export async function obtenerMisDiagnosticos(limite = 12): Promise<DiagnosticoGuardado[]> {
  if (!supabaseConfigurado()) return [];

  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("journey_sessions")
    .select(
      "id, completed_at, duration_seconds, source, device, engine_version, ai_summary_md, segment_scores",
    )
    .eq("user_id", user.id)
    .eq("status", "completada")
    .order("completed_at", { ascending: false })
    .limit(limite);

  if (error || !data) return [];

  return (data as FilaSesion[])
    .map(aDiagnostico)
    .filter((d): d is DiagnosticoGuardado => d !== null);
}
