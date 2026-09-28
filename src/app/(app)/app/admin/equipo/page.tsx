import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { alternarConsultor } from "@/app/acciones/equipo";
import { CuentaDeEquipo } from "@/components/admin/CuentaDeEquipo";
import { SubirFoto } from "@/components/app/SubirFoto";
import { FormularioConsultor, type Consultor } from "@/components/admin/FormularioConsultor";
import { Container } from "@/components/ui/Container";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Equipo",
  robots: { index: false, follow: false },
};

export default async function PaginaAdminEquipo() {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/app");

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("consultants")
    .select(
      "id, full_name, headline, location, bio_md, linkedin_url, x_url, email_public, specialties, is_founder, is_active, sort_order, profile_id, photo_path",
    )
    .order("sort_order");

  const equipo = (data ?? []) as Consultor[];
  const activos = equipo.filter((c) => c.is_active).length;

  return (
    <Container>
      <p className="tagline text-cyan dark:text-sky">Administración</p>
      <h1 className="mt-3 text-h1 text-fg">Equipo</h1>
      <p className="mt-4 max-w-[58ch] text-lead text-fg-muted">
        Quienes aparecen aquí salen en la página pública de equipo con su nombre, cargo y
        semblanza. Cada uno puede tener su perfil, sus artículos y sus datos de contacto
        profesional.
      </p>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
        {[
          { etiqueta: "En el sitio", valor: activos },
          { etiqueta: "Registrados", valor: equipo.length },
        ].map((dato) => (
          <div key={dato.etiqueta} className="bg-bg p-5">
            <dt className="text-xs uppercase tracking-[0.16em] text-fg-subtle">
              {dato.etiqueta}
            </dt>
            <dd className="mt-1.5 font-display text-2xl font-bold text-fg">{dato.valor}</dd>
          </div>
        ))}
      </dl>

      <details className="mt-8 rounded-2xl border border-border bg-bg p-6">
        <summary className="cursor-pointer font-display text-base font-bold text-fg">
          Agregar a alguien del equipo
        </summary>
        <div className="mt-6">
          <FormularioConsultor />
        </div>
      </details>

      {equipo.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-bg p-10 text-center">
          <p className="font-display text-lg font-bold text-fg">Todavía no hay nadie</p>
          <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-fg-muted">
            Registra a los socios y consultores de la firma. Aparecerán en la página pública
            en el orden que definas.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {equipo.map((persona) => (
            <li key={persona.id} className="rounded-2xl border border-border bg-bg p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-fg">
                    {persona.full_name}
                    {persona.is_founder ? (
                      <span className="ml-2 rounded-full bg-sky/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-navy dark:text-sky">
                        Fundador
                      </span>
                    ) : null}
                    {!persona.is_active ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                        Oculto
                      </span>
                    ) : null}
                  </h2>
                  <p className="mt-1 text-sm text-fg-muted">
                    {persona.headline ?? "Sin cargo"}
                    {persona.location ? ` · ${persona.location}` : ""}
                  </p>
                  {persona.specialties?.length ? (
                    <p className="mt-2 text-xs text-fg-subtle">
                      {persona.specialties.join(" · ")}
                    </p>
                  ) : null}
                </div>

                <form action={alternarConsultor}>
                  <input type="hidden" name="id" value={persona.id} />
                  <input type="hidden" name="activo" value={String(persona.is_active)} />
                  <button
                    type="submit"
                    className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-cyan hover:text-fg dark:hover:border-sky"
                  >
                    {persona.is_active ? "Ocultar del sitio" : "Mostrar en el sitio"}
                  </button>
                </form>
              </div>

              <details className="mt-5">
                <summary className="cursor-pointer text-sm font-semibold text-navy dark:text-sky">
                  Editar perfil
                </summary>
                <div className="mt-5 border-t border-border pt-5">
                  <FormularioConsultor consultor={persona} />
                </div>
              </details>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-navy dark:text-sky">
                  Su acceso y su foto
                </summary>
                <div className="mt-5 space-y-5 border-t border-border pt-5">
                  <CuentaDeEquipo
                    consultorId={persona.id as string}
                    nombre={persona.full_name as string}
                    correo={(persona.email_public as string | null) ?? null}
                    esSuperAdmin={sesion.perfil?.role === "super_admin"}
                    tieneCuenta={Boolean(persona.profile_id)}
                  />

                  <div>
                    <p className="text-sm font-semibold text-fg">Su foto</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
                      Se ve en la página de Equipo y en su perfil. Si no tiene, se muestran
                      sus iniciales.
                    </p>
                    <div className="mt-4">
                      <SubirFoto
                        persona={(persona.profile_id as string) ?? (persona.id as string)}
                        rutaActual={(persona.photo_path as string | null) ?? null}
                        nombre={persona.full_name as string}
                      />
                    </div>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
