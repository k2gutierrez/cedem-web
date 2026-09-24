import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioPerfil, type DatosPerfil } from "@/components/app/FormularioPerfil";
import { SubirFoto } from "@/components/app/SubirFoto";
import { CambiarContrasena } from "@/components/auth/CambiarContrasena";
import { Container } from "@/components/ui/Container";
import { nombreDe, obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Mi perfil",
  robots: { index: false, follow: false },
};

export default async function PaginaPerfil() {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) redirect("/acceso?destino=/app/perfil");

  const supabase = await crearClienteServidor();
  const [{ data: perfil }, { data: paises }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, phone, avatar_path, company_name, job_title, company_country_code, company_city, company_sector, employees_count, annual_revenue_usd",
      )
      .eq("id", sesion.usuario.id)
      .maybeSingle(),
    supabase.from("countries").select("code, name_es").eq("is_active", true).order("sort_order"),
  ]);

  return (
    <Container size="estrecho">
      <p className="tagline text-cyan dark:text-sky">Tu cuenta</p>
      <h1 className="mt-3 text-h1 text-fg">Mi perfil</h1>
      <p className="mt-4 max-w-[56ch] text-lead text-fg-muted">
        Con esto podemos darte mejores recomendaciones y que quien te acompañe llegue
        sabiendo cómo es tu empresa. Puedes cambiarlo cuando quieras.
      </p>

      <div className="mt-10 rounded-3xl border border-border bg-bg p-7 sm:p-9">
        <h2 className="font-display text-lg font-bold text-fg">Tu foto</h2>
        <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-fg-muted">
          Aparece en tu cuenta. Si eres consultor, la misma foto se ve en la página de
          Equipo.
        </p>
        <div className="mt-6">
          <SubirFoto
            persona={sesion.usuario.id}
            rutaActual={(perfil?.avatar_path as string | null) ?? null}
            nombre={nombreDe(sesion)}
          />
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-bg p-7 sm:p-9">
        <FormularioPerfil
          perfil={(perfil ?? {}) as DatosPerfil}
          paises={paises ?? [{ code: "MX", name_es: "México" }]}
        />
      </div>

      {/* La contraseña, en su propio bloque: quien entra aquí suele venir a otra
          cosa, y mezclar ambas cosas hace que se cambie sin querer. */}
      <div className="mt-6 rounded-3xl border border-border bg-bg p-7 sm:p-9">
        <h2 className="font-display text-lg font-bold text-fg">Tu contraseña</h2>
        <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-fg-muted">
          Cámbiala cuando quieras. Si la olvidas, puedes pedir un enlace desde la pantalla
          de acceso.
        </p>
        <div className="mt-6 max-w-[26rem]">
          <CambiarContrasena />
        </div>
      </div>

      <p className="mt-6 text-[12.5px] leading-relaxed text-fg-subtle">
        Tus datos son tuyos: puedes pedir que los borremos escribiendo a CEDEM. Lo que
        guardamos y para qué está en el{" "}
        <a href="/aviso-de-privacidad" className="underline underline-offset-4">
          aviso de privacidad
        </a>
        .
      </p>
    </Container>
  );
}
