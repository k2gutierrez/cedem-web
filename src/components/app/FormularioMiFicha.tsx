"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { guardarMiFicha, type EstadoFicha } from "@/app/acciones/mi-ficha";
import { Boton } from "@/components/ui/Boton";

/**
 * Formulario con el que un consultor edita su ficha pública.
 *
 * Solo salen los campos que la base le deja cambiar. No es una restricción de la
 * interfaz: es la lista que impone el disparador `consultants_guard`, y si algún
 * día cambia allá, aquí se verá el rechazo con su motivo en vez de fallar en
 * silencio.
 */

const campo =
  "w-full rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
const etiqueta = "mb-1.5 block text-[13px] font-medium text-fg-muted";

export type FichaEditable = {
  id: string;
  slug: string;
  full_name: string;
  headline: string | null;
  location: string | null;
  bio_md: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  website_url: string | null;
  email_public: string | null;
  specialties: string[] | null;
  languages: string[] | null;
  started_year: number | null;
};

export function FormularioMiFicha({ ficha }: { ficha: FichaEditable }) {
  const [estado, accion] = useActionState(guardarMiFicha, {} as EstadoFicha);

  return (
    <form action={accion} className="space-y-5">
      <input type="hidden" name="slug" value={ficha.slug} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ficha-nombre" className={etiqueta}>
            Nombre completo
          </label>
          <input
            id="ficha-nombre"
            name="nombre"
            required
            defaultValue={ficha.full_name}
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="ficha-cargo" className={etiqueta}>
            Tu cargo
          </label>
          <input
            id="ficha-cargo"
            name="cargo"
            defaultValue={ficha.headline ?? ""}
            placeholder="Socio Consultor"
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="ficha-ubicacion" className={etiqueta}>
            Dónde estás
          </label>
          <input
            id="ficha-ubicacion"
            name="ubicacion"
            defaultValue={ficha.location ?? ""}
            placeholder="Guadalajara, Jalisco"
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="ficha-inicio" className={etiqueta}>
            Año en que te uniste
          </label>
          <input
            id="ficha-inicio"
            name="inicio"
            type="number"
            min="1985"
            max="2100"
            step="1"
            defaultValue={ficha.started_year ?? ""}
            placeholder="2015"
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="ficha-correo" className={etiqueta}>
            Correo público
          </label>
          <input
            id="ficha-correo"
            name="correo"
            type="email"
            defaultValue={ficha.email_public ?? ""}
            placeholder="nombre@cedem.com.mx"
            className={campo}
          />
          <p className="mt-1.5 text-[11.5px] text-fg-subtle">
            Aparece en tu ficha. Déjalo vacío si prefieres que te contacten por LinkedIn.
          </p>
        </div>

        <div>
          <label htmlFor="ficha-linkedin" className={etiqueta}>
            LinkedIn
          </label>
          <input
            id="ficha-linkedin"
            name="linkedin"
            defaultValue={ficha.linkedin_url ?? ""}
            placeholder="https://www.linkedin.com/in/…"
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="ficha-x" className={etiqueta}>
            X (antes Twitter)
          </label>
          <input
            id="ficha-x"
            name="x"
            defaultValue={ficha.x_url ?? ""}
            placeholder="https://x.com/…"
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="ficha-sitio" className={etiqueta}>
            Sitio web
          </label>
          <input
            id="ficha-sitio"
            name="sitio"
            defaultValue={ficha.website_url ?? ""}
            placeholder="https://…"
            className={campo}
          />
        </div>
      </div>

      <div>
        <label htmlFor="ficha-bio" className={etiqueta}>
          Tu biografía
        </label>
        <textarea
          id="ficha-bio"
          name="bio"
          rows={8}
          defaultValue={ficha.bio_md ?? ""}
          placeholder="De dónde vienes, en qué trabajas con los dueños y qué te distingue. Escribe en párrafos separados por una línea en blanco."
          className={campo}
        />
        <p className="mt-1.5 text-[11.5px] text-fg-subtle">
          Es lo que lee un dueño antes de decidir si te busca. Dos o tres párrafos bastan.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ficha-especialidades" className={etiqueta}>
            Especialidades
          </label>
          <input
            id="ficha-especialidades"
            name="especialidades"
            defaultValue={(ficha.specialties ?? []).join(", ")}
            placeholder="gobierno corporativo, sucesión, estrategia"
            className={campo}
          />
          <p className="mt-1.5 text-[11.5px] text-fg-subtle">Separadas por comas.</p>
        </div>

        <div>
          <label htmlFor="ficha-idiomas" className={etiqueta}>
            Idiomas
          </label>
          <input
            id="ficha-idiomas"
            name="idiomas"
            defaultValue={(ficha.languages ?? []).join(", ")}
            placeholder="español, inglés"
            className={campo}
          />
        </div>
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

      <Enviar />
    </form>
  );
}

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" tamano="lg" disabled={pending} className="barrido">
      {pending ? "Guardando…" : "Guardar mi ficha"}
    </Boton>
  );
}
