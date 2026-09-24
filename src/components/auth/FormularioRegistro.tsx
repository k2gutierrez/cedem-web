"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Boton } from "@/components/ui/Boton";
import { IconoFlecha } from "@/components/ui/Iconos";
import { registrar, type EstadoFormulario } from "@/app/acciones/auth";

const inicial: EstadoFormulario = {};

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" tamano="lg" disabled={pending} className="w-full">
      {pending ? "Creando tu cuenta…" : "Crear mi cuenta"}
      <IconoFlecha className="h-4 w-4" />
    </Boton>
  );
}

export function FormularioRegistro({ destino = "/app" }: { destino?: string }) {
  const [estado, accion] = useActionState(registrar, inicial);

  const campo =
    "w-full rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
  const etiqueta = "mb-1.5 block text-[13px] font-medium text-fg-muted";

  if (estado.ok) {
    return (
      <div className="rounded-2xl border border-cyan/40 bg-sky/10 p-6 text-center dark:border-sky/40">
        <p className="font-display text-lg font-bold text-fg">Revisa tu correo</p>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{estado.mensaje}</p>
        <Link
          href="/acceso"
          className="mt-5 inline-block text-sm font-semibold text-navy hover:text-cyan dark:text-sky"
        >
          Volver al acceso
        </Link>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-5">
      <input type="hidden" name="destino" value={destino} />
      <div>
        <label htmlFor="nombre" className={etiqueta}>
          Tu nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          autoComplete="name"
          className={campo}
          placeholder="Cómo te llamas"
        />
      </div>

      <div>
        <label htmlFor="correo" className={etiqueta}>
          Correo electrónico
        </label>
        <input
          id="correo"
          name="correo"
          type="email"
          required
          autoComplete="email"
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
          required
          minLength={8}
          autoComplete="new-password"
          className={campo}
          placeholder="Al menos 8 caracteres"
        />
      </div>

      <label className="flex cursor-pointer gap-3 text-[13px] leading-relaxed text-fg-muted">
        <input
          type="checkbox"
          name="acepto"
          className="mt-1 h-4 w-4 shrink-0 accent-[#00a1e0]"
        />
        <span>
          Acepto que CEDEM guarde mis respuestas para darme seguimiento y me contacte.
          Puedo pedir que las borren cuando quiera.{" "}
          <Link href="/aviso-de-privacidad" className="underline underline-offset-4">
            Aviso de privacidad
          </Link>
          .
        </span>
      </label>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
        >
          {estado.error}
        </p>
      ) : null}

      <Enviar />

      <p className="text-center text-[13px] text-fg-subtle">
        ¿Ya tienes cuenta?{" "}
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
