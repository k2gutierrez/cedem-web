import type { Metadata } from "next";
import Link from "next/link";
import { AvatarIniciales } from "@/components/marketing/AvatarIniciales";
import { EncabezadoPagina } from "@/components/marketing/EncabezadoPagina";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { IconoFlecha } from "@/components/ui/Iconos";
import { claustroMaster } from "@/content/equipo";
import { obtenerEquipo } from "@/lib/datos/contenido";

export const metadata: Metadata = {
  title: "Equipo · Quién responde por el método",
  description:
    "Los socios, consultores y equipos de dirección de CEDEM: quién acompaña a los dueños, quién supervisa cada cuenta y quién está detrás de la firma desde 1985.",
};

/**
 * El equipo se lee de la base de datos: lo que el administrador carga en el
 * panel aparece aquí. Si todavía no hay nadie registrado, se muestra el
 * contenido semilla verificado con la firma.
 */
export default async function PaginaEquipo() {
  const { areas } = await obtenerEquipo();
  const totalPersonas = areas.reduce((suma, area) => suma + area.personas.length, 0);

  return (
    <>
      <EncabezadoPagina
        etiqueta="Equipo"
        antetitulo="El equipo"
        titulo="Las personas que responden por el método"
        entrada="CEDEM no manda equipos junior a tu empresa: quien dirige el trabajo es un socio o un consultor senior, y su nombre aparece en la propuesta."
      >
        <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          <div className="bg-bg p-5">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
              En la firma
            </dt>
            <dd className="mt-1.5 font-display text-[15px] font-semibold text-fg">
              {totalPersonas} personas
            </dd>
          </div>
          <div className="bg-bg p-5">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
              Organizadas en
            </dt>
            <dd className="mt-1.5 font-display text-[15px] font-semibold text-fg">
              Socios, consultores y coordinación
            </dd>
          </div>
          <div className="bg-bg p-5">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
              Claustro del Máster
            </dt>
            <dd className="mt-1.5 font-display text-[15px] font-semibold text-fg">
              {claustroMaster.docentes} docentes
            </dd>
          </div>
        </dl>
      </EncabezadoPagina>

      {/* Las tres áreas */}
      {areas.map((area, i) => (
        <section
          key={area.titulo}
          className={
            i % 2 === 1
              ? "border-y border-border bg-bg-soft py-14 lg:py-20"
              : "py-14 lg:py-20"
          }
        >
          <Container>
            <EncabezadoSeccion
              antetitulo={`${area.personas.length} personas`}
              titulo={area.titulo}
              entrada={area.descripcion}
            />

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {area.personas.map((persona) => {
                const ficha = persona.slug ? `/equipo/${persona.slug}` : null;
                const contenido = (
                  <>
                    {/* TODO: sustituir por la foto real cuando CEDEM entregue originales */}
                    <AvatarIniciales nombre={persona.nombre} />
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold leading-snug text-fg">
                        {persona.nombre}
                      </h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
                        {persona.cargo}
                      </p>
                    </div>
                  </>
                );
                const clases =
                  "flex items-center gap-4 rounded-2xl border border-border bg-bg p-5" +
                  (ficha ? " transition-colors hover:border-cyan/60 dark:hover:border-sky/60" : "");

                return ficha ? (
                  <Link key={persona.nombre} href={ficha} className={clases}>
                    {contenido}
                  </Link>
                ) : (
                  <article key={persona.nombre} className={clases}>
                    {contenido}
                  </article>
                );
              })}
            </div>
          </Container>
        </section>
      ))}

      {/* El perfil de cada consultor */}
      <section className="border-y border-border bg-navy py-14 text-white lg:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="tagline text-sky">Dentro de la plataforma</p>
              <h2 className="mt-3 max-w-[38rem] text-h2 text-white">
                Cada consultor tiene su perfil, con nombre y trayectoria
              </h2>
              <p className="mt-4 max-w-[52ch] text-lead text-white/80">
                En CEDEM 2.0 cada consultor publica su perfil: su CV, su LinkedIn, su
                cuenta de X y los artículos que ha escrito. Así sabes a quién le estás
                abriendo la empresa antes de la primera sesión.
              </p>
            </div>
            <div className="lg:justify-self-end">
              <BotonEnlace href="/unete" variante="claro" tamano="lg">
                Ver los perfiles
                <IconoFlecha className="h-4 w-4" />
              </BotonEnlace>
            </div>
          </div>
        </Container>
      </section>

      {/* Cierre */}
      <section className="py-14 lg:py-20">
        <Container>
          <div className="rounded-[28px] border border-border bg-bg-soft p-8 text-center lg:p-12">
            <h2 className="text-h2 text-fg">¿Con quién vas a trabajar?</h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-lead text-fg-muted">
              Dinos el tamaño y el momento de tu empresa y te ponemos frente al consultor
              que corresponde. Sin intermediarios.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <BotonEnlace href="/contacto" tamano="lg">
                Hablar con un socio
                <IconoFlecha className="h-4 w-4" />
              </BotonEnlace>
              <BotonEnlace href="/unete" variante="secundario" tamano="lg">
                Entrar a CEDEM 2.0
              </BotonEnlace>
            </div>
          </div>

          {/* Nota al pie */}
          <p className="mx-auto mt-8 max-w-[62ch] text-center text-[13px] leading-relaxed text-fg-subtle">
            El claustro del Máster incluye {claustroMaster.docentes} docentes de{" "}
            {claustroMaster.instituciones.slice(0, -1).join(", ")} y{" "}
            {claustroMaster.instituciones[claustroMaster.instituciones.length - 1]}.
          </p>
        </Container>
      </section>
    </>
  );
}
