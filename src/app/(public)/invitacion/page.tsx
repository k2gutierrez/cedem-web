import type { Metadata } from "next";
import Link from "next/link";
import { FormularioCanje } from "@/components/admin/Invitaciones";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { IconoFlecha } from "@/components/ui/Iconos";
import { obtenerSesion } from "@/lib/auth/sesion";

export const metadata: Metadata = {
  title: "Canjear mi invitación",
  description:
    "Escribe el código que te dio CEDEM y activa tu acceso completo a la plataforma.",
  robots: { index: false, follow: false },
};

/**
 * Canje de una invitación cuando el código se teclea.
 *
 * Existe porque el enlace «Tengo un código» llevaba a `/invitacion` —sin código—
 * y esa ruta no existía: daba 404. Quien tiene una invitación casi nunca trae un
 * enlace, trae un código apuntado o reenviado por WhatsApp; lo natural es una
 * pantalla con un campo, no una URL que hay que adivinar.
 *
 * El canje lo sigue haciendo `redeem_invitation` en la base, que exige sesión
 * porque la invitación queda ligada a una persona: si el visitante no tiene
 * cuenta, aquí mismo se le ofrece crearla sin perder de vista lo que vino a hacer.
 */
export default async function PaginaCanje(props: PageProps<"/invitacion">) {
  const sesion = await obtenerSesion();
  const { codigo } = await props.searchParams;
  const codigoInicial = typeof codigo === "string" ? codigo : "";

  return (
    <section className="py-14 lg:py-20">
      <Container size="estrecho">
        <div className="mx-auto max-w-[30rem]">
          <p className="tagline text-cyan dark:text-sky">CEDEM 2.0</p>
          <h1 className="mt-4 text-h2 text-fg">Tu invitación</h1>
          <p className="mt-4 text-lead text-fg-muted">
            Esta invitación te da acceso completo a la plataforma: la biblioteca entera, tu
            Camino del Dueño y el seguimiento. Sin costo, porque ya eres cliente de CEDEM.
          </p>

          <div className="mt-8 rounded-3xl border border-border bg-bg p-7">
            {sesion.usuario ? (
              <>
                <p className="text-sm leading-relaxed text-fg-muted">
                  Escribe el código tal como te lo dieron. No distingue mayúsculas.
                </p>
                <div className="mt-6">
                  <FormularioCanje codigoInicial={codigoInicial} />
                </div>
              </>
            ) : (
              <>
                <p className="font-display text-base font-bold text-fg">
                  Primero entra a tu cuenta
                </p>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  La invitación queda ligada a una persona, no a un enlace que se pueda
                  reenviar. Entra con tu cuenta —o créala, es gratis— y vuelve aquí con tu
                  código: te esperamos en esta misma pantalla.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <BotonEnlace href="/acceso?destino=/invitacion" tamano="lg">
                    Entrar
                    <IconoFlecha className="h-4 w-4" />
                  </BotonEnlace>
                  <BotonEnlace
                    href="/registro?destino=/invitacion"
                    variante="secundario"
                    tamano="lg"
                  >
                    Crear mi cuenta
                  </BotonEnlace>
                </div>
              </>
            )}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-fg-subtle">
            ¿No tienes código? Pídeselo a tu consultor de CEDEM. Y si prefieres entrar por
            tu cuenta,{" "}
            <Link href="/unete" className="font-medium text-navy underline underline-offset-4 dark:text-sky">
              mira qué incluye la membresía
            </Link>
            .
          </p>
        </div>
      </Container>
    </section>
  );
}
