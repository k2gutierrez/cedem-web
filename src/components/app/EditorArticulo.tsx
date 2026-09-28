"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  descartarMiArticulo,
  guardarMiArticulo,
  type EstadoArticulo,
} from "@/app/acciones/mis-articulos";
import { Boton } from "@/components/ui/Boton";

/**
 * El editor de artículos del consultor.
 *
 * Es el mismo oficio que el editor del panel —título, resumen, texto y el extracto
 * que se enseña en el muro— pero sin las decisiones que no le tocan: no elige
 * visibilidad, no elige autoría (es él) y no publica.
 */

const campo =
  "w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
const etiqueta = "mb-1.5 block text-sm font-medium text-fg-muted";

export type ArticuloPropio = {
  id: string;
  title: string;
  summary: string | null;
  excerpt: string | null;
  status: string;
  slug: string;
  published_at: string | null;
  body_md: string;
};

export function EditorArticulo({
  articulo,
  alGuardar,
}: {
  /** Si viene, se edita; si no, se escribe uno nuevo. */
  articulo?: ArticuloPropio;
  /** Se llama tras guardar, para refrescar y cerrar. */
  alGuardar?: () => void;
}) {
  const [estado, accion] = useActionState(guardarMiArticulo, {} as EstadoArticulo);

  const guardado = Boolean(estado.ok);
  if (guardado && alGuardar) alGuardar();

  return (
    <form action={accion} className="space-y-5">
      {articulo ? <input type="hidden" name="id" value={articulo.id} /> : null}

      {articulo ? (
        <div className="rounded-2xl border border-border bg-bg-soft p-4">
          <p className="text-xs leading-relaxed text-fg-muted">
            Se publicará en{" "}
            <code className="font-mono text-fg">/recursos/{articulo.slug}</code>
          </p>
        </div>
      ) : null}

      <div>
        <label htmlFor="art-titulo" className={etiqueta}>
          Título *
        </label>
        <input
          id="art-titulo"
          name="titulo"
          required
          defaultValue={articulo?.title ?? ""}
          className={campo}
          placeholder="Lo que le vas a decir al dueño, no el tema"
        />
        <p className="mt-1.5 text-xs text-fg-subtle">
          Que nombre su problema. «¿Estás creciendo o solo engordando?» funciona; «Sobre el
          crecimiento» no.
        </p>
      </div>

      <div>
        <label htmlFor="art-resumen" className={etiqueta}>
          Resumen (una o dos frases)
        </label>
        <textarea
          id="art-resumen"
          name="resumen"
          rows={2}
          defaultValue={articulo?.summary ?? ""}
          className={`${campo} resize-y`}
          placeholder="De qué va, en lenguaje llano"
        />
      </div>

      <div>
        <label htmlFor="art-cuerpo" className={etiqueta}>
          El artículo *
        </label>
        <textarea
          id="art-cuerpo"
          name="cuerpo"
          rows={18}
          defaultValue={articulo?.body_md ?? ""}
          className={`${campo} resize-y font-mono text-sm`}
          placeholder={"Escribe aquí. Puedes usar markdown:\n\n## Un subtítulo\n\nUn párrafo normal.\n\n- Una lista\n- Otra línea"}
        />
        <p className="mt-1.5 text-xs text-fg-subtle">
          Escribe como le hablas a un dueño en su oficina: con ejemplos, sin jerga y sin
          decirle lo que ya sabe.
        </p>
      </div>

      <div>
        <label htmlFor="art-extracto" className={etiqueta}>
          Extracto para el muro (opcional)
        </label>
        <textarea
          id="art-extracto"
          name="extracto"
          rows={3}
          defaultValue={articulo?.excerpt ?? ""}
          className={`${campo} resize-y`}
          placeholder="Si lo dejas vacío, se usa el primer párrafo."
        />
        <p className="mt-1.5 text-xs text-fg-subtle">
          Es lo único que ve quien todavía no es miembro. Cuídalo.
        </p>
      </div>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
        >
          {estado.error}
        </p>
      ) : null}

      {estado.ok ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          {estado.ok}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Guardar />
        {articulo && articulo.status === "borrador" ? (
          <form action={descartarMiArticulo}>
            <input type="hidden" name="id" value={articulo.id} />
            <Descartar />
          </form>
        ) : null}
      </div>
    </form>
  );
}

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" tamano="lg" disabled={pending} className="barrido">
      {pending ? "Guardando…" : "Guardar borrador"}
    </Boton>
  );
}

function Descartar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-border px-4 py-2.5 font-display text-sm font-semibold text-fg-muted transition-colors hover:border-red-300 hover:text-red-700 dark:hover:border-red-500/50 dark:hover:text-red-300"
    >
      {pending ? "Descartando…" : "Descartar este borrador"}
    </button>
  );
}
