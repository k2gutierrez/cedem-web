/**
 * Traducción de los errores de la base a mensajes para el dueño.
 *
 * EL PROBLEMA QUE RESUELVE
 *
 * Las funciones de la base escriben sus errores **para que los lea el dueño**:
 *
 *     «Ya tienes una membresía activa. Escríbenos si necesitas cambiarla.»
 *     «Necesitas una membresía activa para descargar este material.»
 *     «Solo super_admin puede otorgar roles administrativos.»
 *
 * Son mensajes mejores que cualquiera que se pueda escribir en el frontend, porque
 * los redacta quien conoce la regla. Pero el frontend los estaba tirando a la
 * basura: los clasificaba con una lista de palabras clave («¿contiene *invitaci*,
 * *código*, *expir*?») y, si no coincidía, mostraba un genérico «escríbenos y lo
 * revisamos contigo».
 *
 * El resultado era el peor de los dos mundos: el dueño leía un mensaje que no le
 * decía nada y el equipo recibía consultas por cosas que la propia pantalla podía
 * haber explicado. Pasó con el canje de una invitación teniendo membresía activa:
 * la base decía exactamente qué pasaba y la pantalla decía «no pudimos».
 *
 * CÓMO SE DECIDE AHORA
 *
 * Por el código de error, no por las palabras. PostgreSQL distingue lo que la
 * función decide (`raise exception`, que en este esquema siempre lleva un mensaje
 * escrito para el dueño) de lo que se rompe por debajo (permisos, conexión,
 * columnas que no existen). Lo primero se muestra; lo segundo no, porque un
 * «permission denied for table contents» no le sirve a nadie que no sea quien
 * programa — y para eso está el registro del servidor.
 */

/** Códigos con los que este esquema comunica reglas de negocio al usuario. */
const CODIGOS_HABLADOS = new Set([
  "P0001", // raise exception: el caso normal, con mensaje escrito a mano
  "22023", // parámetro inválido (dato faltante o mal formado)
  "23505", // ya existe (membresía activa, código repetido)
  "23503", // referencia que no existe (plan, usuario)
  "23514", // una restricción de la tabla no se cumple
  "42501", // falta un permiso (rol insuficiente): el mensaje explica cuál
]);

type ErrorBase = { message?: string; code?: string; details?: string } | null | undefined;

/**
 * Devuelve el mensaje que hay que enseñar.
 *
 * @param error    el error tal como lo entrega supabase-js
 * @param alterno  qué decir cuando la base no escribió nada para el dueño
 * @param contexto para el registro del servidor: dónde ocurrió
 */
export function mensajeDeBase(error: ErrorBase, alterno: string, contexto: string): string {
  if (!error) return alterno;

  const codigo = error.code ?? "";
  const mensaje = (error.message ?? "").trim();

  // Siempre al registro del servidor: sin esto, un fallo técnico es invisible.
  console.error(`[${contexto}] ${codigo || "sin código"}: ${mensaje || "(sin mensaje)"}`);

  if (mensaje && CODIGOS_HABLADOS.has(codigo)) return mensaje;

  return alterno;
}
