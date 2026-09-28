import type { Perfil } from "@/lib/camino/puntuar";
import { ETIQUETAS_BASE, EJERCICIOS_BASE, articulosPara } from "@/content/camino/catalogo";
import { lecturaBase, type Lectura } from "@/lib/ia/lectura";
import { enviarCorreo } from "@/lib/correo/enviar";

/**
 * El correo que llega después del Camino del Dueño.
 *
 * Es el correo más importante de la plataforma, y hasta hace poco no existía: el
 * dueño terminaba el recorrido, dejaba su correo, se le creaba la cuenta y no
 * recibía nada. Ni su lectura, ni la forma de volver.
 *
 * QUÉ LLEVA, Y POR QUÉ ESO Y NO OTRA COSA
 *
 * Lo mismo que vio en pantalla, y nada más: la observación, tres artículos y tres
 * ejercicios. Sin promociones, sin «descubre todo lo que CEDEM tiene para ti» y sin
 * pedirle que compre nada. Es la promesa del Camino —«cinco minutos y te llevas
 * algo útil»— y el correo tiene que cumplirla igual que la pantalla.
 *
 * Al final, y en una línea discreta, cómo volver: ya tiene cuenta (se le creó al
 * dejar el correo) y puede pedir su contraseña cuando quiera. Eso es todo el
 * «call to action».
 */

const NAVY = "#0F206C";
const CYAN = "#00A1E0";
const SKY = "#6CC5E9";

const NOMBRE_DISPERSANTE: Record<string, string> = {
  desenfoque: "el desenfoque",
  soledad: "la soledad",
  tolerancia: "la tolerancia",
};

function filaVerbo(nombre: string, valor: number, critico: boolean) {
  const color = critico ? CYAN : "#c9d3e8";
  return `
    <tr>
      <td style="padding:6px 0;font-size:14px;color:${critico ? "#0d1424" : "#52607a"};${critico ? "font-weight:700" : ""}">${nombre}</td>
      <td style="padding:6px 0;text-align:right;font-size:13px;color:#7b879e;width:44px">${valor}</td>
      <td style="padding:6px 0 6px 12px;width:150px">
        <div style="height:6px;border-radius:99px;background:#e3e7ef;overflow:hidden">
          <div style="height:6px;width:${Math.max(3, Math.min(100, valor))}%;border-radius:99px;background:${color}"></div>
        </div>
      </td>
    </tr>`;
}

function bloque(titulo: string, contenido: string) {
  return `
    <tr><td style="padding:26px 0 6px">
      <p style="margin:0;font-family:Montserrat,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:${NAVY}">${titulo}</p>
    </td></tr>
    <tr><td>${contenido}</td></tr>`;
}

