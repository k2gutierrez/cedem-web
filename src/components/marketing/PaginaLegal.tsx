import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { contacto, sedes } from "@/content/site";

const sedeZapopan = sedes.find((sede) => sede.nombre === "CEDEM, México");

const enlace = "font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white";

/**
 * Estructura común de las páginas legales.
 *
 * Aquí NO se redactan cláusulas: el texto definitivo lo valida el área legal de
 * CEDEM. Lo que se publica es lo que hoy se puede afirmar con certeza —qué datos
 * se recaban y para qué— más el aviso visible de que el documento está en
 * revisión, para que nadie lo tome por un aviso vigente.
 */
export function PaginaLegal({
  titulo,
  entrada,
  secciones,
}: {
  titulo: string;
  entrada: string;
  secciones: readonly { titulo: string; parrafos: readonly ReactNode[] }[];
}) {
  return (
    <>
      <section className="border-b border-border bg-bg">
        <Container size="estrecho" className="py-14 lg:py-20">
          <p className="tagline text-cyan dark:text-sky">Legal</p>
          <h1 className="mt-4 text-h1 text-fg">{titulo}</h1>
          <p className="mt-5 text-lead text-fg-muted">{entrada}</p>
          <p className="mt-7 inline-flex rounded-full border border-border bg-bg-soft px-4 py-2 text-sm font-medium text-fg-muted">
            Última actualización: Pendiente de revisión legal
          </p>
        </Container>
      </section>

      <section className="py-12 lg:py-16">
        <Container size="estrecho">
          <div className="rounded-2xl border border-border-strong border-l-4 border-l-cyan bg-bg-soft p-6">
            <p className="font-display text-sm font-bold leading-relaxed text-fg">
              ⚠️ Documento en revisión. El texto definitivo debe ser validado por el área
              legal antes de publicar.
            </p>
          </div>

          <div className="mt-10 space-y-9">
            {secciones.map((seccion) => (
              <div key={seccion.titulo}>
                <h2 className="font-display text-h3 text-fg">{seccion.titulo}</h2>
                <div className="mt-3 space-y-3">
                  {seccion.parrafos.map((parrafo, i) => (
                    <p key={i} className="text-sm leading-relaxed text-fg-muted">
                      {parrafo}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contacto: los mismos datos que el pie del sitio */}
          <div className="mt-12 rounded-2xl border border-border bg-bg-soft p-6">
            <h2 className="font-display text-base font-bold text-fg">
              Datos de contacto de CEDEM
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-fg-muted">
              <li>
                Teléfono:{" "}
                <a href={contacto.telefonoHref} className={enlace}>
                  {contacto.telefono}
                </a>
              </li>
              <li>
                WhatsApp:{" "}
                <a
                  href={contacto.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={enlace}
                >
                  Escríbenos por WhatsApp
                </a>
              </li>
              {sedeZapopan ? (
                <li>
                  Domicilio: {sedeZapopan.nombre} · {sedeZapopan.direccion}{" "}
                  <a
                    href={sedeZapopan.mapa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={enlace}
                  >
                    Ver en el mapa
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <p className="mt-8 text-sm leading-relaxed text-fg-subtle">
            Este texto se publica solo para explicar, en lenguaje llano, cómo se tratan
            hoy los datos en el sitio. No sustituye al documento que CEDEM publique una
            vez validado por su área legal.
          </p>
        </Container>
      </section>
    </>
  );
}
