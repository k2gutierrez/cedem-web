import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { marcarEnviadoAMano, reintentarCola } from "@/app/acciones/correos";
import { Container } from "@/components/ui/Container";
import { obtenerSesion } from "@/lib/auth/sesion";
import { correoConfigurado, remitente } from "@/lib/correo/enviar";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Correos",
  robots: { index: false, follow: false },
};

/**
 * La cola de correos.
 *
 * POR QUÉ ESTA PANTALLA EXISTE
 *
 * La plataforma quiere mandar correos —la lectura del Camino, el aviso al equipo,
 * los enlaces de acceso— pero **todavía no hay proveedor configurado**. Sin esta
 * pantalla, esos correos se perderían en silencio: el sistema los daría por
 * enviados y nadie los leería.
 *
 * Aquí están todos, con su texto completo y listo para copiar. Mientras no haya
 * proveedor, el equipo los manda desde su correo en un minuto; el día que se
 * configure, el botón de reenviar los saca todos de golpe.
 *
 * CÓMO SE USA
 *
 *   1. Se abre el que toca, se copian destinatario, asunto y texto.
 *   2. Se pega en el correo del equipo y se manda.
 *   3. Se marca como enviado, para que no se mande dos veces ni se pierda la cuenta.
 */
export default async function PaginaCorreos() {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/app");

  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("email_outbox")
    .select("id, para, asunto, cuerpo_texto, tipo, estado, error, enviado_at, enviado_por, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const correos = (data ?? []) as unknown as {
    id: string;
    para: string;
    asunto: string;
    cuerpo_texto: string | null;
    tipo: string;
    estado: string;
    error: string | null;
    enviado_at: string | null;
    enviado_por: string | null;
    created_at: string;
  }[];

  const configurado = correoConfigurado();
  const pendientes = correos.filter((c) => c.estado === "pendiente");
  const fallidos = correos.filter((c) => c.estado === "fallido");
  const enviados = correos.filter((c) => c.estado === "enviado");

  const ETIQUETA_TIPO: Record<string, string> = {
    camino: "Lectura del Camino",
    "aviso-equipo": "Aviso al equipo",
    acceso: "Acceso",
    invitacion: "Invitación",
    membresia: "Membresía",
    aviso: "Aviso",
  };

  return (
    <Container size="ancho">
      <p className="tagline text-cyan dark:text-sky">Administración</p>
      <h1 className="mt-3 text-h1 text-fg">Correos</h1>
      <p className="mt-4 max-w-[64ch] text-lead text-fg-muted">
        Todo lo que la plataforma quiere mandar por correo. Mientras no haya proveedor
        configurado, aquí están los textos listos para copiarlos y enviarlos desde el correo
        del equipo.
      </p>

      {/* Estado del envío */}
      <div
        className={`mt-8 rounded-2xl border p-5 ${
          configurado
            ? "border-emerald-300/60 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10"
            : "border-amber-300/60 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-400/10"
        }`}
      >
        <p className="font-display text-sm font-bold text-fg">
          {configurado
            ? "El envío automático está encendido"
            : "El envío automático todavía no está configurado"}
        </p>
        <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-fg-muted">
          {configurado ? (
            <>
              Los correos salen solos desde <code className="font-mono text-xs">{remitente()}</code>.
              Lo que quede pendiente o fallido se puede reintentar aquí.
            </>
          ) : (
            <>
              Falta configurar el servidor de correo de CEDEM (Google Workspace). Hasta
              entonces, <b>los correos no se pierden</b>: quedan abajo, con su texto, para
              mandarlos a mano. Los pasos están en <code>docs/18-correo-de-cedem.md</code>.
            </>
          )}
        </p>

        {configurado && pendientes.length + fallidos.length > 0 ? (
          <form action={reintentarCola} className="mt-4">
            <button
              type="submit"
              className="rounded-full bg-navy px-4 py-2 font-display text-sm font-semibold text-white transition-colors hover:bg-cyan dark:bg-sky dark:text-navy"
            >
              Reintentar los {pendientes.length + fallidos.length} que faltan
            </button>
          </form>
        ) : null}
      </div>

      {/* Cifras */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { etiqueta: "Pendientes de mandar", valor: pendientes.length, tono: "text-amber-700 dark:text-amber-300" },
          { etiqueta: "Enviados", valor: enviados.length, tono: "text-emerald-700 dark:text-emerald-300" },
          { etiqueta: "Fallidos", valor: fallidos.length, tono: "text-red-700 dark:text-red-300" },
        ].map((c) => (
          <div key={c.etiqueta} className="rounded-2xl border border-border bg-bg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">
              {c.etiqueta}
            </p>
            <p className={`mt-2 font-display text-2xl font-bold ${c.tono}`}>{c.valor}</p>
          </div>
        ))}
      </div>

      {/* La lista */}
      {correos.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-bg p-8">
          <p className="text-sm leading-relaxed text-fg-muted">
            Todavía no hay correos en la cola. Aquí aparecerán en cuanto alguien termine el
            Camino del Dueño, o cuando el equipo tenga que recibir un aviso.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {correos.map((c) => (
            <li key={c.id} className="rounded-2xl border border-border bg-bg p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-[240px] flex-1">
                  <p className="font-display text-sm font-bold text-fg">{c.asunto}</p>
                  <p className="mt-0.5 text-sm text-fg-muted">
                    Para: <span className="font-mono text-xs">{c.para}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-sky/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-navy dark:text-sky">
                    {ETIQUETA_TIPO[c.tipo] ?? c.tipo}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                      c.estado === "enviado"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : c.estado === "fallido"
                          ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                    }`}
                  >
                    {c.estado}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-xs text-fg-subtle">
                {new Date(c.created_at).toLocaleString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {c.enviado_at
                  ? ` · enviado ${c.enviado_por === "proveedor" ? "automáticamente" : "a mano"}`
                  : ""}
                {c.error ? ` · ${c.error.slice(0, 90)}` : ""}
              </p>

              {c.estado !== "enviado" ? (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-navy dark:text-sky">
                    Ver el texto para mandarlo a mano
                  </summary>

                  <div className="mt-4 rounded-xl border border-border bg-bg-soft p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                      Texto del correo
                    </p>
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-fg-muted">
                      {c.cuerpo_texto ?? "(sin texto)"}
                    </pre>
                  </div>

                  <form action={marcarEnviadoAMano} className="mt-3">
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-border px-4 py-2 font-display text-sm font-semibold text-fg-muted transition-colors hover:border-cyan hover:text-fg dark:hover:border-sky"
                    >
                      Ya lo mandé a mano
                    </button>
                  </form>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-xs leading-relaxed text-fg-subtle">
        Los correos se guardan antes de intentar enviarlos: si el proveedor falla, el aviso no
        se pierde. Es la diferencia entre «no se pudo enviar» y «no se pudo enviar, está en la
        cola».
      </p>
    </Container>
  );
}
