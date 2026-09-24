import type { Metadata } from "next";
import { PaginaServicio } from "@/components/marketing/PaginaServicio";
import { serviciosDetalle } from "@/content/servicios";

const servicio = serviciosDetalle.consulting;

export const metadata: Metadata = {
  title: "Consulting · Asesoría directa con los socios",
  description:
    "Acompañamiento de largo plazo para empresas desde 5 millones de dólares: pre-diagnóstico de 6 a 8 semanas, proyecto de 4 a 24 meses y un Consultor Líder como consejero del dueño.",
};

export default function PaginaConsulting() {
  return <PaginaServicio servicio={servicio} />;
}
