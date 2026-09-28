"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Boton } from "@/components/ui/Boton";
import { guardarPerfil, type EstadoPerfil } from "@/app/acciones/perfil";

const campo =
  "w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
const etiqueta = "mb-1.5 block text-sm font-medium text-fg-muted";

export type DatosPerfil = {
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  job_title: string | null;
  company_country_code: string | null;
  company_city: string | null;
  company_sector: string | null;
  employees_count: number | null;
  annual_revenue_usd: number | null;
};

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" tamano="lg" disabled={pending}>
      {pending ? "Guardando…" : "Guardar mi perfil"}
    </Boton>
  );
}

export function FormularioPerfil({
  perfil,
  paises,
}: {
  perfil: DatosPerfil;
  paises: { code: string; name_es: string }[];
}) {
  const [estado, accion] = useActionState(guardarPerfil, {} as EstadoPerfil);

  return (
    <form action={accion} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="font-display text-lg font-bold text-fg">Sobre ti</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nombre" className={etiqueta}>
              Nombre completo *
            </label>
            <input
              id="nombre"
              name="nombre"
              required
              defaultValue={perfil.full_name ?? ""}
              className={campo}
              placeholder="Cómo te llamas"
            />
          </div>
          <div>
            <label htmlFor="telefono" className={etiqueta}>
              Teléfono o WhatsApp
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              defaultValue={perfil.phone ?? ""}
              className={campo}
              placeholder="+52 33 1234 5678"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-border pt-6">
        <legend className="font-display text-lg font-bold text-fg">Tu empresa</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="empresa" className={etiqueta}>
              Nombre de la empresa
            </label>
            <input
              id="empresa"
              name="empresa"
              defaultValue={perfil.company_name ?? ""}
              className={campo}
            />
          </div>
          <div>
            <label htmlFor="cargo" className={etiqueta}>
              Tu cargo
            </label>
            <input
              id="cargo"
              name="cargo"
              defaultValue={perfil.job_title ?? ""}
              className={campo}
              placeholder="Dueño, Director General, Presidente del Consejo…"
            />
          </div>
          <div>
            <label htmlFor="pais" className={etiqueta}>
              País
            </label>
            <select
              id="pais"
              name="pais"
              defaultValue={perfil.company_country_code ?? "MX"}
              className={campo}
            >
              {paises.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name_es}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ciudad" className={etiqueta}>
              Ciudad
            </label>
            <input
              id="ciudad"
              name="ciudad"
              defaultValue={perfil.company_city ?? ""}
              className={campo}
            />
          </div>
          <div>
            <label htmlFor="sector" className={etiqueta}>
              Sector
            </label>
            <input
              id="sector"
              name="sector"
              defaultValue={perfil.company_sector ?? ""}
              className={campo}
              placeholder="Retail, alimentos, manufactura…"
            />
          </div>
          <div>
            <label htmlFor="empleados" className={etiqueta}>
              Cuántas personas trabajan en la empresa
            </label>
            <input
              id="empleados"
              name="empleados"
              type="number"
              min="1"
              defaultValue={perfil.employees_count ?? ""}
              className={campo}
              placeholder="50"
            />
          </div>
        </div>

        <div>
          <label htmlFor="facturacion" className={etiqueta}>
            Ventas anuales en dólares (aproximado)
          </label>
          <input
            id="facturacion"
            name="facturacion"
            type="number"
            min="0"
            step="100000"
            defaultValue={perfil.annual_revenue_usd ?? ""}
            className={campo}
            placeholder="5000000"
          />
          <p className="mt-2 text-xs leading-relaxed text-fg-subtle">
            Sirve para dos cosas: recomendarte el nivel de acompañamiento que te
            corresponde y que quien te atienda llegue sabiendo el tamaño de tu empresa.
            No se publica en ningún lado.
          </p>
        </div>
      </fieldset>

      {estado.error ? (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {estado.error}
        </p>
      ) : null}
      {estado.ok ? (
        <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          {estado.ok}
        </p>
      ) : null}

      <Enviar />
    </form>
  );
}
