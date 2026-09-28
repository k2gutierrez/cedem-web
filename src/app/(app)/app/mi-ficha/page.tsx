import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioMiFicha, type FichaEditable } from "@/components/app/FormularioMiFicha";
import { SubirFoto } from "@/components/app/SubirFoto";
import { Revelar } from "@/components/fx/Efectos";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Mi ficha de consultor",
  robots: { index: false, follow: false },
};

/**
 * La ficha pública del consultor, editable por él mismo.
 *
 * QUÉ RESUELVE
 *
 * La base siempre permitió que un consultor editara su propia ficha —lo controla el
 * disparador `consultants_guard`, con su lista de campos permitidos—, pero no había
 * ninguna pantalla para hacerlo: cada cambio de cargo, de biografía o de enlace
 * había que pedírselo a quien administra el panel.
 *
 * La foto es la misma que la de su cuenta: se sube una vez y sale en los dos sitios.
 */
export default async function PaginaMiFicha() {
  const sesion = await obtenerSesion();
  if (!sesion.usuario) redirect("/acceso?destino=/app/mi-ficha");

  const supabase = await crearClienteServidor();

  const { data: ficha } = await supabase
    .from("consultants")
    .select(
      "id, slug, full_name, headline, location, bio_md, linkedin_url, x_url, website_url, email_public, specialties, languages, started_year, photo_path, is_active",
    )
    .eq("profile_id", sesion.usuario.id)
    .maybeSingle();

  if (!ficha) {
    return (
      <Container size="estrecho">
        <p className="tagline text-cyan dark:text-sky">Tu cuenta</p>
        <h1 className="mt-3 text-h1 text-fg">Mi ficha de consultor</h1>
        <div className="mt-8 rounded-2xl border border-border bg-bg p-8">
          <p className="font-display text-base font-bold text-fg">
            Tu cuenta todavía no tiene ficha de consultor
          </p>
          <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-fg-muted">
            La ficha es lo que aparece en la página de Equipo: tu nombre, tu cargo, tu
            biografía y tu foto. La crea el equipo de CEDEM desde el panel, y a partir de
            ahí puedes editarla tú.
          </p>
          <div className="mt-6">
            <BotonEnlace href="/app/perfil" variante="secundario">
              Ir a mi perfil
            </BotonEnlace>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container size="estrecho">
      <Revelar>
        <p className="tagline text-cyan dark:text-sky">Tu cuenta</p>
        <h1 className="mt-3 text-h1 text-fg">Mi ficha de consultor</h1>
        <p className="mt-4 max-w-[58ch] text-lead text-fg-muted">
          Esto es lo que ve un dueño cuando busca a alguien del equipo. Se publica en la
          página de Equipo en cuanto guardas.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <BotonEnlace
            href={`/equipo/${ficha.slug}`}
            variante="secundario"
            externo
          >
            Ver mi ficha publicada
            <IconoFlecha className="h-4 w-4" />
          </BotonEnlace>
          {!ficha.is_active ? (
            <span className="rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
              Tu ficha está oculta en este momento. El equipo de CEDEM decide cuándo se
              publica.
            </span>
          ) : null}
        </div>
      </Revelar>

      <Revelar retraso={0.08}>
        <div className="mt-8 rounded-3xl border border-border bg-bg p-7 sm:p-9">
          <h2 className="font-display text-lg font-bold text-fg">Tu foto</h2>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-fg-muted">
            Es la misma de tu cuenta: se sube una vez y aparece en tu perfil y en la página
            de Equipo.
          </p>
          <div className="mt-6">
            <SubirFoto
              persona={sesion.usuario.id}
              rutaActual={(ficha.photo_path as string | null) ?? null}
              nombre={ficha.full_name as string}
            />
          </div>
        </div>
      </Revelar>

      <Revelar retraso={0.14}>
        <div className="mt-6 rounded-3xl border border-border bg-bg p-7 sm:p-9">
          <FormularioMiFicha ficha={ficha as unknown as FichaEditable} />
        </div>
      </Revelar>

      <p className="mt-6 text-xs leading-relaxed text-fg-subtle">
        Hay cosas de tu ficha que solo puede cambiar CEDEM: la dirección de tu página, el
        orden en que apareces y si tu ficha se publica. Si necesitas alguna,{" "}
        <Link href="/contacto" className="underline underline-offset-4">
          escríbenos
        </Link>
        .
      </p>
    </Container>
  );
}
