import type { Metadata } from "next";
import { PaginaServicio } from "@/components/marketing/PaginaServicio";
import { serviciosDetalle } from "@/content/servicios";

const servicio = serviciosDetalle.master;

export const metadata: Metadata = {
  title: "Máster en Innovación y Emprendimiento en la Empresa Familiar",
  description:
    "Máster de 12 meses y 60 ECTS con Euncet Business School (UPC): doble titulación europea, semanas académicas en Miami y Barcelona, dirigido a sucesores y a la siguiente generación.",
};

export default function PaginaMaster() {
  return <PaginaServicio servicio={servicio} />;
}
