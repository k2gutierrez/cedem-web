"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  crearCuentaEquipo,
  restablecerClaveEquipo,
  type EstadoCuentaEquipo,
} from "@/app/acciones/cuentas-equipo";
import { Boton } from "@/components/ui/Boton";

/**
 * Dar acceso a alguien del equipo, desde su ficha.
 *
 * Mientras la persona no tiene cuenta, aquí se crea: se escribe su correo, se
 * genera una contraseña temporal y se muestra UNA vez para que quien administra se
 * la pase. Después de eso ya puede entrar a la plataforma y editar su propia ficha.
 *
 * Si ya tiene cuenta, en lugar del formulario se ofrece restablecer la contraseña,
 * que es lo que de verdad se necesita cuando alguien del equipo llama diciendo que
 * no puede entrar.
 */
/**
 * La contraseña temporal, que se muestra UNA sola vez.
 *
 * Vive fuera del componente a propósito: declarada dentro, se recrearía en cada
 * render y el aviso parpadearía. Y no se guarda en ningún sitio —ni en la base, ni
 * en un archivo—: si se pierde, se genera otra.
 */
function PanelClave({ dato }: { dato: EstadoCuentaEquipo }) {
  if (!dato.clave) return null;

  return (
    <div className="mt-4 rounded-2xl border border-emerald-300/70 bg-emerald-50 p-5 dark:border-emerald-500/40 dark:bg-emerald-500/10">
      <p className="font-display text-[14px] font-bold text-emerald-900 dark:text-emerald-200">
        {dato.ok}
      </p>
      <dl className="mt-3 space-y-1.5 text-[13px]">
        {dato.correo ? (
          <div className="flex gap-2">
            <dt className="text-emerald-800/80 dark:text-emerald-300/80">Correo:</dt>
            <dd className="font-mono text-emerald-900 dark:text-emerald-100">{dato.correo}</dd>
          </div>
        ) : null}
        <div className="flex gap-2">
          <dt className="text-emerald-800/80 dark:text-emerald-300/80">Contraseña:</dt>
          <dd className="font-mono font-semibold text-emerald-900 dark:text-emerald-100">
            {dato.clave}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[12px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
        Cópiala ahora: no se puede volver a consultar. Al entrar, que la cambie en{" "}
        <b>Mi perfil → Tu contraseña</b>.
      </p>
    </div>
  );
}

export function CuentaDeEquipo({
  consultorId,
  nombre,
  correo,
  esSuperAdmin,
  tieneCuenta,
}: {
  consultorId: string;
  nombre: string;
  /** El correo público de su ficha, como sugerencia. */
  correo: string | null;
  esSuperAdmin: boolean;
  tieneCuenta: boolean;
}) {
  const [estado, accion] = useActionState(crearCuentaEquipo, {} as EstadoCuentaEquipo);
  const [estadoReset, accionReset] = useActionState(
    restablecerClaveEquipo,
    {} as EstadoCuentaEquipo,
  );

  const campo =
    "w-full rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
  const etiqueta = "mb-1.5 block text-[13px] font-medium text-fg-muted";

  if (tieneCuenta) {
    return (
      <div className="rounded-2xl border border-border bg-bg-soft p-5">
        <p className="text-[13px] font-semibold text-fg">
          {nombre} ya tiene cuenta de acceso
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-fg-muted">
          Puede entrar a la plataforma y editar su propia ficha.
        </p>

        <form action={accionReset} className="mt-4">
          <input type="hidden" name="consultor" value={consultorId} />
          <Restablecer />
        </form>

        {estadoReset.error ? (
          <p role="alert" className="mt-3 text-[12.5px] text-red-700 dark:text-red-300">
            {estadoReset.error}
          </p>
        ) : null}
        <PanelClave dato={estadoReset} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-bg-soft p-5">
      <p className="text-[13px] font-semibold text-fg">Darle acceso a la plataforma</p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-fg-muted">
        Todavía no tiene cuenta. Al crearla podrá entrar y editar su propia ficha, sin pagar
        membresía.
      </p>

      <form action={accion} className="mt-4 space-y-4">
        <input type="hidden" name="consultor" value={consultorId} />

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor={`correo-${consultorId}`} className={etiqueta}>
              Su correo
            </label>
            <input
              id={`correo-${consultorId}`}
              name="correo"
              type="email"
              required
              defaultValue={correo ?? ""}
              placeholder="nombre@cedem.com.mx"
              className={campo}
            />
          </div>

          <div>
            <label htmlFor={`rol-${consultorId}`} className={etiqueta}>
              Nivel
            </label>
            <select
              id={`rol-${consultorId}`}
              name="rol"
              defaultValue="consultor"
              className={campo}
            >
              <option value="consultor">Consultor</option>
              {esSuperAdmin ? <option value="admin">Administrador</option> : null}
            </select>
          </div>
        </div>

        <Crear />
      </form>

      {estado.error ? (
        <p role="alert" className="mt-3 text-[12.5px] text-red-700 dark:text-red-300">
          {estado.error}
        </p>
      ) : null}
      <PanelClave dato={estado} />
    </div>
  );
}

function Crear() {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending}>
      {pending ? "Creando la cuenta…" : "Crear su cuenta"}
    </Boton>
  );
}

function Restablecer() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-border px-4 py-2 font-display text-[13px] font-semibold text-fg-muted transition-colors hover:border-cyan hover:text-fg dark:hover:border-sky"
    >
      {pending ? "Generando…" : "No puede entrar: darle una contraseña nueva"}
    </button>
  );
}
