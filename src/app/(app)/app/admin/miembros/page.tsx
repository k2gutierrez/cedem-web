import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cambiarRol, otorgarMembresia } from "@/app/acciones/miembros";
import { AvisoDeUrl } from "@/components/fx/AvisoDeUrl";
import { Container } from "@/components/ui/Container";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Miembros",
  robots: { index: false, follow: false },
};

/**
 * Miembros: quién entra, con qué rol y hasta cuándo.
 *
 * Esta pantalla faltaba. El plan la preveía y en la práctica significaba que dar
 * acceso a un cliente de la firma, extender una membresía o nombrar consultor
 * exigía SQL a mano. Las reglas (quién puede cambiar qué) las sigue imponiendo la
 * base; aquí solo se ofrecen las opciones que cada quien puede usar de verdad.
 */

const ETIQUETA_ROL: Record<string, string> = {
  miembro_free: "Gratuito",
  miembro_premium: "Premium",
  consultor: "Consultor",
  admin: "Administrador",
  super_admin: "Super admin",
  visitante: "Visitante",
};

const COLOR_ROL: Record<string, string> = {
  miembro_free: "border-border text-fg-subtle",
  miembro_premium: "bg-sky/15 text-navy dark:text-sky border-transparent",
  consultor: "bg-cyan/15 text-navy dark:text-sky border-transparent",
  admin: "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200 border-transparent",
  super_admin:
    "bg-red-100 text-red-900 dark:bg-red-400/15 dark:text-red-200 border-transparent",
  visitante: "border-border text-fg-subtle",
};

/**
 * Los niveles de usuario, explicados donde se asignan.
 *
 * Es la respuesta a «que como admin yo pueda ver los niveles de usuario para
 * definir qué es cada uno»: la misma pantalla donde se cambia el rol dice qué
 * significa cada rol, quién lo tiene y cómo se obtiene. Sin esto, «consultor» y
 * «admin» son dos palabras que cada quien interpreta a su manera.
 */
const NIVELES: {
  rol: string;
  titulo: string;
  paraQuien: string;
  puede: string;
  comoSeObtiene: string;
  paga: boolean;
}[] = [
  {
    rol: "miembro_free",
    titulo: "Miembro gratuito",
    paraQuien: "Cualquiera que cree una cuenta, sin pagar nada.",
    puede:
      "Hacer el Camino del Dueño completo, ver el primer párrafo de todo el contenido reservado y guardar su avance.",
    comoSeObtiene: "Se registra solo, desde /registro.",
    paga: false,
  },
  {
    rol: "miembro_premium",
    titulo: "Miembro premium",
    paraQuien: "El dueño que paga la membresía, o el cliente de la firma que entra por invitación.",
    puede:
      "Todo lo del nivel gratuito, más el archivo completo de CEDEM, los doce documentos del método en PDF y el seguimiento de su Camino.",
    comoSeObtiene:
      "Pagando la membresía, o por invitación de su consultor, o a mano desde esta pantalla.",
    paga: true,
  },
  {
    rol: "consultor",
    titulo: "Consultor de CEDEM",
    paraQuien: "El equipo de la firma que acompaña a los dueños.",
    puede:
      "Todo lo del nivel premium, más ver los diagnósticos de los dueños (Panel → Diagnósticos) y las notas que ellos comparten.",
    comoSeObtiene: "A mano, desde esta pantalla. Nunca pagando.",
    paga: false,
  },
  {
    rol: "admin",
    titulo: "Administrador",
    paraQuien: "Quien lleva el contenido y la operación del día a día.",
    puede:
      "Publicar artículos, podcasts, videos y eventos; gestionar equipo, clientes, invitaciones y pagos; ver la auditoría y dar acceso a miembros.",
    comoSeObtiene: "Solo un super administrador puede otorgarlo.",
    paga: false,
  },
  {
    rol: "super_admin",
    titulo: "Super administrador",
    paraQuien: "Quien responde por la plataforma. Conviene que sean pocos.",
    puede:
      "Todo lo del administrador, más nombrar administradores y cambiar la configuración del sistema.",
    comoSeObtiene:
      "A mano. Para la primera cuenta se usa `python3 scripts/promover-admin.py <correo>` desde el servidor.",
    paga: false,
  },
  {
    rol: "visitante",
    titulo: "Visitante",
    paraQuien: "Quien todavía no tiene cuenta.",
    puede:
      "Leer el sitio público, hacer el Camino del Dueño sin registrarse y leer el primer párrafo del contenido reservado.",
    comoSeObtiene: "No se asigna: es el estado de quien no ha entrado. Por eso no aparece en el desplegable.",
    paga: false,
  },
];

