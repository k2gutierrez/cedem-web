"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Boton } from "@/components/ui/Boton";
import { IconoFlecha } from "@/components/ui/Iconos";
import {
  cambiarContrasena,
  pedirRecuperacion,
  type EstadoFormulario,
} from "@/app/acciones/auth";

const inicial: EstadoFormulario = {};

const campo =
  "w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
const etiqueta = "mb-1.5 block text-sm font-medium text-fg-muted";

function Enviar({ children, cargando }: { children: React.ReactNode; cargando: string }) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" tamano="lg" disabled={pending} className="w-full">
      {pending ? cargando : children}
    </Boton>
  );
}

function Mensaje({ estado }: { estado: EstadoFormulario }) {
  if (estado.error) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
      >
        {estado.error}
      </p>
    );
  }
  if (estado.ok && estado.mensaje) {
    return (
      <p
        role="status"
        className="rounded-xl border border-cyan/40 bg-sky/10 px-4 py-3 text-sm leading-relaxed text-fg-muted dark:border-sky/40"
      >
        {estado.mensaje}
      </p>
    );
  }
  return null;
}

/** Pedir el enlace de recuperación. */
export function FormularioRecuperar() {
  const [estado, accion] = useActionState(pedirRecuperacion, inicial);

  if (estado.ok) {
    return (
      <div className="space-y-5">
        <Mensaje estado={estado} />
        <p className="text-center text-sm text-fg-subtle">
          <Link
            href="/acceso"
            className="font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
          >
            Volver al acceso
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-5">
      <div>
        <label htmlFor="correo" className={etiqueta}>
          Tu correo
        </label>
        <input
          id="correo"
          name="correo"
          type="email"
          autoComplete="email"
          required
          className={campo}
          placeholder="tucorreo@empresa.com"
        />
      </div>

      <Mensaje estado={estado} />

      <Enviar cargando="Enviando…">
        Enviarme el enlace
        <IconoFlecha className="h-4 w-4" />
      </Enviar>

      <p className="text-center text-sm text-fg-subtle">
        ¿Ya te acordaste?{" "}
        <Link
          href="/acceso"
          className="font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}

/** Elegir la contraseña nueva (llega desde el enlace del correo). */
export function FormularioRestablecer() {
  const [estado, accion] = useActionState(cambiarContrasena, inicial);

  if (estado.ok) {
    return (
      <div className="space-y-5">
        <Mensaje estado={estado} />
        <Link
          href="/app"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-cyan dark:bg-sky dark:text-navy"
        >
          Ir a mi panel
          <IconoFlecha className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-5">
      <div>
        <label htmlFor="contrasena" className={etiqueta}>
          Contraseña nueva
        </label>
        <input
          id="contrasena"
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
        <label htmlFor="repetida" className={etiqueta}>
          Repítela
        </label>
        <input
          id="repetida"
          name="repetida"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={campo}
          placeholder="La misma de arriba"
        />
      </div>

      <Mensaje estado={estado} />

      <Enviar cargando="Guardando…">
        Guardar la contraseña
        <IconoFlecha className="h-4 w-4" />
      </Enviar>

      <p className="text-center text-sm text-fg-subtle">
        ¿El enlace ya no sirve?{" "}
        <Link
          href="/recuperar"
          className="font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
        >
          Pide otro
        </Link>
      </p>
    </form>
  );
}
