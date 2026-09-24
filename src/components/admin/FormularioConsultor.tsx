"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Boton } from "@/components/ui/Boton";
import { guardarConsultor, type EstadoAdmin } from "@/app/acciones/equipo";

export type Consultor = {
  id: string;
  full_name: string;
  headline: string | null;
  location: string | null;
  bio_md: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  email_public: string | null;
  specialties: string[] | null;
  is_founder: boolean;
  is_active: boolean;
  sort_order: number;
  /** Cuenta de acceso ligada a esta ficha. `null` si todavía no tiene. */
  profile_id?: string | null;
  /** Su foto en el bucket `avatars`. */
  photo_path?: string | null;
};

const campo =
  "w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-[14px] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
const etiqueta = "mb-1 block text-[12px] font-medium text-fg-muted";

function Enviar({ editar }: { editar: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending}>
      {pending ? "Guardando…" : editar ? "Guardar cambios" : "Agregar al equipo"}
    </Boton>
  );
}

export function FormularioConsultor({ consultor }: { consultor?: Consultor }) {
  const inicial: EstadoAdmin = {};
  const [estado, accion] = useActionState(guardarConsultor, inicial);
  const editar = Boolean(consultor);

  return (
    <form action={accion} className="space-y-4">
      {editar ? <input type="hidden" name="id" value={consultor!.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`nombre-${consultor?.id ?? "nuevo"}`} className={etiqueta}>
            Nombre completo *
          </label>
          <input
            id={`nombre-${consultor?.id ?? "nuevo"}`}
            name="nombre"
            required
            defaultValue={consultor?.full_name ?? ""}
            className={campo}
            placeholder="Nombre y apellidos"
          />
        </div>
        <div>
          <label htmlFor={`cargo-${consultor?.id ?? "nuevo"}`} className={etiqueta}>
            Cargo
          </label>
          <input
            id={`cargo-${consultor?.id ?? "nuevo"}`}
            name="cargo"
            defaultValue={consultor?.headline ?? ""}
            className={campo}
            placeholder="Socio consultor, Director regional…"
          />
        </div>
        <div>
          <label htmlFor={`locacion-${consultor?.id ?? "nuevo"}`} className={etiqueta}>
            Locación
          </label>
          <input
            id={`locacion-${consultor?.id ?? "nuevo"}`}
            name="locacion"
            defaultValue={consultor?.location ?? ""}
            className={campo}
            placeholder="Guadalajara, México"
          />
        </div>
        <div>
          <label htmlFor={`correo-${consultor?.id ?? "nuevo"}`} className={etiqueta}>
            Correo público
          </label>
          <input
            id={`correo-${consultor?.id ?? "nuevo"}`}
            name="correo"
            type="email"
            defaultValue={consultor?.email_public ?? ""}
            className={campo}
            placeholder="nombre@cedem.com.mx"
          />
        </div>
        <div>
          <label htmlFor={`linkedin-${consultor?.id ?? "nuevo"}`} className={etiqueta}>
            LinkedIn
          </label>
          <input
            id={`linkedin-${consultor?.id ?? "nuevo"}`}
            name="linkedin"
            defaultValue={consultor?.linkedin_url ?? ""}
            className={campo}
            placeholder="https://www.linkedin.com/in/…"
          />
        </div>
        <div>
          <label htmlFor={`x-${consultor?.id ?? "nuevo"}`} className={etiqueta}>
            X (antes Twitter)
          </label>
          <input
            id={`x-${consultor?.id ?? "nuevo"}`}
            name="x"
            defaultValue={consultor?.x_url ?? ""}
            className={campo}
            placeholder="https://x.com/…"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`bio-${consultor?.id ?? "nuevo"}`} className={etiqueta}>
          Semblanza
        </label>
        <textarea
          id={`bio-${consultor?.id ?? "nuevo"}`}
          name="bio"
          rows={4}
          defaultValue={consultor?.bio_md ?? ""}
          className={`${campo} resize-y`}
          placeholder="Trayectoria, formación, en qué acompaña a los dueños…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`especialidades-${consultor?.id ?? "nuevo"}`} className={etiqueta}>
            Especialidades (separadas por comas)
          </label>
          <input
            id={`especialidades-${consultor?.id ?? "nuevo"}`}
            name="especialidades"
            defaultValue={(consultor?.specialties ?? []).join(", ")}
            className={campo}
            placeholder="Sucesión, gobierno corporativo, finanzas del valor"
          />
        </div>
        <div>
          <label htmlFor={`orden-${consultor?.id ?? "nuevo"}`} className={etiqueta}>
            Orden en la página
          </label>
          <input
            id={`orden-${consultor?.id ?? "nuevo"}`}
            name="orden"
            type="number"
            defaultValue={consultor?.sort_order ?? 100}
            className={campo}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2.5 text-[13px] text-fg-muted">
          <input
            type="checkbox"
            name="fundador"
            defaultChecked={consultor?.is_founder ?? false}
            className="h-4 w-4 accent-[#00a1e0]"
          />
          Es fundador o socia fundadora
        </label>
        {editar ? (
          <label className="flex items-center gap-2.5 text-[13px] text-fg-muted">
            <input
              type="checkbox"
              name="activo"
              defaultChecked={consultor?.is_active ?? true}
              className="h-4 w-4 accent-[#00a1e0]"
            />
            Aparece en el sitio
          </label>
        ) : null}
      </div>

      {estado.error ? (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-[13px] text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {estado.error}
        </p>
      ) : null}
      {estado.ok ? (
        <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          {estado.ok}
        </p>
      ) : null}

      <Enviar editar={editar} />
    </form>
  );
}
