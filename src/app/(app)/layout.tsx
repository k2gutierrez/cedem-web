import Link from "next/link";
import { redirect } from "next/navigation";
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

  const enlaces = [
    { etiqueta: "Mi panel", href: "/app" },
    { etiqueta: "Mi Camino", href: "/app/camino" },
    { etiqueta: "Biblioteca", href: "/recursos" },
  ];
  if (sesion.esAdmin) {
    enlaces.push({ etiqueta: "Contenido", href: "/app/admin/contenido" });
    enlaces.push({ etiqueta: "Diagnósticos", href: "/app/admin/camino" });
    enlaces.push({ etiqueta: "Equipo", href: "/app/admin/equipo" });
    enlaces.push({ etiqueta: "Clientes", href: "/app/admin/clientes" });
    enlaces.push({ etiqueta: "Invitaciones", href: "/app/admin/invitaciones" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-soft">
      <header className="border-b border-border bg-bg">
        <Container className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/app" aria-label="CEDEM 2.0, ir al panel">
              <Logo alto={28} />
            </Link>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.2em] text-fg-subtle sm:block">
              CEDEM 2.0
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-[13px] text-fg-muted">
                {nombreDe(sesion)}
                {sesion.esAdmin ? (
                  <span className="ml-2 rounded-full bg-sky/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-navy dark:text-sky">
                    {sesion.perfil?.role === "super_admin" ? "Super admin" : "Admin"}
                  </span>
                ) : null}
              </span>
              <form action={salir}>
                <button
                  type="submit"
                  className="rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium text-fg-muted transition-colors hover:border-cyan hover:text-fg dark:hover:border-sky"
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
          <nav aria-label="Navegación de la plataforma" className="-mb-px flex gap-1 overflow-x-auto">
            {enlaces.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className="whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-cyan hover:text-fg dark:hover:border-sky"
              >
                {enlace.etiqueta}
              </Link>
            ))}
          </nav>
        </Container>
      </header>

      <main className="flex-1 py-10">{children}</main>

      <footer className="border-t border-border bg-bg py-6">
        <Container className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[12px] text-fg-subtle">
            CEDEM · Centro de Dueñez Empresaria · &ldquo;Dueñez®&rdquo; es una marca
            registrada por Carlos A. Dumois Núñez.
          </p>
          <ul className="flex flex-wrap gap-5">
            {navegacion.slice(1, 4).map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-[12px] text-fg-subtle hover:text-fg">
                  {item.etiqueta}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/aviso-de-privacidad" className="text-[12px] text-fg-subtle hover:text-fg">
                Aviso de privacidad
              </Link>
            </li>
          </ul>
        </Container>
      </footer>
    </div>
  );
}
