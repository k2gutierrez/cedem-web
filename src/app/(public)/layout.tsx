import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { contacto, redes, sedes } from "@/content/site";

/** Datos estructurados de la organización, para buscadores. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CEDEM · Centro de Dueñez Empresaria",
  url: "https://www.cedem.com.mx",
  logo: "https://www.cedem.com.mx/brand/cedem-logo-navy.png",
  foundingDate: "1985",
  description:
    "Escuela de formación de dueños y firma de consultoría en gestión de valor. Metodología de Dueñez Empresaria.",
  telephone: contacto.telefono,
  address: sedes.map((sede) => ({
    "@type": "PostalAddress",
    streetAddress: sede.direccion,
  })),
  sameAs: redes.map((red) => red.href),
};

export default function LayoutPublico({ children }: LayoutProps<"/">) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
