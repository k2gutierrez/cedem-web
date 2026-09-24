import type { ReactNode } from "react";

/** Encabezado estándar de sección: antetítulo, título y entradilla. */
export function EncabezadoSeccion({
  antetitulo,
  titulo,
  entrada,
  centrado = false,
  claro = false,
}: {
  antetitulo?: string;
  titulo: ReactNode;
  entrada?: ReactNode;
  centrado?: boolean;
  claro?: boolean;
}) {
  return (
    <div className={centrado ? "mx-auto max-w-[46rem] text-center" : "max-w-[46rem]"}>
      {antetitulo ? (
        <p
          className={`tagline ${claro ? "text-sky" : "text-cyan dark:text-sky"}`}
        >
          {antetitulo}
        </p>
      ) : null}
      <h2
        className={`mt-3 text-h2 ${claro ? "text-white" : "text-fg"}`}
      >
        {titulo}
      </h2>
      {entrada ? (
        <p
          className={`mt-4 text-lead ${claro ? "text-[#c7d2e8]" : "text-fg-muted"}`}
        >
          {entrada}
        </p>
      ) : null}
    </div>
  );
}
