"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { quitarFoto, subirFoto } from "@/app/acciones/fotos";
import { Boton } from "@/components/ui/Boton";
import { urlDeFoto } from "@/lib/fotos";

/**
 * Subir la foto de una persona.
 *
 * Se sube sola en cuanto se elige el archivo, sin un botón de «guardar» aparte:
 * elegir la foto y pulsar guardar es un paso de más que solo sirve para que se
 * olvide. El resultado se muestra aquí mismo, sin recargar.
 *
 * La vista previa se hace con una URL local del navegador (`URL.createObjectURL`)
 * mientras se sube, y después se usa la dirección definitiva: así el cambio se ve
 * al instante aunque el archivo todavía esté viajando.
 */
export function SubirFoto({
  persona,
  rutaActual,
  nombre,
  alto = "h-24 w-24",
}: {
  /** Identificador de la persona dueña de la foto. */
  persona: string;
  rutaActual: string | null;
  nombre: string;
  alto?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [previa, setPrevia] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tono: "ok" | "error"; texto: string } | null>(null);

  const actual = urlDeFoto(rutaActual);

  async function enviar(archivo: File) {
    setEnviando(true);
    setMensaje(null);
    setPrevia(URL.createObjectURL(archivo));

    const datos = new FormData();
    datos.set("foto", archivo);
    datos.set("persona", persona);

    const resultado = await subirFoto(datos);
    setEnviando(false);

    if (resultado.error) {
      setMensaje({ tono: "error", texto: resultado.error });
      setPrevia(null);
    } else {
      setMensaje({ tono: "ok", texto: resultado.ok ?? "Foto actualizada." });
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className={`${alto} shrink-0 overflow-hidden rounded-2xl border border-border bg-bg-soft`}>
        {previa || actual ? (
          // eslint-disable-next-line @next/next/no-img-element -- la foto viene del bucket público
          <img
            src={previa ?? actual ?? ""}
            alt={`Foto de ${nombre}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="grid h-full w-full place-items-center font-display text-xl font-bold text-fg-subtle">
            {iniciales(nombre)}
          </span>
        )}
      </div>

      <div className="min-w-[220px] flex-1">
        <p className="text-sm font-medium text-fg">Tu foto</p>
        <p className="mt-1 text-xs leading-relaxed text-fg-subtle">
          JPG, PNG, WebP o AVIF, hasta 5 MB. Se ve en tu perfil y, si eres consultor, en la
          página de Equipo.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            ref={input}
            type="file"
            name="foto"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) void enviar(archivo);
            }}
          />

          <Boton
            type="button"
            tamano="md"
            disabled={enviando}
            onClick={() => input.current?.click()}
          >
            {enviando ? "Subiendo…" : actual ? "Cambiar la foto" : "Subir una foto"}
          </Boton>

          {actual ? (
            <form action={quitarFoto}>
              <input type="hidden" name="persona" value={persona} />
              <Quitar />
            </form>
          ) : null}
        </div>

        {mensaje ? (
          <p
            role="status"
            className={`mt-3 text-xs ${
              mensaje.tono === "ok"
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {mensaje.texto}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Quitar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-border px-4 py-2 font-display text-sm font-semibold text-fg-muted transition-colors hover:border-red-300 hover:text-red-700 dark:hover:border-red-500/50 dark:hover:text-red-300"
    >
      {pending ? "Quitando…" : "Quitar"}
    </button>
  );
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
