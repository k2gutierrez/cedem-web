import type { Metadata } from "next";
import { PaginaLegal } from "@/components/marketing/PaginaLegal";

export const metadata: Metadata = {
  title: "Aviso de privacidad · Documento en revisión legal",
  description:
    "Qué datos recaba CEDEM en este sitio —nombre, correo, empresa, teléfono y las respuestas del diagnóstico—, para qué los usa y el estado del aviso de privacidad definitivo, en revisión por su área legal.",
};

const secciones = [
  {
    titulo: "Qué datos recabamos",
    parrafos: [
      "Los del formulario de contacto: nombre, correo electrónico, empresa y teléfono.",
      "Los del registro a CEDEM 2.0: nombre y correo, más los datos de tu empresa que decidas completar.",
      "Las respuestas de tu diagnóstico —el Camino del Dueño—: lo que escribes sobre tu negocio y sobre tu rol como dueño.",
    ],
  },
  {
    titulo: "Para qué los usamos",
    parrafos: [
      "Para responderte, darte seguimiento a tu diagnóstico y enviarte lo que pides: artículos, webinars, documentos y avisos de eventos.",
      "Para que tu perfil guarde tu avance y puedas retomarlo donde lo dejaste.",
      "Solo el equipo de CEDEM consulta estos datos. No se comparten con terceros ni se usan para publicidad.",
    ],
  },
  {
    titulo: "Cómo puedes pedir que se corrijan o se borren",
    parrafos: [
      "Escríbenos por teléfono o WhatsApp a los datos de contacto que están al final de esta página y pide el acceso, la corrección o la eliminación de tus datos.",
      "El procedimiento formal —plazos, formato y responsable— quedará definido en el documento definitivo que valide el área legal.",
    ],
  },
  {
    titulo: "Qué falta en este documento",
    parrafos: [
      "El aviso de privacidad definitivo está en revisión por el área legal de CEDEM. Cuando se publique deberá incluir, cuando menos: el responsable del tratamiento, las finalidades primarias y secundarias, las transferencias a terceros, el medio para ejercer los derechos sobre tus datos y la forma de revocar el consentimiento.",
      "Publicamos esta versión porque el sitio ya recaba datos y preferimos decir con claridad qué pasa con ellos, aunque todavía falte el texto validado.",
    ],
  },
];

export default function PaginaAvisoDePrivacidad() {
  return (
    <PaginaLegal
      titulo="Aviso de privacidad"
      entrada="Qué datos tuyos pasan por este sitio, para qué los usamos y en qué estado está el documento legal."
      secciones={secciones}
    />
  );
}
