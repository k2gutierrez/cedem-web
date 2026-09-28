import Link from "next/link";
import { redirect } from "next/navigation";
import { EnlacesPlataforma } from "@/components/app/EnlacesPlataforma";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { salir } from "@/app/acciones/auth";
import { nombreDe, obtenerSesion } from "@/lib/auth/sesion";
import { navegacion } from "@/content/site";

/**
 * Layout de la plataforma CEDEM 2.0.
 *
 * El acceso ya lo cortó el proxy antes de llegar aquí, pero se vuelve a
 * comprobar: la autorización de verdad no se delega a una sola capa.
 */
export default async function LayoutPlataforma({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await obtenerSesion();

  if (sesion.sinConfigurar) {
    redirect("/acceso");
  }
  if (!sesion.usuario) {
    redirect("/acceso?destino=/app");
  }

  /* «Mi Camino» lleva al historial del miembro (sus diagnósticos), y desde ahí
     se puede volver a hacer el recorrido, que vive en `/camino` porque es público
     y funciona sin cuenta. */
  const enlaces = [
    { etiqueta: "Mi panel", href: "/app" },
    { etiqueta: "Mi Camino", href: "/app/camino" },
    { etiqueta: "Mi membresía", href: "/app/membresia" },
    { etiqueta: "Biblioteca", href: "/app/biblioteca" },
  ];

  /* «Mi ficha» solo aparece para quien tiene ficha de consultor: se comprueba en
     la base y no por el rol, porque un administrador puede no ser consultor y un
     consultor puede no administrar nada. */
  const { crearClienteServidor } = await import("@/lib/supabase/cliente-servidor");
  const supabaseDelMenu = await crearClienteServidor();
  const { data: miFicha } = await supabaseDelMenu
    .from("consultants")
    .select("id")
    .eq("profile_id", sesion.usuario.id)
    .maybeSingle();

  if (miFicha) {
    enlaces.splice(2, 0, { etiqueta: "Mi ficha", href: "/app/mi-ficha" });
    enlaces.splice(3, 0, { etiqueta: "Mis artículos", href: "/app/mis-articulos" });
  }
  if (sesion.esAdmin) {
    enlaces.push({ etiqueta: "Contenido", href: "/app/admin/contenido" });
    enlaces.push({ etiqueta: "Diagnósticos", href: "/app/admin/camino" });
    enlaces.push({ etiqueta: "Equipo", href: "/app/admin/equipo" });
    enlaces.push({ etiqueta: "Clientes", href: "/app/admin/clientes" });
    enlaces.push({ etiqueta: "Miembros", href: "/app/admin/miembros" });
    enlaces.push({ etiqueta: "Invitaciones", href: "/app/admin/invitaciones" });
    enlaces.push({ etiqueta: "Pagos", href: "/app/admin/planes" });
    enlaces.push({ etiqueta: "Correos", href: "/app/admin/correos" });
    enlaces.push({ etiqueta: "Auditoría", href: "/app/admin/auditoria" });
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-bg-soft">
      {/* La misma rejilla del sitio público, muy tenue: la plataforma se siente
          parte de CEDEM y no una herramienta aparte. */}
      <div
        aria-hidden="true"
        className="rejilla-tecnica pointer-events-none fixed inset-0 -z-10 opacity-60"
      />

      <header className="border-b border-border bg-bg/85 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/app" aria-label="CEDEM 2.0, ir al panel">
              <Logo alto={28} />
            </Link>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-fg-subtle sm:block">
              CEDEM 2.0
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-fg-muted">
                {nombreDe(sesion)}
                {sesion.esAdmin ? (
                  <span className="ml-2 rounded-full bg-sky/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-navy dark:text-sky">
                    {sesion.perfil?.role === "super_admin" ? "Super admin" : "Admin"}
                  </span>
                ) : null}
              </span>
              <form action={salir}>
                <button
                  type="submit"
                  className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:border-cyan hover:text-fg dark:hover:border-sky"
                >
                  Salir
                </button>
              </form>
            </div>
            <BotonEnlace href="/" variante="secundario" className="sm:hidden">
              Inicio
            </BotonEnlace>
          </div>
        </Container>

        <Container>
          <EnlacesPlataforma enlaces={enlaces} />
        </Container>
      </header>

      <main className="relative flex-1 py-10">{children}</main>

      <footer className="border-t border-border bg-bg py-6">
        <Container className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-fg-subtle">
            CEDEM · Centro de Dueñez Empresaria · &ldquo;Dueñez®&rdquo; es una marca
            registrada por Carlos A. Dumois Núñez.
          </p>
          <ul className="flex flex-wrap gap-5">
            {navegacion.slice(1, 4).map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-xs text-fg-subtle hover:text-fg">
                  {item.etiqueta}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/aviso-de-privacidad" className="text-xs text-fg-subtle hover:text-fg">
                Aviso de privacidad
              </Link>
            </li>
          </ul>
        </Container>
      </footer>
    </div>
  );
}
