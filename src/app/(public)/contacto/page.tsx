import type { Metadata } from "next";
import { FormularioContacto } from "@/components/marketing/FormularioContacto";
import { Container } from "@/components/ui/Container";
import { IconoPin, IconoTelefono, IconoWhatsApp } from "@/components/ui/Iconos";
import { contacto, sedes } from "@/content/site";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Habla con CEDEM: consultoría para dueños de empresa, programa PCE y el Máster con Euncet. Sede en Zapopan, Jalisco; oficinas en Miami y Houston.",
};

export default function PaginaContacto() {
  return (
    <section className="py-14 lg:py-20">
      <Container className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div>
          <p className="tagline text-cyan dark:text-sky">Contacto</p>
          <h1 className="mt-4 text-h1 text-fg">Hablemos de tu empresa</h1>
          <p className="mt-5 max-w-[52ch] text-lead text-fg-muted">
            Cuéntanos en qué momento está tu negocio y te orientamos sobre cuál de los tres
            niveles de acompañamiento te corresponde.
          </p>

          <div className="mt-10">
            <FormularioContacto />
          </div>
        </div>

        <aside className="space-y-8">
          <div className="rounded-2xl border border-border bg-bg-soft p-7">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-fg-subtle">
              Directo
            </h2>
            <ul className="mt-5 space-y-4">
              <li className="flex gap-3">
                <IconoTelefono className="mt-0.5 h-4 w-4 shrink-0 fill-cyan dark:fill-sky" />
                <a
                  href={contacto.telefonoHref}
                  className="text-base font-semibold text-fg hover:text-cyan dark:hover:text-sky"
                >
                  {contacto.telefono}
                </a>
              </li>
              <li className="flex gap-3">
                <IconoWhatsApp className="mt-0.5 h-4 w-4 shrink-0 fill-cyan dark:fill-sky" />
                <a
                  href={contacto.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-fg hover:text-cyan dark:hover:text-sky"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border p-7">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-fg-subtle">
              Oficinas
            </h2>
            <ul className="mt-5 space-y-5">
              {sedes.map((sede) => (
                <li key={sede.nombre} className="flex gap-3">
                  <IconoPin className="mt-1 h-[15px] w-[15px] shrink-0 fill-cyan dark:fill-sky" />
                  <div>
                    <a
                      href={sede.mapa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-fg hover:text-cyan dark:hover:text-sky"
                    >
                      {sede.nombre}
                    </a>
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                      {sede.direccion}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-navy p-7 text-white">
            <h2 className="font-display text-base font-bold text-white">
              ¿Ya eres cliente de CEDEM?
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[#c7d2e8]">
              Pide a tu consultor tu invitación a CEDEM 2.0, la plataforma de la firma. El
              acceso está incluido para clientes.
            </p>
          </div>
        </aside>
      </Container>
    </section>
  );
}
