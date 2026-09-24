import type { Metadata } from "next";
import Link from "next/link";
import { PaginaLegal } from "@/components/marketing/PaginaLegal";

export const metadata: Metadata = {
  title: "Términos y condiciones · Documento en revisión legal",
  description:
    "Qué regulará el documento de términos y condiciones de CEDEM —el uso del sitio y de la plataforma CEDEM 2.0, la cuenta, el contenido y el tratamiento de tus datos— y su estado actual: en revisión por el área legal.",
};

const secciones = [
  {
    titulo: "Qué regulará este documento",
    parrafos: [
      "El uso de este sitio y de la plataforma CEDEM 2.0: la cuenta, el diagnóstico, la biblioteca de artículos, webinars y documentos, y los formularios de contacto.",
      "Las condiciones de la membresía, el contenido de CEDEM y la responsabilidad de cada parte. Nada de eso está definido todavía en un texto legal vigente.",
    ],
  },
  {
    titulo: "Qué datos pasan por aquí",
    parrafos: [
      "Cuando escribes en un formulario o haces tu diagnóstico nos das tu nombre, tu correo, tu empresa, tu teléfono y tus respuestas.",
      <>
        El detalle de cómo se tratan esos datos está en el{" "}
        <Link
          href="/aviso-de-privacidad"
          className="font-semibold text-navy hover:text-cyan dark:text-sky dark:hover:text-white"
        >
          aviso de privacidad
        </Link>
        , que también está en revisión.
      </>,
    ],
  },
  {
    titulo: "Qué puedes saber hoy con certeza",
    parrafos: [
      "Que los artículos abiertos, los webinars y los documentos los publica CEDEM y son suyos. Cómo se pueden reproducir o citar se definirá en el texto definitivo.",
      "Que «Dueñez®» es una marca registrada por Carlos A. Dumois Núñez.",
      "Que el precio y las condiciones de la membresía de CEDEM 2.0 se publicarán cuando queden definidos: hoy no hay precio publicado.",
    ],
  },
  {
    titulo: "Qué falta en este documento",
    parrafos: [
      "Los términos y condiciones definitivos están en revisión por el área legal de CEDEM. Cuando se publiquen deberán cubrir, cuando menos: el uso aceptable del sitio y de la plataforma, las condiciones de la membresía, la propiedad intelectual, la limitación de responsabilidad, la legislación aplicable y la forma de resolver controversias.",
      "Hasta entonces, este texto se publica solo para explicar en lenguaje llano qué regula el documento y qué está pendiente. No es un contrato ni sustituye al texto validado.",
    ],
  },
];

export default function PaginaTerminos() {
  return (
    <PaginaLegal
      titulo="Términos y condiciones"
      entrada="Qué regirá el uso de este sitio y de la plataforma, y qué parte del documento sigue pendiente de validación legal."
      secciones={secciones}
    />
  );
}
