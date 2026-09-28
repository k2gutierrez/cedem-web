import type { Metadata } from "next";
import { FormularioRegistro } from "@/components/auth/FormularioRegistro";
import { MarcoAcceso } from "@/components/auth/MarcoAcceso";
import { Revelar } from "@/components/fx/Efectos";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Crear cuenta en CEDEM 2.0",
  description:
    "Crea tu cuenta gratuita: haz tu Camino del Dueño, recibe tu lectura y guarda tu avance.",
  robots: { index: false, follow: false },
};

const beneficios = [
  "Tu Camino del Dueño completo, con tu lectura y tus ejercicios guardados.",
  "La biblioteca de artículos, webinars y documentos metodológicos.",
  "Seguimiento: puedes retomar donde lo dejaste desde cualquier dispositivo.",
];

export default async function PaginaRegistro(props: PageProps<"/registro">) {
  const parametros = await props.searchParams;
  const destino = typeof parametros.destino === "string" ? parametros.destino : "/app";

  return (
    <MarcoAcceso ancho="ancho" titulo="Crea tu cuenta">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Revelar>
          <Logo alto={32} />
          <h1 className="mt-8 text-h1 text-fg">Crea tu cuenta</h1>
          <p className="mt-4 max-w-[46ch] text-lead text-fg-muted">
            Es gratis y sin compromiso. Sirve para guardar tu diagnóstico y darte
            seguimiento: nada más.
          </p>

          <ul className="mt-8 space-y-4">
            {beneficios.map((b) => (
              <li key={b} className="flex gap-3 text-sm leading-relaxed text-fg-muted">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan dark:bg-sky"
                />
                {b}
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm leading-relaxed text-fg-subtle">
            Si ya eres cliente de CEDEM, tu consultor puede darte una invitación con
            acceso completo sin costo.
          </p>
        </Revelar>

        <Revelar retraso={0.12}>
          <div className="cristal rounded-3xl p-7 shadow-[var(--sombra-suave)] sm:p-9">
            <FormularioRegistro destino={destino} />
          </div>
        </Revelar>
      </div>
    </MarcoAcceso>
  );
}
