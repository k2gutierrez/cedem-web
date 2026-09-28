import type { Metadata } from "next";
import Link from "next/link";
import { MapaClientes } from "@/components/marketing/MapaClientes";
import { EncabezadoPagina } from "@/components/marketing/EncabezadoPagina";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { IconoFlecha, IconoPin } from "@/components/ui/Iconos";
import { casos, metodo, sedes } from "@/content/site";

export const metadata: Metadata = {
  title: "Nosotros · Escuela de dueños y firma de consultoría desde 1985",
  description:
    "CEDEM integra una escuela de formación de dueños con una firma de consultoría en gestión de valor. Más de 3,000 empresarios acompañados en 12 países de Iberoamérica desde 1985.",
};

const paises = [
  "México",
  "Guatemala",
  "Venezuela",
  "El Salvador",
  "Panamá",
  "Colombia",
  "Ecuador",
  "Puerto Rico",
  "España",
  "Andorra",
  "Canadá",
  "Estados Unidos",
];

/** El dueño y el director no compiten: responden por cosas distintas. */
const roles = [
  {
    titulo: "El dueño",
    texto:
      "Responde por el patrimonio y por el rumbo: decide la fórmula de negocio, la de gobierno y la propiedad. Puede compartir su Dueñez, pero no delegarla.",
  },
  {
    titulo: "El director",
    texto:
      "Responde por la operación: ejecuta la estrategia, administra los recursos y rinde cuentas. Su rol se contrata y se sustituye sin perder el rumbo.",
  },
];

/** Quita el asterisco de nota que trae el texto original de un caso. */
function sinNota(texto: string): string {
  return texto.replace(/\s*\*+\s*$/, "");
}

