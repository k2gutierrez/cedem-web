import type { Metadata } from "next";
import { FormularioAcceso } from "@/components/auth/FormularioAcceso";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { supabaseConfigurado } from "@/lib/supabase/configurado";

export const metadata: Metadata = {
  title: "Entrar a CEDEM 2.0",
  description:
    "Entra a la plataforma de CEDEM: tu Camino del Dueño, la biblioteca completa y el perfil de tu consultor.",
  robots: { index: false, follow: false },
};

export default async function PaginaAcceso(props: PageProps<"/acceso">) {
  const parametros = await props.searchParams;
  const destino = typeof parametros.destino === "string" ? parametros.destino : "/app";
  const conectado = supabaseConfigurado();

  return (
    <section className="py-14 lg:py-20">
      <Container size="estrecho">
        <div className="mx-auto max-w-[26rem]">
          <div className="flex justify-center">
            <Logo alto={34} />
          </div>

          <h1 className="mt-8 text-center text-h2 text-fg">Entra a CEDEM 2.0</h1>
          <p className="mt-3 text-center text-sm text-fg-muted">
            Tu Camino del Dueño, la biblioteca completa y el seguimiento de tu avance.
          </p>

          {!conectado ? (
            <div
              role="status"
              className="mt-8 rounded-2xl border border-cyan/40 bg-sky/10 p-5 text-[13px] leading-relaxed text-fg-muted dark:border-sky/40"
            >
              <strong className="font-semibold text-fg">Falta conectar la base de datos.</strong>{" "}
              Mientras tanto, el <a href="/camino" className="font-semibold underline underline-offset-4">Camino del Dueño</a>{" "}
              funciona completo y sin registro.
            </div>
          ) : (
            <div className="mt-8">
              <FormularioAcceso destino={destino} />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
