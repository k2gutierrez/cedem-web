import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export const metadata: Metadata = {
  title: "Diagnósticos del Camino",
  robots: { index: false, follow: false },
};

const ETIQUETA_TEMPERATURA: Record<string, { texto: string; clase: string }> = {
  frio: { texto: "Frío", clase: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300" },
  tibio: { texto: "Tibio", clase: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" },
  caliente: {
    texto: "Caliente",
    clase: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  urgente: {
    texto: "Urgente",
    clase: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  },
};

const ETIQUETA_NIVEL: Record<string, string> = {
  consulting: "Consulting",
  pce: "PCE",
  master: "Máster",
  por_definir: "Por definir",
};

type FilaDiagnostico = {
  id: string;
  completed_at: string | null;
  duration_seconds: number | null;
  profile_label: string | null;
  score_total: number | null;
  engine_version: string | null;
  segment_scores: Record<string, unknown> | null;
  profiles: {
    full_name: string | null;
    display_name: string | null;
    email: string | null;
    company_name: string | null;
  } | null;
};

export default async function PaginaDiagnosticos() {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/app");

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("journey_sessions")
    .select(
      "id, completed_at, duration_seconds, profile_label, score_total, engine_version, segment_scores, profiles!journey_sessions_user_id_fkey(full_name, display_name, email, company_name)",
    )
    .order("completed_at", { ascending: false })
    .limit(50);

  const filas = (data ?? []) as unknown as FilaDiagnostico[];

  const cuenta = {
    total: filas.length,
    urgentes: filas.filter(
      (f) => (f.segment_scores?.temperatura_etiqueta as string) === "urgente",
    ).length,
    calientes: filas.filter(
      (f) => (f.segment_scores?.temperatura_etiqueta as string) === "caliente",
    ).length,
  };

  return (
    <Container>
      <p className="tagline text-cyan dark:text-sky">Administración</p>
      <h1 className="mt-3 text-h1 text-fg">Diagnósticos del Camino</h1>
      <p className="mt-4 max-w-[58ch] text-lead text-fg-muted">
        Quién hizo el recorrido, qué le salió y con quién conviene hablar primero. La
        temperatura mide apertura, no valor de la cuenta.
      </p>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
        {[
          { etiqueta: "Diagnósticos", valor: cuenta.total },
          { etiqueta: "Calientes", valor: cuenta.calientes },
          { etiqueta: "Urgentes", valor: cuenta.urgentes },
        ].map((dato) => (
          <div key={dato.etiqueta} className="bg-bg p-5">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
              {dato.etiqueta}
            </dt>
            <dd className="mt-1.5 font-display text-2xl font-bold text-fg">{dato.valor}</dd>
          </div>
        ))}
      </dl>

      {filas.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-bg p-10 text-center">
          <p className="font-display text-lg font-bold text-fg">
            Todavía no hay diagnósticos
          </p>
          <p className="mx-auto mt-3 max-w-[48ch] text-sm leading-relaxed text-fg-muted">
            Cuando un dueño complete el Camino del Dueño aparecerá aquí, con su lectura
            completa y su forma de contacto.{" "}
            <Link href="/camino" className="underline underline-offset-4">
              Probar el recorrido
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-bg">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-bg-soft">
              <tr className="text-[11px] uppercase tracking-wider text-fg-subtle">
                <th className="px-5 py-3 font-semibold">Dueño</th>
                <th className="px-4 py-3 font-semibold">Lectura</th>
                <th className="px-4 py-3 font-semibold">Temperatura</th>
                <th className="px-4 py-3 font-semibold">Nivel sugerido</th>
                <th className="px-5 py-3 font-semibold">Cuándo</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => {
                const s = (fila.segment_scores ?? {}) as Record<string, any>;
                const temperatura = (s.temperatura_etiqueta as string) ?? "frio";
                const etiqueta = ETIQUETA_TEMPERATURA[temperatura] ?? ETIQUETA_TEMPERATURA.frio;
                const contacto =
                  s.whatsapp && !fila.profiles?.email ? `WhatsApp ${s.whatsapp}` : fila.profiles?.email;

                return (
                  <tr key={fila.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-5 py-4">
                      <span className="block font-medium text-fg">
                        {fila.profiles?.display_name ||
                          fila.profiles?.full_name ||
                          (s.nombre_declarado as string) ||
                          "Sin nombre"}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] text-fg-subtle">
                        {fila.profiles?.company_name || contacto || "sin contacto"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="block capitalize text-fg">
                        {fila.profile_label?.replace(/_/g, " ") ?? "—"}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] text-fg-subtle">
                        verbo débil: {String(s.verbo_critico ?? "—")}
                        {s.dispersante ? ` · ${String(s.dispersante)}` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${etiqueta.clase}`}
                      >
                        {etiqueta.texto}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-fg-muted">
                      {ETIQUETA_NIVEL[String(s.nivel_sugerido ?? "")] ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-[12.5px] text-fg-subtle">
                      {fila.completed_at
                        ? new Date(fila.completed_at).toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                      {fila.duration_seconds
                        ? ` · ${Math.round(fila.duration_seconds / 60)} min`
                        : ""}
                      {fila.engine_version ? (
                        <span className="block">{fila.engine_version}</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-[12.5px] leading-relaxed text-fg-subtle">
        El comentario libre que deja el dueño y sus respuestas completas se guardan con cada
        diagnóstico: se consultan en la base y sirven para preparar la primera conversación.
      </p>
    </Container>
  );
}
