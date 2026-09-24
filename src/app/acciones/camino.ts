"use server";

import { revalidatePath } from "next/cache";
import { crearClienteAdmin } from "@/lib/supabase/cliente-admin";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { supabaseConfigurado } from "@/lib/supabase/configurado";
import { calcularPerfil, type Perfil, type Respuestas } from "@/lib/camino/puntuar";
import { VERSION_MOTOR } from "@/content/camino/config";

export type ResultadoGuardado = { ok: boolean; mensaje: string };

/**
 * Guarda un diagnóstico del Camino del Dueño.
 *
 * Dos decisiones importantes:
 *
 * 1. **El perfil se recalcula en el servidor.** El navegador manda las
 *    respuestas, no el resultado: si alguien manipulara el cliente, el
 *    diagnóstico guardado seguiría siendo el correcto.
 * 2. **No se exige cuenta.** El dueño puede hacer el recorrido entero sin
 *    registrarse; al dejar su correo se le crea la cuenta (sin contraseña
 *    todavía) y su diagnóstico queda ligado a ella. Así CEDEM puede dar
 *    seguimiento sin haber puesto una sola barrera antes del valor.
 *
 * El perfil completo se guarda en `journey_sessions.segment_scores` (jsonb)
 * además de las filas de `journey_results`, para que el panel del equipo tenga
 * todo el contexto sin depender del esquema de preguntas.
 */
