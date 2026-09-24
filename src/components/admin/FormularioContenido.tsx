"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Boton } from "@/components/ui/Boton";
import { crearContenido, type EstadoContenido } from "@/app/acciones/contenido";

const inicial: EstadoContenido = {};

const campo =
  "w-full rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
const etiqueta = "mb-1.5 block text-[13px] font-medium text-fg-muted";

function Botones() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap gap-3">
      <Boton type="submit" name="accion" value="borrador" variante="secundario" disabled={pending}>
        {pending ? "Guardando…" : "Guardar borrador"}
      </Boton>
      <Boton type="submit" name="accion" value="publicar" disabled={pending}>
        {pending ? "Publicando…" : "Publicar ahora"}
      </Boton>
    </div>
  );
}

export function FormularioContenido({
  consultores,
}: {
  consultores: { id: string; nombre: string }[];
}) {
  const [estado, accion] = useActionState(crearContenido, inicial);

  return (
    <form action={accion} className="space-y-5">
      <div>
        <label htmlFor="titulo" className={etiqueta}>
          Título *
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          className={campo}
          placeholder="Lo que le vas a decir al dueño"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="tipo" className={etiqueta}>
            Tipo
          </label>
          <select id="tipo" name="tipo" className={campo} defaultValue="articulo">
            <option value="articulo">Artículo</option>
            <option value="video">Video</option>
            <option value="podcast">Podcast</option>
            <option value="evento">Evento</option>
            <option value="documento">Documento</option>
          </select>
        </div>

        <div>
          <label htmlFor="visibilidad" className={etiqueta}>
            Quién puede verlo
          </label>
          <select id="visibilidad" name="visibilidad" className={campo} defaultValue="publico">
            <option value="publico">Público (abierto)</option>
            <option value="free_registrado">Registrado (con cuenta gratis)</option>
            <option value="premium">Premium (solo miembros de pago)</option>
          </select>
        </div>

        <div>
          <label htmlFor="autor" className={etiqueta}>
            Autoría
          </label>
          <select id="autor" name="autor" className={campo} defaultValue="cedem">
            <option value="cedem">CEDEM</option>
            {consultores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="resumen" className={etiqueta}>
          Resumen (una o dos frases)
        </label>
        <textarea
          id="resumen"
          name="resumen"
          rows={2}
          className={`${campo} resize-y`}
          placeholder="De qué va, en lenguaje llano"
        />
      </div>

      <div>
        <label htmlFor="cuerpo" className={etiqueta}>
          Cuerpo
        </label>
        <textarea
          id="cuerpo"
          name="cuerpo"
          rows={12}
          className={`${campo} resize-y font-mono text-[14px]`}
          placeholder={"Escribe aquí. Puedes usar markdown:\n\n## Un subtítulo\n\nUn párrafo normal.\n\n- Una lista\n- Otra línea"}
        />
        <p className="mt-2 text-[12px] text-fg-subtle">
          El primer párrafo es lo que verá quien no tenga membresía: cuídalo.
        </p>
      </div>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
        >
          {estado.error}
        </p>
      ) : null}

      <Botones />
    </form>
  );
}
