import type { Metadata } from "next";
import { FormularioAcceso } from "@/components/auth/FormularioAcceso";
import { MarcoAcceso } from "@/components/auth/MarcoAcceso";
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
  const enlaceInvalido = parametros.aviso === "enlace-invalido";

  return (
    <MarcoAcceso
      titulo="Entra a CEDEM 2.0"
      entrada="Tu Camino del Dueño, la biblioteca completa y el seguimiento de tu avance."
    >
      {enlaceInvalido ? (
        <p
          role="status"
          className="mb-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
        >
          Ese enlace ya no sirve: los enlaces de recuperación caducan y solo se pueden
          usar una vez. Pide uno nuevo desde{" "}
          <a href="/recuperar" className="font-semibold underline underline-offset-4">
            Olvidé mi contraseña
          </a>
          .
        </p>
      ) : null}

      {!conectado ? (
        <div
          role="status"
          className="rounded-2xl border border-cyan/40 bg-sky/10 p-5 text-sm leading-relaxed text-fg-muted dark:border-sky/40"
        >
          <strong className="font-semibold text-fg">Falta conectar la base de datos.</strong>{" "}
          Mientras tanto, el{" "}
          <a href="/camino" className="font-semibold underline underline-offset-4">
            Camino del Dueño
          </a>{" "}
          funciona completo y sin registro.
        </div>
      ) : (
        <FormularioAcceso destino={destino} />
      )}
    </MarcoAcceso>
  );
}
