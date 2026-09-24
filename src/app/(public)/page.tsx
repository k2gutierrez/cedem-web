import { Casos } from "@/components/marketing/Casos";
import { CtaFinal } from "@/components/marketing/CtaFinal";
import { Hero } from "@/components/marketing/Hero";
import { Metodo } from "@/components/marketing/Metodo";
import { Puertas } from "@/components/marketing/Puertas";
import { Recursos } from "@/components/marketing/Recursos";
import { ViajeDelDueno } from "@/components/marketing/ViajeDelDueno";

export default function Home() {
  return (
    <>
      <Hero />
      <ViajeDelDueno />
      <Puertas />
      <Metodo />
      <Casos />
      <Recursos />
      <CtaFinal />
    </>
  );
}
