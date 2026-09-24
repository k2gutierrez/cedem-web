"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Boton } from "@/components/ui/Boton";
import {
  crearContenido,
  guardarContenido,
  type EstadoContenido,
} from "@/app/acciones/contenido";

const inicial: EstadoContenido = {};

const campo =
  "w-full rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
const etiqueta = "mb-1.5 block text-[13px] font-medium text-fg-muted";

function Botones({ editar = false }: { editar?: boolean }) {
  const { pending } = useFormStatus();

  if (editar) {
    return (
      <Boton type="submit" disabled={pending} className="barrido">
        {pending ? "Guardando…" : "Guardar cambios"}
      </Boton>
    );
  }

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

/** Los campos que ya tiene un contenido y que el editor deja cambiar. */
export type ContenidoEditable = {
  id: string;
  content_type: string;
  title: string;
  summary: string | null;
  excerpt: string | null;
  visibility: string;
  status: string;
  slug: string;
  /** Autoría, si es un artículo. */
  consultant_id?: string | null;
  authored_by_cedem?: boolean | null;
  /** Cuerpo, si ya lo tiene. */
  body_md?: string | null;
  /** Si es un documento: si ya tiene su PDF cargado y cuántas páginas tiene. */
  document_conArchivo?: boolean;
  document_pages?: number | null;
};

export function FormularioContenido({
  consultores,
  contenido,
}: {
  consultores: { id: string; nombre: string }[];
  /** Si viene, el formulario edita; si no, crea. */
  contenido?: ContenidoEditable;
}) {
  const editar = Boolean(contenido);
  const [estado, accion] = useActionState(
    editar ? guardarContenido : crearContenido,
    inicial,
  );

  return (
    <form action={accion} className="space-y-5">
      {contenido ? <input type="hidden" name="id" value={contenido.id} /> : null}

      {editar ? (
        <div className="rounded-2xl border border-border bg-bg-soft p-4">
          <p className="text-[12.5px] leading-relaxed text-fg-muted">
            Dirección pública: <code className="font-mono text-fg">/recursos/{contenido!.slug}</code>
            {contenido!.content_type === "documento" ? (
              <>
                {" · "}
                Documento{" "}
                {contenido!.document_conArchivo ? "con archivo cargado" : "todavía sin PDF"}
              </>
            ) : null}
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-fg-subtle">
            La dirección no cambia al editar el título: cambiarla rompería los enlaces que
            la gente ya compartió y el posicionamiento en Google.
          </p>
        </div>
      ) : null}

      <div>
        <label htmlFor="titulo" className={etiqueta}>
          Título *
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          defaultValue={contenido?.title ?? ""}
          className={campo}
          placeholder="Lo que le vas a decir al dueño"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="tipo" className={etiqueta}>
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            className={campo}
            defaultValue={contenido?.content_type ?? "articulo"}
          >
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
          <select
            id="visibilidad"
            name="visibilidad"
            className={campo}
            defaultValue={contenido?.visibility ?? "publico"}
          >
            <option value="publico">Público (abierto)</option>
            <option value="free_registrado">Registrado (con cuenta gratis)</option>
            <option value="premium">Premium (solo miembros de pago)</option>
          </select>
        </div>

        <div>
          <label htmlFor="autor" className={etiqueta}>
            Autoría
          </label>
          <select
            id="autor"
            name="autor"
            className={campo}
            defaultValue={
              contenido?.authored_by_cedem === false && contenido?.consultant_id
                ? contenido.consultant_id
                : "cedem"
            }
          >
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
          defaultValue={contenido?.summary ?? ""}
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
          rows={14}
          defaultValue={contenido?.body_md ?? ""}
          className={`${campo} resize-y font-mono text-[14px]`}
          placeholder={"Escribe aquí. Puedes usar markdown:\n\n## Un subtítulo\n\nUn párrafo normal.\n\n- Una lista\n- Otra línea"}
        />
        <p className="mt-2 text-[12px] text-fg-subtle">
          El primer párrafo es lo que verá quien no tenga membresía: cuídalo. Los artículos
          migrados de WordPress traen HTML; los nuevos se escriben en markdown.
        </p>
      </div>

      <div>
        <label htmlFor="extracto" className={etiqueta}>
          Extracto para el muro (opcional)
        </label>
        <textarea
          id="extracto"
          name="extracto"
          rows={3}
          defaultValue={contenido?.excerpt ?? ""}
          className={`${campo} resize-y`}
          placeholder="Si lo dejas vacío, se usa el primer párrafo del cuerpo."
        />
        <p className="mt-2 text-[12px] text-fg-subtle">
          Es lo único que ve quien no tiene acceso. Si escribes uno a mano, manda sobre el
          primer párrafo.
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

      {estado.ok ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          {estado.ok}
        </p>
      ) : null}

      <Botones editar={editar} />
    </form>
  );
}