const ESTADO_SUSCRIPCION: Record<string, string> = {
  activa: "Activa",
  en_prueba: "En prueba",
  impaga: "Impaga",
  vencida: "Vencida",
  cancelada: "Cancelada",
  pausada: "Pausada",
};

type Miembro = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  company_name: string | null;
  job_title: string | null;
  created_at: string | null;
  last_seen_at: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  subscription_origin: string | null;
  ends_at: string | null;
  plan_name: string | null;
};

function fecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function diasRestantes(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export default async function PaginaAdminMiembros(props: PageProps<"/app/admin/miembros">) {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/app");

  const { q, aviso } = await props.searchParams;
  const busqueda = typeof q === "string" ? q.trim() : "";
  // El aviso de confirmación (`?hecho=…`) lo recoge `AvisoDeUrl` para mostrarlo
  // flotante y limpiar la dirección; aquí solo se lee el de error, que además se
  // queda escrito en la página para poder releerlo.
  const textoAviso = typeof aviso === "string" ? aviso : null;

  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("v_admin_members")
    .select(
      "id, email, full_name, role, company_name, job_title, created_at, last_seen_at, subscription_id, subscription_status, subscription_origin, ends_at, plan_name",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (busqueda) {
    // `or` con comas: se escapan las que traiga el texto para no romper el filtro.
    const limpio = busqueda.replace(/[,()]/g, " ");
    consulta = consulta.or(`email.ilike.%${limpio}%,full_name.ilike.%${limpio}%`);
  }

  const [{ data }, { data: planes }] = await Promise.all([
    consulta,
    supabase.from("plans").select("id, name, code").eq("is_active", true).order("sort_order"),
  ]);

  const miembros = (data ?? []) as Miembro[];
  const planesDisponibles = (planes ?? []) as { id: string; name: string; code: string }[];

  const conteos = {
    total: miembros.length,
    premium: miembros.filter((m) => m.role === "miembro_premium").length,
    equipo: miembros.filter((m) => m.role === "consultor" || m.role === "admin" || m.role === "super_admin").length,
    sinMembresia: miembros.filter((m) => !m.subscription_id).length,
  };

  const esSuperAdmin = sesion.perfil?.role === "super_admin";

  // Los roles que quien mira puede otorgar. La base vuelve a comprobarlo: esto es
  // para no ofrecer un botón que va a fallar, no para autorizar.
  const rolesOfrecidos = [
    { valor: "miembro_free", etiqueta: "Miembro gratuito" },
    { valor: "miembro_premium", etiqueta: "Miembro premium" },
    { valor: "consultor", etiqueta: "Consultor" },
    ...(esSuperAdmin
      ? [
          { valor: "admin", etiqueta: "Administrador" },
          { valor: "super_admin", etiqueta: "Super administrador" },
        ]
      : []),
  ];

  return (
    <Container size="ancho">
      <p className="tagline text-cyan dark:text-sky">Administración</p>
      <h1 className="mt-3 text-h1 text-fg">Miembros</h1>
      <p className="mt-4 max-w-[62ch] text-lead text-fg-muted">
        Quién tiene cuenta, con qué rol y hasta cuándo. Los clientes de la firma entran por
        invitación; aquí se da acceso a quien ya es cliente, se extiende una membresía o se
        nombra consultor.
      </p>

      {/* El aviso de lo que acaba de pasar llega flotando y con la URL limpia.
          Se queda además el párrafo cuando es un error, porque un error hay que
          poder releerlo sin prisa. */}
      <AvisoDeUrl />
      {textoAviso ? (
        <p
          role="status"
          className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
        >
          {textoAviso}
        </p>
      ) : null}

      {/* Cifras */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { etiqueta: "Cuentas", valor: conteos.total },
          { etiqueta: "Con membresía", valor: conteos.premium },
          { etiqueta: "Equipo CEDEM", valor: conteos.equipo },
          { etiqueta: "Sin membresía", valor: conteos.sinMembresia },
        ].map((cifra) => (
          <div key={cifra.etiqueta} className="rounded-2xl border border-border bg-bg p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">
              {cifra.etiqueta}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-fg">{cifra.valor}</p>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <form className="mt-8 flex flex-wrap gap-3" action="/app/admin/miembros">
        <input
          type="search"
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por nombre o correo"
          className="min-w-[240px] flex-1 rounded-full border border-border bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-cyan focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-navy px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-cyan dark:bg-sky dark:text-navy"
        >
          Buscar
        </button>
        {busqueda ? (
          <a
            href="/app/admin/miembros"
            className="rounded-full border border-border px-5 py-2.5 font-display text-sm font-semibold text-fg-muted hover:border-cyan"
          >
            Ver todos
          </a>
        ) : null}
      </form>

      {/* Lista */}
      {miembros.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-bg p-8">
          <p className="text-sm leading-relaxed text-fg-muted">
            {busqueda
              ? `Nadie coincide con «${busqueda}».`
              : "Todavía no hay cuentas registradas."}
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {miembros.map((miembro) => {
            const restantes = diasRestantes(miembro.ends_at);
            const esUnoMismo = miembro.id === sesion.usuario?.id;
            const vencePronto = restantes !== null && restantes <= 30;

            return (
              <li key={miembro.id} className="rounded-2xl border border-border bg-bg p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-[220px] flex-1">
                    <p className="font-display text-sm font-bold text-fg">
                      {miembro.full_name ?? "Sin nombre"}
                      {esUnoMismo ? (
                        <span className="ml-2 text-xs font-normal text-fg-subtle">(tú)</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-fg-muted">{miembro.email ?? "sin correo"}</p>
                    {miembro.company_name ? (
                      <p className="mt-1 text-xs text-fg-subtle">
                        {miembro.company_name}
                        {miembro.job_title ? ` · ${miembro.job_title}` : ""}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                        COLOR_ROL[miembro.role] ?? COLOR_ROL.miembro_free
                      }`}
                    >
                      {ETIQUETA_ROL[miembro.role] ?? miembro.role}
                    </span>
                    {miembro.subscription_id ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                        {ESTADO_SUSCRIPCION[miembro.subscription_status ?? ""] ?? "Membresía"}
                      </span>
                    ) : (
                      <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                        Sin membresía
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
                  <span>Alta: {fecha(miembro.created_at)}</span>
                  <span aria-hidden="true">·</span>
                  <span>Último acceso: {fecha(miembro.last_seen_at)}</span>
                  {miembro.subscription_id ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className={vencePronto ? "font-semibold text-amber-700 dark:text-amber-300" : ""}>
                        {miembro.plan_name ?? "Membresía"} hasta {fecha(miembro.ends_at)}
                        {restantes !== null ? ` (${restantes} días)` : ""}
                      </span>
                      {miembro.subscription_origin ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Origen: {miembro.subscription_origin}</span>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </p>

                {/* Acciones: dos formularios dentro de un desplegable nativo */}
                <details className="group mt-4">
                  <summary className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3.5 py-1.5 font-display text-xs font-semibold text-fg-muted transition-colors hover:border-cyan hover:text-navy dark:hover:border-sky dark:hover:text-sky">
                    Dar acceso o cambiar rol
                  </summary>

                  <div className="mt-4 grid gap-5 rounded-xl border border-border bg-bg-soft p-5 lg:grid-cols-2">
                    {/* Membresía */}
                    <form action={otorgarMembresia} className="space-y-3">
                      <input type="hidden" name="usuario" value={miembro.id} />
                      <p className="font-display text-xs font-bold uppercase tracking-wider text-fg-subtle">
                        {miembro.subscription_id ? "Extender membresía" : "Dar membresía"}
                      </p>

                      <label className="block text-sm text-fg-muted">
                        Plan
                        <select
                          name="plan"
                          required
                          defaultValue={planesDisponibles[0]?.id ?? ""}
                          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-cyan focus:outline-none"
                        >
                          {planesDisponibles.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-sm text-fg-muted">
                        Días de vigencia
                        <input
                          type="number"
                          name="dias"
                          min="1"
                          step="1"
                          defaultValue="365"
                          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-cyan focus:outline-none"
                        />
                      </label>

                      <label className="block text-sm text-fg-muted">
                        Motivo (queda en la auditoría)
                        <input
                          type="text"
                          name="motivo"
                          placeholder="Cliente de la firma, acuerdo comercial…"
                          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-cyan focus:outline-none"
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={planesDisponibles.length === 0}
                        className="rounded-full bg-navy px-4 py-2 font-display text-sm font-semibold text-white transition-colors hover:bg-cyan disabled:opacity-50 dark:bg-sky dark:text-navy"
                      >
                        {miembro.subscription_id ? "Extender" : "Activar membresía"}
                      </button>
                    </form>

                    {/* Rol */}
                    <form action={cambiarRol} className="space-y-3">
                      <input type="hidden" name="usuario" value={miembro.id} />
                      <p className="font-display text-xs font-bold uppercase tracking-wider text-fg-subtle">
                        Rol
                      </p>

                      <label className="block text-sm text-fg-muted">
                        Nuevo rol
                        <select
                          name="rol"
                          required
                          defaultValue={miembro.role}
                          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-cyan focus:outline-none"
                        >
                          {rolesOfrecidos.map((rol) => (
                            <option key={rol.valor} value={rol.valor}>
                              {rol.etiqueta}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-sm text-fg-muted">
                        Motivo (queda en la auditoría)
                        <input
                          type="text"
                          name="motivo"
                          placeholder="Por qué cambia"
                          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-cyan focus:outline-none"
                        />
                      </label>

                      <button
                        type="submit"
                        className="rounded-full border border-border px-4 py-2 font-display text-sm font-semibold text-fg-muted transition-colors hover:border-cyan hover:text-navy dark:hover:border-sky dark:hover:text-sky"
                      >
                        Cambiar rol
                      </button>

                      {!esSuperAdmin ? (
                        <p className="text-xs leading-relaxed text-fg-subtle">
                          Los permisos de administración solo los puede dar un super
                          administrador.
                        </p>
                      ) : null}
                      {esUnoMismo ? (
                        <p className="text-xs leading-relaxed text-fg-subtle">
                          No puedes quitarte tu propio permiso de administración.
                        </p>
                      ) : null}
                    </form>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}

      {/* Los niveles, explicados */}
      <details className="group mt-10 rounded-2xl border border-border bg-bg p-6">
        <summary className="cursor-pointer font-display text-base font-bold text-fg">
          Qué puede hacer cada nivel
        </summary>
        <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-fg-muted">
          Nadie paga por ser consultor ni administrador: los permisos del equipo se dan a
          mano desde esta pantalla. El pago solo decide el acceso al contenido reservado, y
          los clientes de la firma lo reciben por invitación.
        </p>

        <ul className="mt-6 space-y-4">
          {NIVELES.map((nivel) => (
            <li key={nivel.rol} className="rounded-xl border border-border bg-bg-soft p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                    COLOR_ROL[nivel.rol] ?? COLOR_ROL.miembro_free
                  }`}
                >
                  {nivel.titulo}
                </span>
                <code className="font-mono text-xs text-fg-subtle">{nivel.rol}</code>
                <span
                  className={
                    nivel.paga
                      ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-400/15 dark:text-amber-200"
                      : "rounded-full border border-border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-fg-subtle"
                  }
                >
                  {nivel.paga ? "Se paga" : "Sin pago"}
                </span>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm leading-relaxed">
                <div>
                  <dt className="inline font-semibold text-fg-muted">Para quién: </dt>
                  <dd className="inline text-fg-muted">{nivel.paraQuien}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-fg-muted">Qué puede hacer: </dt>
                  <dd className="inline text-fg-muted">{nivel.puede}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-fg-muted">Cómo se obtiene: </dt>
                  <dd className="inline text-fg-muted">{nivel.comoSeObtiene}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </details>

      <p className="mt-10 text-xs leading-relaxed text-fg-subtle">
        Cada cambio de rol y cada membresía otorgada quedan registrados con su motivo en{" "}
        <a href="/app/admin/auditoria" className="font-medium text-navy dark:text-sky">
          Auditoría
        </a>
        . Las membresías activas se vencen solas: el trabajo diario no depende de que alguien
        se acuerde.
      </p>
    </Container>
  );
}
