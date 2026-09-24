import nodemailer, { type Transporter } from "nodemailer";
import { crearClienteAdmin } from "@/lib/supabase/cliente-admin";

/**
 * El correo de CEDEM.
 *
 * CÓMO FUNCIONA, Y POR QUÉ ASÍ
 *
 * Todo correo que la plataforma quiere mandar pasa por `enviarCorreo()`:
 *
 *   1. **Se guarda primero** en `email_outbox`. Siempre. Antes de intentar nada.
 *   2. Si hay proveedor configurado, se envía en el momento y se marca.
 *   3. Si no lo hay, se queda en la cola como `pendiente`, visible en el panel, con
 *      el texto listo para copiarlo y mandarlo desde el correo del equipo.
 *
 * El orden importa: guardar antes de enviar significa que un fallo del proveedor
 * —o su ausencia— no pierde el aviso. Es la diferencia entre «no se pudo enviar,
 * se perdió» y «no se pudo enviar, está en la cola».
 *
 * QUÉ HACE FALTA PARA QUE SALGA
 *
 * Tres variables en el entorno. Con Google Workspace, que es lo que CEDEM ya usa:
 *
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465
 *   SMTP_USER=circulo@cedem.com.mx          (la cuenta que envía)
 *   SMTP_PASSWORD=xxxx xxxx xxxx xxxx       (contraseña de aplicación de Google)
 *   EMAIL_FROM="CEDEM · Centro de Dueñez Empresaria <circulo@cedem.com.mx>"
 *
 * La contraseña de aplicación se genera en la cuenta de Google, con la
 * verificación en dos pasos activada: Cuenta → Seguridad → Contraseñas de
 * aplicaciones. No es la contraseña normal de la cuenta.
 */

export type TipoCorreo = "camino" | "acceso" | "aviso-equipo" | "invitacion" | "membresia" | "aviso";

export type Correo = {
  para: string;
  asunto: string;
  html: string;
  /** Versión sin formato. Si no se pasa, se deriva del HTML. */
  texto?: string;
  tipo?: TipoCorreo;
  /** De qué va, para poder rastrearlo después. */
  entityTable?: string;
  entityId?: string;
};

/** ¿Hay proveedor configurado? */
export function correoConfigurado(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASSWORD?.trim(),
  );
}

/** El remitente que verá quien recibe. */
export function remitente(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "CEDEM · Centro de Dueñez Empresaria <circulo@cedem.com.mx>"
  );
}

let transporte: Transporter | null = null;

function crearTransporte(): Transporter {
  const puerto = Number(process.env.SMTP_PORT ?? 465);

  if (!transporte) {
    transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: puerto,
      // 465 es SSL directo; 587 empieza en claro y sube con STARTTLS.
      secure: puerto === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  return transporte;
}

/** Texto plano a partir del HTML, para quien lee sin formato y para copiar a mano. */
function aTexto(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "· ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type ResultadoEnvio = { enviado: boolean; motivo?: string; id?: string };

/**
 * Encola y, si se puede, envía.
 *
 * Nunca lanza: un correo que no sale no puede tumbar la acción que lo pidió. El
 * dueño tiene que ver su diagnóstico aunque el correo falle, y el equipo tiene que
 * poder publicar un artículo aunque el aviso no salga.
 */
export async function enviarCorreo(correo: Correo): Promise<ResultadoEnvio> {
  const admin = crearClienteAdmin();
  const texto = correo.texto ?? aTexto(correo.html);

  // 1 · A la cola. Siempre, antes de intentar nada.
  const { data: fila, error: errorCola } = await admin
    .from("email_outbox")
    .insert({
      para: correo.para.trim().toLowerCase(),
      asunto: correo.asunto.slice(0, 200),
      cuerpo_html: correo.html,
      cuerpo_texto: texto,
      tipo: correo.tipo ?? "aviso",
      estado: "pendiente",
      entity_table: correo.entityTable ?? null,
      entity_id: correo.entityId ?? null,
    })
    .select("id")
    .single();

  if (errorCola || !fila) {
    console.error("[correo] no se pudo encolar:", errorCola?.message);
    return { enviado: false, motivo: "no-se-pudo-encolar" };
  }

  // 2 · Sin proveedor, se queda pendiente. No es un fallo: es el estado previsto.
  if (!correoConfigurado()) {
    console.info(
      `[correo] sin proveedor configurado · queda en cola ${fila.id} para ${correo.para} · ${correo.asunto}`,
    );
    return { enviado: false, motivo: "sin-proveedor", id: fila.id };
  }

  // 3 · Con proveedor, se envía.
  try {
    await crearTransporte().sendMail({
      from: remitente(),
      to: correo.para,
      subject: correo.asunto,
      html: correo.html,
      text: texto,
    });

    await admin
      .from("email_outbox")
      .update({
        estado: "enviado",
        enviado_at: new Date().toISOString(),
        enviado_por: "proveedor",
        error: null,
      })
      .eq("id", fila.id);

    return { enviado: true, id: fila.id };
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    console.error("[correo] el proveedor rechazó el envío:", mensaje);

    await admin
      .from("email_outbox")
      .update({ estado: "fallido", error: mensaje.slice(0, 500) })
      .eq("id", fila.id);

    return { enviado: false, motivo: mensaje, id: fila.id };
  }
}

/** Reintenta los correos que quedaron pendientes o fallidos. */
export async function reintentarPendientes(limite = 50): Promise<{ enviados: number; fallidos: number }> {
  if (!correoConfigurado()) return { enviados: 0, fallidos: 0 };

  const admin = crearClienteAdmin();
  const { data } = await admin
    .from("email_outbox")
    .select("id, para, asunto, cuerpo_html, cuerpo_texto")
    .in("estado", ["pendiente", "fallido"])
    .order("created_at")
    .limit(limite);

  let enviados = 0;
  let fallidos = 0;

  for (const fila of data ?? []) {
    try {
      await crearTransporte().sendMail({
        from: remitente(),
        to: fila.para as string,
        subject: fila.asunto as string,
        html: fila.cuerpo_html as string,
        text: (fila.cuerpo_texto as string) ?? undefined,
      });

      await admin
        .from("email_outbox")
        .update({
          estado: "enviado",
          enviado_at: new Date().toISOString(),
          enviado_por: "proveedor",
          error: null,
        })
        .eq("id", fila.id);
      enviados++;
    } catch (e) {
      await admin
        .from("email_outbox")
        .update({
          estado: "fallido",
          intentos: (data?.length ?? 0) > 0 ? 1 : 1,
          error: (e instanceof Error ? e.message : String(e)).slice(0, 500),
        })
        .eq("id", fila.id);
      fallidos++;
    }
  }

  return { enviados, fallidos };
}
