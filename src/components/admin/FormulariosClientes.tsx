"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Boton } from "@/components/ui/Boton";
import {
  guardarCliente,
  guardarTestimonio,
  type EstadoAdmin,
} from "@/app/acciones/equipo";

const campo =
  "w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-[14px] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
const etiqueta = "mb-1 block text-[12px] font-medium text-fg-muted";
const avisoError =
  "rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-[13px] text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200";
const avisoOk =
  "rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200";

function Enviar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending}>
      {pending ? "Guardando…" : texto}
    </Boton>
  );
}

export type Pais = { code: string; name_es: string };

/* -------------------------------------------------------------------------- */
/* Cliente                                                                    */
/* -------------------------------------------------------------------------- */

export function FormularioCliente({ paises }: { paises: Pais[] }) {
  const [estado, accion] = useActionState(guardarCliente, {} as EstadoAdmin);

  return (
    <form action={accion} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cliente-nombre" className={etiqueta}>
            Empresa *
          </label>
          <input
            id="cliente-nombre"
            name="nombre"
            required
            className={campo}
            placeholder="Nombre comercial"
          />
        </div>
        <div>
          <label htmlFor="cliente-pais" className={etiqueta}>
            País *
          </label>
          <select id="cliente-pais" name="pais" required className={campo} defaultValue="MX">
            {paises.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name_es}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cliente-ciudad" className={etiqueta}>
            Ciudad
          </label>
          <input id="cliente-ciudad" name="ciudad" className={campo} placeholder="Monterrey" />
        </div>
        <div>
          <label htmlFor="cliente-sector" className={etiqueta}>
            Sector
          </label>
          <input
            id="cliente-sector"
            name="sector"
            className={campo}
            placeholder="Retail, alimentos, manufactura…"
          />
        </div>
        <div>
          <label htmlFor="cliente-desde" className={etiqueta}>
            Cliente desde (año)
          </label>
          <input
            id="cliente-desde"
            name="desde"
            type="number"
            min="1985"
            max="2100"
            className={campo}
            placeholder="2015"
          />
        </div>
      </div>

      <div>
        <label htmlFor="cliente-notas" className={etiqueta}>
          Notas internas (no se publican)
        </label>
        <textarea
          id="cliente-notas"
          name="notas"
          rows={2}
          className={`${campo} resize-y`}
          placeholder="Contexto del acompañamiento, resultados, quién los atiende…"
        />
      </div>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-[12px] font-medium text-fg-muted">
          Permisos de publicación
        </legend>
        <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-fg-muted">
          <input type="checkbox" name="autorizado" className="mt-1 h-4 w-4 accent-[#00a1e0]" />
          <span>
            Tenemos autorización por escrito para usar su marca. <strong>Sin esto no se
            publica el logo.</strong>
          </span>
        </label>
        <label className="flex items-center gap-2.5 text-[13px] text-fg-muted">
          <input
            type="checkbox"
            name="en_mapa"
            defaultChecked
            className="h-4 w-4 accent-[#00a1e0]"
          />
          Mostrar en el mapa de presencia
        </label>
        <label className="flex items-center gap-2.5 text-[13px] text-fg-muted">
          <input type="checkbox" name="destacado" className="h-4 w-4 accent-[#00a1e0]" />
          Destacar en la página de casos
        </label>
      </fieldset>

      {estado.error ? <p role="alert" className={avisoError}>{estado.error}</p> : null}
      {estado.ok ? <p role="status" className={avisoOk}>{estado.ok}</p> : null}

      <Enviar texto="Agregar cliente" />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Testimonio                                                                 */
/* -------------------------------------------------------------------------- */

export function FormularioTestimonio() {
  const [estado, accion] = useActionState(guardarTestimonio, {} as EstadoAdmin);

  return (
    <form action={accion} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="test-persona" className={etiqueta}>
            Persona *
          </label>
          <input id="test-persona" name="persona" required className={campo} placeholder="Nombre" />
        </div>
        <div>
          <label htmlFor="test-cargo" className={etiqueta}>
            Cargo
          </label>
          <input
            id="test-cargo"
            name="cargo"
            className={campo}
            placeholder="Presidente del Consejo"
          />
        </div>
        <div>
          <label htmlFor="test-empresa" className={etiqueta}>
            Empresa
          </label>
          <input id="test-empresa" name="empresa" className={campo} placeholder="Grupo…" />
        </div>
      </div>

      <div>
        <label htmlFor="test-cita" className={etiqueta}>
          Cita textual *
        </label>
        <textarea
          id="test-cita"
          name="cita"
          rows={3}
          required
          className={`${campo} resize-y`}
          placeholder="Lo que dijo, con sus palabras"
        />
      </div>

      <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-fg-muted">
        <input type="checkbox" name="autorizado" className="mt-1 h-4 w-4 accent-[#00a1e0]" />
        <span>La persona autorizó que se publique su nombre y su dicho.</span>
      </label>

      {estado.error ? <p role="alert" className={avisoError}>{estado.error}</p> : null}
      {estado.ok ? <p role="status" className={avisoOk}>{estado.ok}</p> : null}

      <Enviar texto="Agregar testimonio" />
    </form>
  );
}
