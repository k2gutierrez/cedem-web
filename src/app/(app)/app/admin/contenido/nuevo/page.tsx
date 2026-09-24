import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioContenido } from "@/components/admin/FormularioContenido";
import { Container } from "@/components/ui/Container";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Nuevo contenido",
  robots: { index: false, follow: false },
};

export default async function PaginaNuevoContenido() {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/app");

  const supabase = await crearClienteServidor();
  const { data: consultores } = await supabase
    .from("consultants")
    .select("id, display_name, full_name")
    .eq("is_active", true)
    .order("sort_order")
    .limit(40);

  const lista = (consultores ?? []).map((c) => ({
    id: c.id,
    nombre: c.display_name || c.full_name || "Consultor",
  }));

  return (
    <Container size="estrecho">
      <nav aria-label="Ruta" className="text-[13px] text-fg-subtle">
        <Link href="/app/admin/contenido" className="hover:text-cyan dark:hover:text-sky">
          Contenido
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-fg-muted">Nuevo</span>
      </nav>

      <h1 className="mt-6 text-h2 text-fg">Nuevo contenido</h1>
      <p className="mt-4 max-w-[56ch] text-lead text-fg-muted">
        Escribe y publica sin tocar código. Puedes guardarlo como borrador y publicarlo
        cuando esté listo.
      </p>

      <div className="mt-10 rounded-3xl border border-border bg-bg p-7 sm:p-9">
        <FormularioContenido consultores={lista} />
      </div>
    </Container>
  );
}
