import Link from "next/link";
import { obtenerSesion } from "@/lib/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { supabaseConfigurado } from "@/lib/supabase/configurado";

/**
 * Aviso de diagnósticos que piden atención.
 *
 * Vive en el panel porque es donde el equipo entra todos los días: un correo se
 * pierde entre cien, esto no. Aparece solo cuando hay algo que atender, y
 * desaparece cuando se atiende.
 *
 * TODO (Fase 5): avisar también por correo al equipo comercial. Falta definir el
 * proveedor de envío (Resend o el de Supabase) y el destinatario.
 */

export async function AvisoDiagnosticos() {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin || !supabaseConfigurado()) return null;

  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("journey_sessions")
    .select("id, segment_scores, completed_at")
    .eq("status", "completada")
    .order("completed_at", { ascending: false })
    .limit(50);

  const hace30 = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const pendientes = (data ?? []).filter((s) => {
    const p = (s.segment_scores ?? {}) as Record<string, unknown>;
    const temperatura = String(p.temperatura_etiqueta ?? "frio");
    const reciente = s.completed_at ? new Date(s.completed_at).getTime() > hace30 : false;
    return reciente && (temperatura === "urgente" || temperatura === "caliente");
  });

  if (pendientes.length === 0) return null;

  const urgentes = pendientes.filter(
    (s) => String((s.segment_scores as Record<string, unknown>)?.temperatura_etiqueta) === "urgente",
  ).length;

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-500/40 dark:bg-amber-500/10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-fg">
            {pendientes.length === 1
              ? "Hay un dueño esperando respuesta"
              : `Hay ${pendientes.length} dueños esperando respuesta`}
          </h2>
          <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-amber-900 dark:text-amber-100">
            {urgentes > 0
              ? `${urgentes === 1 ? "Uno de ellos pidió" : `${urgentes} de ellos pidieron`} hablar con un socio desde el Camino del Dueño en los últimos 30 días.`
              : "Completaron el Camino del Dueño en los últimos 30 días y su lectura pide una conversación."}
          </p>
        </div>
        <Link
          href="/app/admin/camino"
          className="shrink-0 rounded-full bg-navy px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-[#0b1856] dark:bg-cyan dark:text-[#04102e]"
        >
          Ver los diagnósticos
        </Link>
      </div>
    </div>
  );
}
