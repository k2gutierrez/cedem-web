import type { Metadata } from "next";
import Link from "next/link";
import { MarcoFoto } from "@/components/marketing/MarcoFoto";
import { BotonEnlace } from "@/components/ui/Boton";
import { Container } from "@/components/ui/Container";
import { EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { IconoFlecha } from "@/components/ui/Iconos";
import { contacto } from "@/content/site";
import { hayArchivo } from "@/lib/fotos-locales";

export const metadata: Metadata = {
  title: "Únete a CEDEM 2.0",
  description:
    "La plataforma de CEDEM: el Camino del Dueño, la biblioteca completa de artículos, webinars y documentos metodológicos, y el perfil de cada consultor. Por suscripción o por invitación si ya eres cliente.",
};

const beneficios = [
  {
    titulo: "El Camino del Dueño",
    texto:
      "Cinco minutos para ver dónde se te está quedando el valor: generar, multiplicar o capturar. Sales con una observación escrita y tus primeros pasos.",
  },
  {
    titulo: "La biblioteca completa",
    texto:
      "Todo el archivo de CEDEM sin límite: los artículos, los webinars y los once documentos del método, listos para descargar.",
  },
  {
    titulo: "Seguimiento con IA",
    texto:
      "Un agente entrenado con el método de CEDEM te cuestiona y te propone ejercicios a partir de lo que tú mismo escribiste.",
  },
];

const pasos = [
  {
    titulo: "Creas tu cuenta",
    texto: "Con tu correo y una contraseña. Sin costo y sin compromiso.",
  },
  {
    titulo: "Haces tu Camino del Dueño",
    texto:
      "Cinco minutos. Al terminar recibes tu diagnóstico y tus primeras recomendaciones.",
  },
  {
    titulo: "Decides si sigues",
    texto:
      "Si quieres la biblioteca completa y el seguimiento, activas tu membresía. Si ya eres cliente de CEDEM, entras por invitación.",
  },
];

const preguntas = [
  {
    pregunta: "¿Necesito pagar para empezar?",
    respuesta:
      "No. Tu cuenta y el Camino del Dueño son gratis. La membresía se activa solo si quieres la biblioteca completa y el seguimiento.",
  },
  {
    pregunta: "¿Qué pasa con mis respuestas y mis datos?",
    respuesta:
      "Quedan en tu perfil para darte seguimiento y solo el equipo de CEDEM los consulta. No se comparten con terceros ni se usan para publicidad.",
  },
  {
    pregunta: "¿Se puede hacer desde el celular?",
    respuesta:
      "Sí. Todo el recorrido está pensado para hacerse desde el teléfono, en un solo trayecto y sin escribir mucho.",
  },
];

export default function PaginaUnete() {
  /* La foto de la comunidad se mira al compilar: hoy `membresia-comunidad.jpg`
     todavía no está en `public/fotos/`, así que la sección se ve como siempre y
     el día que se deje el archivo aparece sola, sin tocar código. */
  const fotoComunidad = hayArchivo("membresia-comunidad.jpg");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-bg">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/3 h-[420px] w-[420px] rounded-full bg-sky/15 blur-3xl dark:bg-cyan/10"
        />
        <Container className="relative py-14 lg:py-20">
          <p className="tagline text-cyan dark:text-sky">CEDEM 2.0</p>
          <h1 className="mt-4 max-w-[44rem] text-h1 text-fg">
            La plataforma para ejercer la Dueñez con método
          </h1>
          <p className="mt-5 max-w-[56ch] text-lead text-fg-muted">
            Todo lo que CEDEM sabe del rol del dueño, en un solo lugar. Empieza gratis
            con el diagnóstico; sigue cuando compruebes que te sirve.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <BotonEnlace href="/registro" tamano="lg">
              Crear mi cuenta gratis
              <IconoFlecha className="h-4 w-4" />
            </BotonEnlace>
            <BotonEnlace href="/contacto" variante="secundario" tamano="lg">
              Pedir una invitación
            </BotonEnlace>
          </div>
        </Container>
      </section>

      {/* Beneficios */}
      <section className="py-14 lg:py-20">
        <Container>
          <EncabezadoSeccion
            antetitulo="Qué incluye"
            titulo="Lo que encuentras al entrar"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {beneficios.map((beneficio) => (
              <article
                key={beneficio.titulo}
                className="rounded-2xl border border-border bg-bg p-7"
              >
                <h3 className="font-display text-lg font-bold text-fg">
                  {beneficio.titulo}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  {beneficio.texto}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Cómo funciona */}
      <section className="border-y border-border bg-bg-soft py-14 lg:py-20">
        <Container>
          <EncabezadoSeccion
            antetitulo="Cómo funciona"
            titulo="Tres pasos, cinco minutos"
          />
          <ol className="mt-12 grid gap-6 lg:grid-cols-3">
            {pasos.map((paso, i) => (
              <li
                key={paso.titulo}
                className="rounded-2xl border border-border bg-bg p-7"
              >
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 place-items-center rounded-full bg-navy font-display text-sm font-bold text-white dark:bg-cyan dark:text-[#04102e]"
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-fg">
                  {paso.titulo}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                  {paso.texto}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Dos formas de entrar */}
      <section className="py-14 lg:py-20">
        <Container>
          <EncabezadoSeccion
            antetitulo="Dos formas de entrar"
            titulo="Por suscripción o por invitación"
            entrada="Los clientes actuales de la firma entran por invitación, sin costo. Quien llega por primera vez puede suscribirse a la plataforma."
          />
          <div
            className={`mt-12 grid gap-6 ${
              fotoComunidad ? "lg:grid-cols-3" : "lg:grid-cols-2"
            }`}
          >
            {/* La foto va pegada a la tarjeta de Suscripción, que es lo que
                ilustra: otros dueños con los que hablar. Se centra en vertical
                porque la tarjeta es más alta que la imagen. */}
            {fotoComunidad ? (
              <MarcoFoto
                archivo="membresia-comunidad.jpg"
                alt="Grupo de dueños y dueñas de empresa conversando de pie con un café después de un taller"
                proporcion="aspect-[3/2]"
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="lg:self-center"
              />
            ) : null}
            <article className="flex flex-col rounded-3xl border border-border bg-bg p-8">
              <p className="tagline text-cyan dark:text-sky">Suscripción</p>
              <h3 className="mt-3 font-display text-2xl font-bold text-fg">
                Membresía CEDEM 2.0
              </h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-fg-muted">
                Acceso completo a la biblioteca, al Camino del Dueño con seguimiento y a
                los eventos. Las condiciones y el precio se publican al abrir el registro.
              </p>
              <BotonEnlace href="/contacto" className="mt-7">
                Quiero que me avisen
              </BotonEnlace>
            </article>

            <article className="flex flex-col rounded-3xl bg-navy p-8 text-white">
              <p className="tagline text-sky">Invitación</p>
              <h3 className="mt-3 font-display text-2xl font-bold text-white">
                Ya soy cliente de CEDEM
              </h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-[#c7d2e8]">
                Si trabajas con la firma, tu consultor puede emitirte una invitación con
                acceso completo. Escríbenos y te la enviamos.
              </p>
              <BotonEnlace
                href={contacto.whatsapp}
                externo
                variante="claro"
                className="mt-7 self-start"
              >
                Solicitar mi invitación
              </BotonEnlace>
            </article>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-fg-subtle">
            El precio de la membresía se publicará aquí cuando quede definido. Mientras
            tanto, cualquier persona puede usar el Camino del Dueño sin costo.
          </p>
        </Container>
      </section>

      {/* Preguntas frecuentes */}
      <section className="border-t border-border bg-bg-soft py-14 lg:py-20">
        <Container size="estrecho">
          <EncabezadoSeccion antetitulo="Dudas" titulo="Preguntas frecuentes" />
          <dl className="mt-10 space-y-4">
            {preguntas.map((item) => (
              <div
                key={item.pregunta}
                className="rounded-2xl border border-border bg-bg p-6"
              >
                <dt className="font-display text-base font-bold text-fg">
                  {item.pregunta}
                </dt>
                <dd className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                  {item.respuesta}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 text-sm text-fg-muted">
            ¿Otra duda?{" "}
            <Link
              href="/contacto"
              className="font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
            >
              Escríbenos
            </Link>{" "}
            o llámanos al {contacto.telefono}.
          </p>
        </Container>
      </section>
    </>
  );
}
