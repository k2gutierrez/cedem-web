import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  alternarCliente,
  alternarPais,
  alternarTestimonio,
} from "@/app/acciones/equipo";
import {
  FormularioCliente,
  FormularioTestimonio,
  type Pais,
} from "@/components/admin/FormulariosClientes";
import { Container } from "@/components/ui/Container";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Clientes y presencia",
  robots: { index: false, follow: false },
};

type Cliente = {
  id: string;
  name: string;
  country_code: string;
  city: string | null;
  sector: string | null;
  brand_authorized: boolean;
  show_on_map: boolean;
  is_featured: boolean;
  is_active: boolean;
  relationship_since: number | null;
};

type Testimonio = {
  id: string;
  person_name: string;
  person_role: string | null;
  person_company: string | null;
  quote: string;
  authorized: boolean;
  is_published: boolean;
};

/** Botón que alterna un campo booleano de una fila. */
function BotonAlternar({
  accion,
  campos,
  texto,
  activo,
}: {
  accion: (datos: FormData) => Promise<void>;
  campos: Record<string, string>;
  texto: string;
  activo: boolean;
}) {
  return (
    <form action={accion}>
      {Object.entries(campos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      <button
        type="submit"
        aria-pressed={activo}
        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
          activo
            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
            : "border border-border text-fg-muted hover:border-cyan hover:text-fg dark:hover:border-sky"
        }`}
      >
        {texto}
      </button>
    </form>
  );
}

export default async function PaginaAdminClientes() {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/app");

  const supabase = await crearClienteServidor();
  const [{ data: clientes }, { data: paises }, { data: testimonios }] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, name, country_code, city, sector, brand_authorized, show_on_map, is_featured, is_active, relationship_since",
      )
      .order("sort_order"),
    supabase.from("countries").select("code, name_es, is_active").order("sort_order"),
    supabase
      .from("testimonials")
      .select("id, person_name, person_role, person_company, quote, authorized, is_published")
      .order("sort_order"),
  ]);

  const listaClientes = (clientes ?? []) as Cliente[];
  const listaPaises = (paises ?? []) as (Pais & { is_active: boolean })[];
  const listaTestimonios = (testimonios ?? []) as Testimonio[];
  const nombrePais = new Map(listaPaises.map((p) => [p.code, p.name_es]));

  return (
    <Container>
      <p className="tagline text-cyan dark:text-sky">Administración</p>
      <h1 className="mt-3 text-h1 text-fg">Clientes y presencia</h1>
      <p className="mt-4 max-w-[58ch] text-lead text-fg-muted">
        Las empresas que aparecen en el mapa y en los casos, y los testimonios autorizados.
        El logo de un cliente solo se publica si aquí está marcada su autorización.
      </p>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
        {[
          { etiqueta: "Clientes", valor: listaClientes.length },
          { etiqueta: "En el mapa", valor: listaClientes.filter((c) => c.show_on_map).length },
          {
            etiqueta: "Con marca autorizada",
            valor: listaClientes.filter((c) => c.brand_authorized).length,
          },
        ].map((dato) => (
          <div key={dato.etiqueta} className="bg-bg p-5">
            <dt className="text-xs uppercase tracking-[0.16em] text-fg-subtle">
              {dato.etiqueta}
            </dt>
            <dd className="mt-1.5 font-display text-2xl font-bold text-fg">{dato.valor}</dd>
          </div>
        ))}
      </dl>

      {/* Clientes */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-fg">Empresas cliente</h2>

        <details className="mt-5 rounded-2xl border border-border bg-bg p-6">
          <summary className="cursor-pointer font-display text-base font-bold text-fg">
            Agregar cliente
          </summary>
          <div className="mt-6">
            <FormularioCliente paises={listaPaises} />
          </div>
        </details>

        {listaClientes.length === 0 ? (
          <p className="mt-5 text-sm text-fg-muted">Todavía no hay clientes registrados.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {listaClientes.map((cliente) => (
              <li
                key={cliente.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-bg p-5"
              >
                <div>
                  <h3 className="font-display text-base font-bold text-fg">
                    {cliente.name}
                    {cliente.is_featured ? (
                      <span className="ml-2 rounded-full bg-sky/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-navy dark:text-sky">
                        Caso
                      </span>
                    ) : null}
                  </h3>
                  <p className="mt-1 text-sm text-fg-muted">
                    {nombrePais.get(cliente.country_code) ?? cliente.country_code}
                    {cliente.city ? ` · ${cliente.city}` : ""}
                    {cliente.sector ? ` · ${cliente.sector}` : ""}
                    {cliente.relationship_since ? ` · desde ${cliente.relationship_since}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <BotonAlternar
                    accion={alternarCliente}
                    campos={{
                      id: cliente.id,
                      campo: "brand_authorized",
                      valor: String(cliente.brand_authorized),
                    }}
                    texto={cliente.brand_authorized ? "Marca autorizada" : "Sin autorización"}
                    activo={cliente.brand_authorized}
                  />
                  <BotonAlternar
                    accion={alternarCliente}
                    campos={{
                      id: cliente.id,
                      campo: "show_on_map",
                      valor: String(cliente.show_on_map),
                    }}
                    texto={cliente.show_on_map ? "En el mapa" : "Fuera del mapa"}
                    activo={cliente.show_on_map}
                  />
                  <BotonAlternar
                    accion={alternarCliente}
                    campos={{
                      id: cliente.id,
                      campo: "is_featured",
                      valor: String(cliente.is_featured),
                    }}
                    texto={cliente.is_featured ? "Es caso" : "Marcar caso"}
                    activo={cliente.is_featured}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Países del mapa */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-bold text-fg">Países del mapa</h2>
        <p className="mt-2 max-w-[58ch] text-sm text-fg-muted">
          Los países activos se resaltan en el mapa de presencia. Enciende solo aquellos
          donde la firma haya tenido clientes.
        </p>
        <ul className="mt-5 flex flex-wrap gap-2.5">
          {listaPaises.map((pais) => (
            <li key={pais.code}>
              <BotonAlternar
                accion={alternarPais}
                campos={{ code: pais.code, activo: String(pais.is_active) }}
                texto={`${pais.name_es}${pais.is_active ? "" : " (apagado)"}`}
                activo={pais.is_active}
              />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-fg-subtle">
          Hoy se listan los diez países de la semilla. Para agregar otro, se añade a la tabla
          de países desde la base.
        </p>
      </section>

      {/* Testimonios */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-bold text-fg">Testimonios</h2>
        <p className="mt-2 max-w-[58ch] text-sm text-fg-muted">
          Un testimonio se publica solo si la persona autorizó su nombre y su dicho.
        </p>

        <details className="mt-5 rounded-2xl border border-border bg-bg p-6">
          <summary className="cursor-pointer font-display text-base font-bold text-fg">
            Agregar testimonio
          </summary>
          <div className="mt-6">
            <FormularioTestimonio />
          </div>
        </details>

        <ul className="mt-5 space-y-3">
          {listaTestimonios.map((t) => (
            <li key={t.id} className="rounded-2xl border border-border bg-bg p-5">
              <blockquote className="text-sm leading-relaxed text-fg">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-fg-muted">
                  <span className="font-semibold text-fg">{t.person_name}</span>
                  {t.person_role ? ` · ${t.person_role}` : ""}
                  {t.person_company ? ` · ${t.person_company}` : ""}
                </p>
                <BotonAlternar
                  accion={alternarTestimonio}
                  campos={{ id: t.id, publicado: String(t.is_published) }}
                  texto={t.is_published ? "Publicado" : "Sin publicar"}
                  activo={t.is_published}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
