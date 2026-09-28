"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Boton } from "@/components/ui/Boton";
import { IconoFlecha } from "@/components/ui/Iconos";
import { entrar, type EstadoFormulario } from "@/app/acciones/auth";

const inicial: EstadoFormulario = {};

function Enviar({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" tamano="lg" disabled={pending} className="w-full">
      {pending ? "Entrando…" : children}
    </Boton>
  );
}

export function FormularioAcceso({ destino }: { destino: string }) {
  const [estado, accion] = useActionState(entrar, inicial);

  const campo =
    "w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
  const etiqueta = "mb-1.5 block text-sm font-medium text-fg-muted";

  return (
    <form action={accion} className="space-y-5">
      <input type="hidden" name="destino" value={destino} />

      <div>
        <label htmlFor="correo" className={etiqueta}>
          Correo electrónico
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

      <div>
        <label htmlFor="contrasena" className={etiqueta}>
          Contraseña
        </label>
        <input
          id="contrasena"
          name="contrasena"
          type="password"
          autoComplete="current-password"
          required
          className={campo}
          placeholder="••••••••"
        />
        <Link
          href="/recuperar"
          className="mt-2 inline-block text-xs font-medium text-navy hover:text-cyan dark:text-sky"
        >
          Olvidé mi contraseña
        </Link>
      </div>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
        >
          {estado.error}
        </p>
      ) : null}

      <Enviar>
        Entrar
        <IconoFlecha className="h-4 w-4" />
      </Enviar>

      <p className="text-center text-sm text-fg-subtle">
        ¿Todavía no tienes cuenta?{" "}
        <Link
          href="/registro"
          className="font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
        >
          Crear una gratis
        </Link>
      </p>
    </form>
  );
}
