"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Boton } from "@/components/ui/Boton";
import {
  canjearInvitacion,
  crearInvitacion,
  type EstadoInvitacion,
} from "@/app/acciones/invitaciones";

const campo =
  "w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
const etiqueta = "mb-1.5 block text-sm font-medium text-fg-muted";

function Enviar({ texto, cargando }: { texto: string; cargando: string }) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending}>
      {pending ? cargando : texto}
    </Boton>
  );
}

/* -------------------------------------------------------------------------- */
/* Emitir (panel)                                                             */
/* -------------------------------------------------------------------------- */

export function FormularioInvitacion({
  planes,
  clientes,
}: {
  planes: { id: string; name: string }[];
  clientes: { id: string; name: string }[];
}) {
  const [estado, accion] = useActionState(crearInvitacion, {} as EstadoInvitacion);

  return (
    <form action={accion} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inv-correo" className={etiqueta}>
            Correo de la persona (opcional)
          </label>
          <input
            id="inv-correo"
            name="correo"
            type="email"
            className={campo}
            placeholder="dueno@empresa.com"
          />
          <p className="mt-1.5 text-xs text-fg-subtle">
            Si lo pones, la invitación solo la puede canjear esa persona.
          </p>
        </div>
        <div>
          <label htmlFor="inv-cliente" className={etiqueta}>
            Empresa cliente
          </label>
          <select id="inv-cliente" name="cliente" className={campo} defaultValue="">
            <option value="">Sin asociar</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inv-plan" className={etiqueta}>
            Qué otorga *
          </label>
          <select id="inv-plan" name="plan" className={campo} required defaultValue={planes[0]?.id}>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inv-duracion" className={etiqueta}>
            Duración en días
          </label>
          <input
            id="inv-duracion"
            name="duracion"
            type="number"
            min="30"
            defaultValue={365}
            className={campo}
          />
        </div>
      </div>

      <div>
        <label htmlFor="inv-notas" className={etiqueta}>
          Nota interna
        </label>
        <input
          id="inv-notas"
          name="notas"
          className={campo}
          placeholder="Quién la pidió, a qué cliente corresponde…"
        />
      </div>

      {estado.error ? (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {estado.error}
        </p>
      ) : null}

      {estado.codigo ? (
        <div className="rounded-xl border border-cyan/40 bg-sky/10 p-5 dark:border-sky/40">
          <p className="text-sm text-fg-muted">Código generado:</p>
          <p className="mt-1 font-mono text-lg font-bold tracking-wider text-fg">
            {estado.codigo}
          </p>
          <p className="mt-2 text-xs text-fg-subtle">
            Cópialo y mándaselo al cliente. Lo canjea en /invitacion.
          </p>
        </div>
      ) : null}

      <Enviar texto="Emitir invitación" cargando="Emitiendo…" />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Canjear (público)                                                          */
/* -------------------------------------------------------------------------- */

export function FormularioCanje({ codigoInicial = "" }: { codigoInicial?: string }) {
  const [estado, accion] = useActionState(canjearInvitacion, {} as EstadoInvitacion);

  if (estado.ok) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 dark:border-emerald-500/40 dark:bg-emerald-500/10">
        <p className="font-display text-lg font-bold text-fg">Acceso activado</p>
        <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">{estado.ok}</p>
        <a
          href="/app"
          className="mt-4 inline-block font-display text-sm font-semibold text-navy underline underline-offset-4 dark:text-sky"
        >
          Ir a mi panel
        </a>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-4">
      <div>
        <label htmlFor="codigo" className={etiqueta}>
          Código de invitación
        </label>
        <input
          id="codigo"
          name="codigo"
          required
          defaultValue={codigoInicial}
          className={`${campo} font-mono uppercase tracking-wider`}
          placeholder="CEDEM-XXXX-XXXX"
        />
      </div>

      {estado.error ? (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {estado.error}
        </p>
      ) : null}

      <Enviar texto="Canjear mi invitación" cargando="Canjeando…" />
    </form>
  );
}
