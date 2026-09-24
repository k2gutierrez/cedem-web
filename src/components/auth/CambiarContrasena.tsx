"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Boton } from "@/components/ui/Boton";
import { cambiarContrasena, type EstadoFormulario } from "@/app/acciones/auth";

/**
 * Cambiar la contraseña estando dentro.
 *
 * Faltaba, y se nota en dos casos concretos: quien recibe una contraseña temporal
 * (por ejemplo, al activarle la cuenta desde el servidor) no tenía forma de
 * cambiarla sin pasar por el correo; y quien sospecha que alguien la vio, tampoco.
 *
 * Usa la misma acción que la pantalla de recuperación, así que la comprobación de
 * longitud y de que las dos coincidan es la misma en los dos sitios.
 */
export function CambiarContrasena() {
  const [estado, accion] = useActionState(cambiarContrasena, {} as EstadoFormulario);

  const campo =
    "w-full rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
  const etiqueta = "mb-1.5 block text-[13px] font-medium text-fg-muted";

  if (estado.ok) {
    return (
      <p
        role="status"
        className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
      >
        {estado.mensaje ?? "Listo. Tu contraseña quedó guardada."}
      </p>
    );
  }

  return (
    <form action={accion} className="space-y-4">
      <div>
        <label htmlFor="perfil-contrasena" className={etiqueta}>
          Contraseña nueva
        </label>
        <input
          id="perfil-contrasena"
          name="contrasena"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={campo}
          placeholder="Al menos 8 caracteres"
        />
      </div>

      <div>
        <label htmlFor="perfil-repetida" className={etiqueta}>
          Repítela
        </label>
        <input
          id="perfil-repetida"
          name="repetida"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={campo}
          placeholder="La misma de arriba"
        />
      </div>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
        >
          {estado.error}
        </p>
      ) : null}

      <Enviar />
    </form>
  );
}

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending} className="barrido">
      {pending ? "Guardando…" : "Guardar la contraseña"}
    </Boton>
  );
}