export function correoDelCamino(datos: {
  nombre: string;
  perfil: Perfil;
  lectura?: Lectura | null;
  slug?: string | null;
}): { asunto: string; html: string } {
  const { perfil } = datos;
  const lectura = datos.lectura ?? lecturaBase(perfil);
  const articulos = articulosPara(ETIQUETAS_BASE[perfil.arquetipo] ?? []);
  const ejercicios = lectura.ejercicios?.length
    ? lectura.ejercicios
    : (EJERCICIOS_BASE[perfil.arquetipo] ?? []);

  const nombrePila = datos.nombre.trim().split(/\s+/)[0] ?? "";
  const saludo = nombrePila ? `${nombrePila}: ` : "";

  /* El asunto ya no anuncia un verbo ni una etiqueta: dice que hay una observación,
     que es lo que el dueño recibe. Un asunto como «te atoras en multiplicar» ponía
     el diagnóstico por delante del trabajo, y en la bandeja de entrada eso se lee
     como un juicio. */
  const asunto = `${saludo}esto es lo que observamos en tu caso`;

  /* La frase de espejo la escribe la IA cuando hay IA; si no, es la del motor. */
  const titular = lectura.titular;
  const parrafos = lectura.observacion.filter((p) => p.trim().length > 0);

  const html = `<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f1f1">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f1f1;padding:28px 14px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:'Source Sans 3',Helvetica,Arial,sans-serif">

  <tr><td style="background:${NAVY};padding:26px 32px">
    <span style="font-family:Montserrat,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;color:#ffffff">CEDEM</span>
    <span style="font-family:Montserrat,Helvetica,Arial,sans-serif;font-size:10px;font-weight:600;color:${SKY};letter-spacing:.18em;margin-left:10px">2.0</span>
  </td></tr>

  <tr><td style="padding:34px 32px 0">
    <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${CYAN}">Observación de CEDEM</p>
    <h1 style="margin:0 0 16px;font-family:Montserrat,Helvetica,Arial,sans-serif;font-size:25px;line-height:1.25;color:${NAVY}">
      ${titular}
    </h1>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#7b879e">Camino del Dueño · lectura hecha para tu caso</p>
  </td></tr>

  <tr><td style="padding:26px 32px 0">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3e7ef;border-radius:12px;padding:18px 20px">
      <tr><td colspan="3" style="padding-bottom:10px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7b879e">
        Dónde está tu valor
      </td></tr>
      ${filaVerbo("Generar valor", perfil.scoreGenerar, perfil.verboCritico === "generar")}
      ${filaVerbo("Multiplicar valor", perfil.scoreMultiplicar, perfil.verboCritico === "multiplicar")}
      ${filaVerbo("Capturar valor", perfil.scoreCapturar, perfil.verboCritico === "capturar")}
    </table>
  </td></tr>

  <tr><td style="padding:24px 32px 0">
    ${parrafos
      .map(
        (parrafo, i) =>
          `<p style="margin:0 0 ${i === parrafos.length - 1 ? "0" : "14px"};font-size:15px;line-height:1.65;color:#3c4257">${parrafo}</p>`,
      )
      .join("")}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#7b879e">— Equipo de consultoría de CEDEM</p>
  </td></tr>

  ${
    perfil.dispersanteDominante
      ? `<tr><td style="padding:22px 32px 0">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#52607a">
            <b style="color:#0d1424">Lo que más te frena:</b> ${NOMBRE_DISPERSANTE[perfil.dispersanteDominante] ?? perfil.dispersanteDominante}.
          </p>
        </td></tr>`
      : ""
  }

  <tr><td style="padding:0 32px"><table width="100%" cellpadding="0" cellspacing="0">
    ${bloque(
      "Para leer esta semana",
      `<ul style="margin:0;padding-left:18px">${articulos
        .map(
          (a) =>
            `<li style="margin-bottom:8px;font-size:15px;line-height:1.6;color:#3c4257">${a.titulo}</li>`,
        )
        .join("")}</ul>
       <p style="margin:10px 0 0;font-size:13px;color:#7b879e">Están abiertos en cedem.com.mx/recursos</p>`,
    )}
    ${bloque(
      "Para hacer esta semana",
      `<ol style="margin:0;padding-left:18px">${ejercicios
        .map(
          (e) =>
            `<li style="margin-bottom:12px;font-size:15px;line-height:1.6;color:#3c4257">
               <b style="color:#0d1424">${e.titulo}</b><br><span style="color:#52607a">${e.detalle}</span>
             </li>`,
        )
        .join("")}</ol>`,
    )}
  </table></td></tr>

  <tr><td style="padding:30px 32px 0">
    <a href="${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cedem.com.mx").replace(/\/$/, "")}/app"
       style="display:inline-block;background:${NAVY};color:#ffffff;font-family:Montserrat,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:999px">
      Ver mi lectura completa
    </a>
  </td></tr>

  <tr><td style="padding:22px 32px 0">
    <p style="margin:0;font-size:13px;line-height:1.65;color:#7b879e">
      Tu avance quedó guardado con este correo, así que puedes volver cuando quieras. Si más
      adelante no recuerdas tu contraseña, se pide desde la pantalla de acceso y te llega un
      enlace.
    </p>
  </td></tr>

  <tr><td style="border-top:1px solid #e5e7eb;padding:22px 32px 30px;margin-top:10px">
    <p style="margin:0 0 8px;font-size:13px;line-height:1.65;color:#6b7280">
      CEDEM · Centro de Dueñez Empresaria. Acompañamos a dueños y dueñas a ejercer su rol
      desde 1985.
    </p>
    <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af">
      «Dueñez®» es una marca registrada por Carlos A. Dumois Núñez.
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  return { asunto, html };
}

/** Encola (y envía, si hay proveedor) el correo del Camino. */
export async function avisarDelCamino(datos: {
  correo: string;
  nombre: string;
  perfil: Perfil;
  lectura?: Lectura | null;
  sessionId: string;
}): Promise<void> {
  const { asunto, html } = correoDelCamino({
    nombre: datos.nombre,
    perfil: datos.perfil,
    lectura: datos.lectura,
  });

  await enviarCorreo({
    para: datos.correo,
    asunto,
    html,
    tipo: "camino",
    entityTable: "journey_sessions",
    entityId: datos.sessionId,
  });
}

/* -------------------------------------------------------------------------- */
/* El aviso al equipo                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Aviso interno cuando un diagnóstico sale caliente o urgente.
 *
 * Va al correo del equipo, no al dueño. Es el otro correo que faltaba: hoy el
 * aviso solo se ve dentro del panel, así que si nadie entra ese día, un dueño que
 * pidió ayuda se queda esperando.
 */
export async function avisarAlEquipo(datos: {
  destinatarios: string[];
  nombre: string;
  correo: string;
  temperatura: string;
  verbo: string;
  sessionId: string;
  comentario?: string | null;
}): Promise<void> {
  const sitio = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cedem.com.mx").replace(/\/$/, "");
  const urgente = datos.temperatura === "urgente";

  const html = `<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f1f1;font-family:'Source Sans 3',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 14px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden">
  <tr><td style="background:${urgente ? "#a3231f" : "#9a5b00"};padding:16px 26px">
    <p style="margin:0;font-family:Montserrat,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#fff">
      ${urgente ? "Un dueño pidió hablar pronto" : "Un dueño quiere conversar"}
    </p>
  </td></tr>
  <tr><td style="padding:24px 26px">
    <p style="margin:0 0 6px;font-family:Montserrat,Helvetica,Arial,sans-serif;font-size:19px;color:#0F206C">
      ${datos.nombre}
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#52607a">${datos.correo}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3c4257">
      Terminó el Camino del Dueño y su lectura apunta a <b>${datos.verbo}</b>.
      ${datos.comentario ? `Escribió: «${datos.comentario}»` : ""}
    </p>
    <a href="${sitio}/app/admin/camino"
       style="display:inline-block;background:#0F206C;color:#fff;font-family:Montserrat,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:999px">
      Ver el diagnóstico completo
    </a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  for (const para of datos.destinatarios) {
    await enviarCorreo({
      para,
      asunto: `${urgente ? "Urgente" : "Para conversar"}: ${datos.nombre} terminó su Camino`,
      html,
      tipo: "aviso-equipo",
      entityTable: "journey_sessions",
      entityId: datos.sessionId,
    });
  }
}
