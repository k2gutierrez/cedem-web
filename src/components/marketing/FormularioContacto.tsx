"use client";

import { useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { IconoFlecha } from "@/components/ui/Iconos";

const WHATSAPP = "523322576343";

const tamanos = [
  "Menos de 1 millón de USD",
  "Entre 1 y 5 millones de USD",
  "Entre 5 y 20 millones de USD",
  "Más de 20 millones de USD",
  "Prefiero no decirlo",
];

/**
 * Formulario de contacto.
 *
 * Hoy funciona sin servidor: arma el mensaje y lo abre en WhatsApp, que es el
 * canal que CEDEM ya usa. Cuando la base de datos esté conectada (Fase 2) se
 * guardará además como prospecto y se enviará por correo.
 *
 * TODO (Fase 2): guardar el envío en Supabase y notificar al equipo.
 */
export function FormularioContacto() {
  const [datos, setDatos] = useState({
    nombre: "",
    empresa: "",
    correo: "",
    telefono: "",
    tamano: tamanos[1],
    mensaje: "",
  });
  const [enviado, setEnviado] = useState(false);

  function actualizar(campo: keyof typeof datos, valor: string) {
    setDatos((previos) => ({ ...previos, [campo]: valor }));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();

    const texto = [
      `Hola CEDEM, quiero información.`,
      ``,
      `Nombre: ${datos.nombre}`,
      datos.empresa ? `Empresa: ${datos.empresa}` : null,
      `Correo: ${datos.correo}`,
      datos.telefono ? `Teléfono: ${datos.telefono}` : null,
      `Ventas anuales: ${datos.tamano}`,
      datos.mensaje ? `` : null,
      datos.mensaje ? `Mensaje: ${datos.mensaje}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://api.whatsapp.com/send?phone=${WHATSAPP}&text=${encodeURIComponent(texto)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setEnviado(true);
  }

  const campo =
    "w-full rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
  const etiqueta = "mb-1.5 block text-[13px] font-medium text-fg-muted";

  if (enviado) {
    return (
      <div className="rounded-2xl border border-border bg-bg-soft p-8 text-center">
        <p className="font-display text-lg font-bold text-fg">
          Se abrió WhatsApp con tu mensaje
        </p>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">
          Si no se abrió, escríbenos directamente al{" "}
          <a
            href={`https://api.whatsapp.com/send?phone=${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-navy hover:text-cyan dark:text-sky"
          >
            +52 33 2257 6343
          </a>
          . Te responderemos a la brevedad.
        </p>
        <button
          type="button"
          onClick={() => setEnviado(false)}
          className="mt-6 text-sm font-semibold text-navy hover:text-cyan dark:text-sky"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="nombre" className={etiqueta}>
            Nombre completo *
          </label>
          <input
            id="nombre"
            required
            value={datos.nombre}
            onChange={(e) => actualizar("nombre", e.target.value)}
            className={campo}
            placeholder="Cómo te llamas"
          />
        </div>
        <div>
          <label htmlFor="empresa" className={etiqueta}>
            Empresa
          </label>
          <input
            id="empresa"
            value={datos.empresa}
            onChange={(e) => actualizar("empresa", e.target.value)}
            className={campo}
            placeholder="Nombre de tu empresa"
          />
        </div>
        <div>
          <label htmlFor="correo" className={etiqueta}>
            Correo electrónico *
          </label>
          <input
            id="correo"
            type="email"
            required
            value={datos.correo}
            onChange={(e) => actualizar("correo", e.target.value)}
            className={campo}
            placeholder="tucorreo@empresa.com"
          />
        </div>
        <div>
          <label htmlFor="telefono" className={etiqueta}>
            Teléfono
          </label>
          <input
            id="telefono"
            type="tel"
            value={datos.telefono}
            onChange={(e) => actualizar("telefono", e.target.value)}
            className={campo}
            placeholder="+52 ..."
          />
        </div>
      </div>

      <div>
        <label htmlFor="tamano" className={etiqueta}>
          Ventas anuales de tu empresa
        </label>
        <select
          id="tamano"
          value={datos.tamano}
          onChange={(e) => actualizar("tamano", e.target.value)}
          className={campo}
        >
          {tamanos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="mensaje" className={etiqueta}>
          ¿Qué te gustaría resolver?
        </label>
        <textarea
          id="mensaje"
          rows={4}
          value={datos.mensaje}
          onChange={(e) => actualizar("mensaje", e.target.value)}
          className={`${campo} resize-y`}
          placeholder="Cuéntanos brevemente tu situación"
        />
      </div>

      <Boton type="submit" tamano="lg" className="w-full sm:w-auto">
        Enviar mensaje
        <IconoFlecha className="h-4 w-4" />
      </Boton>

      <p className="text-[12.5px] leading-relaxed text-fg-subtle">
        Al enviar aceptas que CEDEM te contacte para dar seguimiento a tu solicitud.
        Tus datos no se comparten con terceros.
      </p>
    </form>
  );
}
