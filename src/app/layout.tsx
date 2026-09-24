import type { Metadata } from "next";
import { Montserrat, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { ProveedorMovimiento } from "@/components/fx/ProveedorMovimiento";
import { contacto, redes, sedes } from "@/content/site";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cedem.com.mx"),
  title: {
    default: "CEDEM · Centro de Dueñez Empresaria",
    template: "%s · CEDEM",
  },
  description:
    "Escuela de formación de dueños y firma de consultoría en gestión de valor. Desarrollamos y aplicamos la metodología de Dueñez Empresaria para generar, multiplicar y capturar valor.",
  keywords: [
    "Dueñez",
    "Dueñez Empresaria",
    "empresa familiar",
    "consultoría de empresa familiar",
    "gobierno corporativo",
    "sucesión",
    "dueño de empresa",
  ],
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "CEDEM",
    title: "CEDEM · El valor de ser dueño",
    description:
      "El rol del dueño no se delega: se ejerce. Metodología de Dueñez Empresaria desde 1985.",
  },
  robots: { index: true, follow: true },
};

/**
 * Aplica el tema antes del primer pintado para evitar el destello de tema
 * equivocado. La preferencia guardada manda; si no hay, se respeta el sistema.
 */
const themeScript = `
(function(){
  try {
    var guardado = localStorage.getItem('cedem-tema');
    var sistema = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
    var tema = guardado || sistema;
    if (tema === 'oscuro') document.documentElement.classList.add('dark');
    document.documentElement.dataset.tema = tema;
  } catch (e) {}
})();
`;

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


export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-MX"
      // Next 16 pide declarar el desplazamiento suave para gestionarlo durante
      // las transiciones de ruta (si no, avisa por consola).
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${montserrat.variable} ${sourceSans.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-bg text-fg antialiased">
        {/* El proveedor envuelve todo: configura el movimiento (respetando la
            preferencia del sistema) y monta una sola vez los avisos de sonner. */}
        <ProveedorMovimiento>{children}</ProveedorMovimiento>
      </body>
    </html>
  );
}