export async function guardarDiagnostico(datos: {
  respuestas: Respuestas;
  nombre: string;
  correo?: string;
  whatsapp?: string;
  comentario?: string;
  consentimiento: boolean;
  segundos: number;
  modo: "normal" | "express";
}): Promise<ResultadoGuardado> {
  if (!supabaseConfigurado()) {
    return { ok: false, mensaje: "La plataforma todavía no está conectada." };
  }

  if (!datos.consentimiento) {
    return { ok: false, mensaje: "Falta tu consentimiento para guardar las respuestas." };
  }

  const perfil: Perfil = calcularPerfil(datos.respuestas);
  const correo = datos.correo?.trim().toLowerCase() || null;

  /* --- 1 · ¿Quién es? ---------------------------------------------------- */

  let userId: string | null = null;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) userId = user.id;

  // Sin sesión: se busca la cuenta por correo y, si no existe, se crea.
  if (!userId && correo) {
    const admin = crearClienteAdmin();
    const { data: existente } = await admin
      .from("profiles")
      .select("id")
      .eq("email", correo)
      .maybeSingle();

    if (existente?.id) {
      userId = existente.id;
    } else {
      const { data: creado, error } = await admin.auth.admin.createUser({
        email: correo,
        email_confirm: false,
        user_metadata: { full_name: datos.nombre, origen: "camino-del-dueno" },
      });
      if (error) {
        return {
          ok: false,
          mensaje:
            "No pudimos guardar tu diagnóstico. Escríbenos por WhatsApp y lo revisamos contigo.",
        };
      }
      userId = creado.user?.id ?? null;
    }
  }

  if (!userId) {
    return {
      ok: false,
      mensaje: "Necesitamos tu correo para guardar la lectura y darte seguimiento.",
    };
  }

  /* --- 2 · La sesión del Camino ------------------------------------------ */

  const admin = crearClienteAdmin();

  const { data: sesion, error: errorSesion } = await admin
    .from("journey_sessions")
    .insert({
      user_id: userId,
      status: "completada",
      started_at: new Date(Date.now() - datos.segundos * 1000).toISOString(),
      completed_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      answered_count: Object.keys(datos.respuestas).filter((k) => !k.startsWith("__")).length,
      total_questions: 15,
      duration_seconds: datos.segundos,
      score_total: perfil.indice,
      profile_label: perfil.arquetipo,
      engine_version: VERSION_MOTOR,
      device: datos.whatsapp ? "movil" : "web",
      source: datos.modo,
      // Todo el contexto en un solo sitio: el equipo lo ve completo en el panel.
      segment_scores: {
        v: 1,
        verbo_critico: perfil.verboCritico,
        banda: perfil.banda,
        dispersante: perfil.dispersanteDominante,
        temperatura: perfil.temperatura,
        temperatura_etiqueta: perfil.temperaturaEtiqueta,
        scores: {
          generar: perfil.scoreGenerar,
          multiplicar: perfil.scoreMultiplicar,
          capturar: perfil.scoreCapturar,
        },
        friccion: {
          desenfoque: perfil.desenfoque,
          soledad: perfil.soledad,
          tolerancia: perfil.tolerancia,
          total: perfil.friccion,
        },
        concentracion: perfil.concentracion,
        perfilado: {
          tamano: perfil.tamano,
          etapa: perfil.etapa,
          rol: perfil.rol,
          sucesion: perfil.sucesion,
          sucesion_reciente: perfil.sucesionReciente,
        },
        nivel_sugerido: perfil.nivel,
        confianza: perfil.confianza,
        comentario: datos.comentario ?? null,
        whatsapp: datos.whatsapp ?? null,
        nombre_declarado: datos.nombre,
        respuestas: datos.respuestas,
      },
    })
    .select("id")
    .single();

  if (errorSesion || !sesion) {
    console.error("[camino] no se pudo guardar la sesión:", errorSesion?.message);
    return { ok: false, mensaje: `No se pudo guardar la sesión: ${errorSesion?.message}` };
  }

  /* --- 3 · El resultado por verbo ---------------------------------------- */

  const nivel = (puntaje: number) =>
    puntaje >= 76 ? "solido" : puntaje >= 51 ? "en_desarrollo" : puntaje >= 26 ? "en_desarrollo" : "critico";

  const filas = (
    [
      ["generar", perfil.scoreGenerar],
      ["multiplicar", perfil.scoreMultiplicar],
      ["capturar", perfil.scoreCapturar],
    ] as const
  ).map(([dimension, score], i) => ({
    session_id: sesion.id,
    dimension,
    score,
    level: nivel(score),
    priority: dimension === perfil.verboCritico ? 1 : i + 2,
    is_primary: dimension === perfil.verboCritico,
    engine_version: VERSION_MOTOR,
    diagnosis_md:
      dimension === perfil.verboCritico
        ? `Verbo más débil: ${perfil.focos.map((f) => f.componente).join(" y ") || dimension}.`
        : null,
    computed_at: new Date().toISOString(),
  }));

  const { error: errorResultados } = await admin.from("journey_results").insert(filas);
  if (errorResultados) {
    console.error("[camino] no se pudo guardar el detalle:", errorResultados.message);
  }
  if (errorResultados) {
    return {
      ok: false,
      mensaje: `Se guardó la sesión pero no el detalle: ${errorResultados.message}`,
    };
  }

  /* --- 4 · Respuestas individuales --------------------------------------- */

  // Solo las que existen como pregunta en la base (el seed trae seis; el
  // recorrido tiene quince). Las demás ya viven en segment_scores.
  const mapa: Record<string, string> = {
    Q4: "g1",
    Q5: "g2",
    Q6: "m1",
    Q7: "m2",
    Q9: "c1",
    Q8: "c2",
  };

  const { data: preguntas } = await admin
    .from("journey_questions")
    .select("id, code")
    .in("code", Object.values(mapa));

  if (preguntas?.length) {
    const porCodigo = new Map(preguntas.map((p) => [p.code, p.id]));
    const respuestas: {
      session_id: string;
      question_id: string;
      value: { opcion: string };
      answered_at: string;
    }[] = [];

    for (const [clave, codigo] of Object.entries(mapa)) {
      const elegida = datos.respuestas[clave];
      const questionId = porCodigo.get(codigo);
      if (!elegida || !questionId) continue;
      respuestas.push({
        session_id: sesion.id,
        question_id: questionId,
        value: { opcion: elegida },
        answered_at: new Date().toISOString(),
      });
    }

    if (respuestas.length) {
      await admin.from("journey_answers").insert(respuestas);
    }
  }

  revalidatePath("/app/admin/camino");
  return { ok: true, mensaje: "Listo, guardamos tu lectura." };
}