export default function PaginaNosotros() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Nosotros"
        antetitulo="La firma"
        titulo="Una escuela de dueños y una firma de consultoría, en la misma casa"
        entrada="Aquí se forma y se acompaña al que decide. Lo que aprendemos con las empresas se vuelve programa; lo que enseñamos se aplica en tu empresa al día siguiente."
      >
        <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-bg p-5">
            <dt className="text-xs uppercase tracking-[0.16em] text-fg-subtle">
              Desde
            </dt>
            <dd className="mt-1.5 font-display text-base font-semibold text-fg">1985</dd>
          </div>
          <div className="bg-bg p-5">
            <dt className="text-xs uppercase tracking-[0.16em] text-fg-subtle">
              Empresarios acompañados
            </dt>
            <dd className="mt-1.5 font-display text-base font-semibold text-fg">
              Más de 3,000
            </dd>
          </div>
          <div className="bg-bg p-5">
            <dt className="text-xs uppercase tracking-[0.16em] text-fg-subtle">
              Países
            </dt>
            <dd className="mt-1.5 font-display text-base font-semibold text-fg">
              {paises.length} en Iberoamérica
            </dd>
          </div>
          <div className="bg-bg p-5">
            <dt className="text-xs uppercase tracking-[0.16em] text-fg-subtle">
              Sedes
            </dt>
            <dd className="mt-1.5 font-display text-base font-semibold text-fg">
              Zapopan, Miami y Houston
            </dd>
          </div>
        </dl>
      </EncabezadoPagina>

      {/* Qué es CEDEM */}
      <section className="py-14 lg:py-20">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <EncabezadoSeccion
            antetitulo="Qué es CEDEM"
            titulo="Escuela y firma, sin separación"
            entrada="Centro de Dueñez Empresaria. Cuatro décadas formando y acompañando a quien decide."
          />
          <div className="space-y-4 text-base leading-relaxed text-fg-muted">
            <p>
              No somos una consultora que además da cursos, ni una escuela que además
              asesora. Somos las dos cosas: lo que se produce acompañando empresas se
              enseña, y lo que se enseña se aplica.
            </p>
            <p>
              Desde 1985 hemos acompañado a más de 3,000 empresarios en Iberoamérica. Ese
              archivo de casos es el activo de la casa: lo que ya funcionó y lo que ya
              falló.
            </p>
            <div className="rounded-2xl border border-border bg-bg-soft p-6">
              <p className="font-display text-base font-bold text-fg">
                &ldquo;Dueñez®&rdquo; es una marca registrada por Carlos A. Dumois Núñez.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                CEDEM es el Centro de Dueñez Empresaria: el nombre con el que la firma
                nombró el rol que aquí se enseña y se ejerce.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* La Dueñez */}
      <section className="border-y border-border bg-bg-soft py-14 lg:py-20">
        <Container>
          <EncabezadoSeccion
            antetitulo="El concepto"
            titulo="La Dueñez se puede compartir, pero no es delegable"
            entrada="Nadie puede sustituir al dueño en las tareas que le corresponden. Esa es la diferencia entre tener el control y ejercerlo."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {roles.map((rol) => (
              <article key={rol.titulo} className="borde-vivo rounded-2xl border border-border bg-bg p-7">
                <h3 className="font-display text-xl font-bold text-fg">{rol.titulo}</h3>
                <div className="regla-acento mt-5" />
                <p className="mt-5 text-base leading-relaxed text-fg-muted">{rol.texto}</p>
              </article>
            ))}
          </div>

          <p className="mt-8 max-w-[62ch] text-base leading-relaxed text-fg-muted">
            El problema de muchas empresas familiares no es el director: es el dueño que
            nunca ocupó su lugar. Cuando eso pasa, manda quien no responde por el
            patrimonio.
          </p>
        </Container>
      </section>

      {/* El método, en resumen */}
      <section className="py-14 lg:py-20">
        <Container>
          <EncabezadoSeccion
            antetitulo="El método"
            titulo="Generar, multiplicar y capturar valor"
            entrada="Tres verbos con sus componentes. El resumen de lo que se aplica en cada acompañamiento."
          />

          <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border lg:grid-cols-3">
            {metodo.map((paso, i) => (
              <li key={paso.verbo} className="bg-bg p-7 lg:p-8">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-xs font-bold text-cyan dark:text-sky">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-fg">{paso.verbo}</h3>
                </div>
                <p className="mt-2 text-sm uppercase tracking-[0.14em] text-fg-subtle">
                  {paso.marco}
                </p>

                <ul className="mt-6 space-y-2.5 border-t border-border pt-5">
                  {paso.componentes.map((componente) => (
                    <li
                      key={componente}
                      className="flex items-start gap-2.5 text-sm text-fg-muted"
                    >
                      <IconoFlecha
                        className="mt-[3px] h-4 w-4 shrink-0 text-cyan dark:text-sky"
                        aria-hidden="true"
                      />
                      {componente}
                    </li>
                  ))}
                </ul>

                <p className="mt-6 border-l-2 border-cyan pl-4 font-display text-sm italic leading-relaxed text-fg">
                  {paso.idea}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <BotonEnlace href="/consulting" variante="secundario" tamano="lg">
              Ver cómo se aplica en Consulting
              <IconoFlecha className="h-4 w-4" />
            </BotonEnlace>
          </div>
        </Container>
      </section>

      {/* Presencia */}
      <section className="border-y border-border bg-bg-soft py-14 lg:py-20">
        <Container>
          <EncabezadoSeccion
            antetitulo="Dónde estamos"
            titulo="Tres sedes y doce países"
            entrada="La firma opera desde Zapopan, Miami y Houston, y acompaña empresas en doce países de Iberoamérica y América del Norte."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {sedes.map((sede) => (
              <article key={sede.nombre} className="rounded-2xl border border-border bg-bg p-7">
                <IconoPin className="h-5 w-5 fill-cyan dark:fill-sky" />
                <h3 className="mt-4 font-display text-lg font-bold text-fg">{sede.nombre}</h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">{sede.direccion}</p>
                <a
                  href={sede.mapa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 font-display text-sm font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
                >
                  Ver en Google Maps
                  <IconoFlecha className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>

          <div className="mt-10">
            <MapaClientes />
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-bg p-7">
            <h3 className="tagline text-fg-subtle">Los doce países</h3>
            <ul className="mt-5 flex flex-wrap gap-2">
              {paises.map((pais) => (
                <li
                  key={pais}
                  className="rounded-full bg-sky/15 px-3 py-1.5 text-sm font-medium text-navy dark:bg-sky/20 dark:text-sky"
                >
                  {pais}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Alianza académica */}
      <section className="py-14 lg:py-20">
        <Container>
          <EncabezadoSeccion
            antetitulo="Alianza académica"
            titulo="Formación con respaldo universitario"
            entrada="El programa de la escuela se imparte con una institución europea y con semanas presenciales en Miami."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <article className="flex flex-col rounded-3xl border border-border bg-bg p-8">
              <p className="tagline text-cyan dark:text-sky">Euncet Business School · UPC</p>
              <h3 className="mt-3 font-display text-xl font-bold text-fg">
                Doble titulación europea
              </h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-fg-muted">
                El Máster se imparte con Euncet Business School, adscrita a la Universitat
                Politècnica de Catalunya. Doble titulación y semanas presenciales en
                Terrassa, Barcelona.
              </p>
              <Link
                href="/master"
                className="mt-6 inline-flex items-center gap-2 font-display text-sm font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
              >
                Ver el Máster
                <IconoFlecha className="h-4 w-4" />
              </Link>
            </article>

            <article className="flex flex-col rounded-3xl border border-border bg-bg p-8">
              <p className="tagline text-cyan dark:text-sky">University of Miami</p>
              <h3 className="mt-3 font-display text-xl font-bold text-fg">
                Semanas académicas en Miami
              </h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-fg-muted">
                Los participantes cursan una semana presencial en la University of Miami
                Herbert Business School, con visitas a empresas y networking internacional
                junto a dueños de otros países.
              </p>
              <Link
                href="/master"
                className="mt-6 inline-flex items-center gap-2 font-display text-sm font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
              >
                Ver el Máster
                <IconoFlecha className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </Container>
      </section>

      {/* Voces */}
      <section className="border-y border-border bg-navy py-14 text-white lg:py-20">
        <Container>
          <EncabezadoSeccion
            claro
            antetitulo="Voces"
            titulo="Resultados con nombre y apellido"
            entrada="Lo que reportan las empresas que hemos acompañado, con su cargo y su empresa."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {casos.map((caso) => (
              <figure
                key={caso.empresa}
                className="flex flex-col rounded-3xl border border-white/15 bg-white/5 p-7"
              >
                <blockquote className="flex-1 font-display text-lg font-semibold leading-snug text-white">
                  &ldquo;{sinNota(caso.resultado)}&rdquo;
                </blockquote>
                <figcaption className="mt-6 border-t border-white/15 pt-5 text-sm">
                  <span className="block font-semibold text-white">{caso.persona}</span>
                  <span className="mt-1 block text-white/70">
                    {caso.cargo} · {caso.empresa}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          <p className="mt-8 max-w-[70ch] text-sm leading-relaxed text-white/60">
            Declaraciones de CEDEM y de las empresas citadas. Los casos completos, con el
            problema y la solución de cada uno, están en la{" "}
            <Link href="/" className="font-semibold text-sky hover:text-white">
              página de inicio
            </Link>
            .
          </p>
        </Container>
      </section>

      {/* Cierre */}
      <section className="py-14 lg:py-20">
        <Container>
          <div className="rounded-[28px] border border-border bg-bg-soft p-8 lg:p-12">
            <h2 className="max-w-[38rem] text-h2 text-fg">
              Cuatro décadas acompañando al que decide
            </h2>
            <p className="mt-4 max-w-[52ch] text-lead text-fg-muted">
              Si diriges una empresa y nadie te cuestiona, este es el lugar. Empieza por tu
              Camino del Dueño o habla directamente con un socio de la firma.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <BotonEnlace href="/unete" tamano="lg">
                Unirme a CEDEM 2.0
                <IconoFlecha className="h-4 w-4" />
              </BotonEnlace>
              <BotonEnlace href="/contacto" variante="secundario" tamano="lg">
                Hablar con un socio
              </BotonEnlace>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
