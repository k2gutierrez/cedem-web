import type { Metadata } from "next";
import { PaginaServicio } from "@/components/marketing/PaginaServicio";
import { serviciosDetalle } from "@/content/servicios";

const servicio = serviciosDetalle.pce;

export const metadata: Metadata = {
  title: "PCE · Concentración Estratégica",
  description:
    "Consultoría de nivel intermedio para empresas por debajo de 5 millones de dólares: un Consultor Senior dirige la aplicación de la Concentración Estratégica en tu negocio.",
};

export default function PaginaPce() {
  return <PaginaServicio servicio={servicio} />;
}
