import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import {
  IconoFacebook,
  IconoInstagram,
  IconoLinkedIn,
  IconoPin,
  IconoTelefono,
  IconoWhatsApp,
  IconoYouTube,
} from "@/components/ui/Iconos";
import { contacto, navegacion, redes, sedes } from "@/content/site";

/** Icono por red social, para no repetir condicionales en el marcado. */
const iconosRed: Record<string, (p: { className?: string }) => React.ReactElement> = {
  LinkedIn: IconoLinkedIn,
  Facebook: IconoFacebook,
  Instagram: IconoInstagram,
  WhatsApp: IconoWhatsApp,
  YouTube: IconoYouTube,
};

const tituloColumna =
  "font-display text-xs font-bold uppercase tracking-[0.2em] text-white";

export function Footer() {
  return (
    <footer className="relative mt-auto bg-navy text-white">
      {/* Regla de acento cian, como en las aplicaciones del manual */}
      <div className="h-[3px] w-full bg-gradient-to-r from-cyan via-sky to-transparent" />

      <Container className="pt-14 pb-0">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1.15fr_1fr] lg:gap-14">
          {/* 1 · Marca */}
          <div>
            <Logo variante="blanco" alto={38} />
            <p className="tagline mt-4 text-sky">El valor de ser dueño</p>
            <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-[#c7d2e8]">
              Centro de Dueñez Empresaria. Integramos una escuela de formación de dueños
              con una firma de consultoría especializada en gestión de valor. Desde 1985.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {redes.map((red) => {
                const Icono = iconosRed[red.nombre];
                return (
                  <li key={red.nombre}>
                    <a
                      href={red.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={red.nombre}
                      className="grid h-10 w-10 place-items-center rounded-full border border-sky/25 bg-white/10 text-white transition-colors hover:border-cyan hover:bg-cyan"
                    >
                      {Icono ? <Icono className="h-[17px] w-[17px]" /> : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 2 · Sedes */}
          <div>
            <h2 className={tituloColumna}>
              <span className="block border-b border-sky/25 pb-2.5">Dónde estamos</span>
            </h2>
            <ul className="mt-5 space-y-5">
              {sedes.map((sede) => (
                <li key={sede.nombre} className="flex gap-3">
                  <IconoPin className="mt-1 h-[15px] w-[15px] shrink-0 fill-sky" />
                  <div>
                    <a
                      href={sede.mapa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-white hover:text-sky"
                    >
                      {sede.nombre}
                    </a>
                    <p className="mt-1 text-sm leading-relaxed text-[#a9b8d6]">
                      {sede.direccion}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 3 · Contacto y navegación */}
          <div>
            <h2 className={tituloColumna}>
              <span className="block border-b border-sky/25 pb-2.5">Contacto</span>
            </h2>
            <ul className="mt-5 space-y-4">
              <li className="flex gap-3">
                <IconoTelefono className="mt-1 h-4 w-4 shrink-0 fill-sky" />
                <div>
                  <span className="block text-xs uppercase tracking-[0.14em] text-[#8fa3c8]">
                    Teléfono
                  </span>
                  <a
                    href={contacto.telefonoHref}
                    className="text-sm font-semibold text-white hover:text-sky"
                  >
                    {contacto.telefono}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <IconoWhatsApp className="mt-1 h-4 w-4 shrink-0 fill-sky" />
                <div>
                  <span className="block text-xs uppercase tracking-[0.14em] text-[#8fa3c8]">
                    WhatsApp
                  </span>
                  <a
                    href={contacto.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-white hover:text-sky"
                  >
                    Escríbenos
                  </a>
                </div>
              </li>
            </ul>

            <h2 className={`${tituloColumna} mt-9`}>
              <span className="block border-b border-sky/25 pb-2.5">Explora</span>
            </h2>
            <ul className="mt-5 space-y-2.5">
              {navegacion.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-[#c7d2e8] transition-colors hover:text-white"
                  >
                    {item.etiqueta}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/unete"
                  className="text-sm text-[#c7d2e8] transition-colors hover:text-white"
                >
                  Únete a CEDEM 2.0
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="mt-14 border-t border-white/15">
          <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-[#8fa3c8]">
              Copyright © Todos los Derechos Reservados.
              <br />
              CEDEM – Centro de Dueñez Empresaria · &ldquo;Dueñez®&rdquo; es una marca
              registrada por Carlos A. Dumois Núñez.
            </p>
            <ul className="flex flex-wrap gap-6">
              <li>
                <Link
                  href="/aviso-de-privacidad"
                  className="text-xs text-[#c7d2e8] hover:text-sky hover:underline"
                >
                  Aviso de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-xs text-[#c7d2e8] hover:text-sky hover:underline"
                >
                  Términos y condiciones
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
}
