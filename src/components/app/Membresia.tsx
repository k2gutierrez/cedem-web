"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { iniciarPago } from "@/app/acciones/pagos";
import { Boton } from "@/components/ui/Boton";
import { IconoFlecha } from "@/components/ui/Iconos";
import {
  guardarPrecio,
  solicitarMembresia,
  type EstadoMembresia,
} from "@/app/acciones/membresia";

const campo =
  "w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-cyan dark:focus:border-sky";
const etiqueta = "mb-1.5 block text-sm font-medium text-fg-muted";
const avisoError =
  "rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200";
const avisoOk =
  "rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200";

function Enviar({ texto, cargando }: { texto: string; cargando: string }) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending}>
      {pending ? cargando : texto}
    </Boton>
  );
}

/* -------------------------------------------------------------------------- */
/* El miembro solicita su membresía                                           */
/* -------------------------------------------------------------------------- */

export function FormularioSolicitud({
  precios,
}: {
  precios: { id: string; etiqueta: string; nota: string }[];
}) {
  const [estado, accion] = useActionState(solicitarMembresia, {} as EstadoMembresia);

  if (estado.referencia) {
    return (
      <div className="rounded-2xl border border-cyan/40 bg-sky/10 p-6 dark:border-sky/40">
        <p className="font-display text-lg font-bold text-fg">Solicitud registrada</p>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          Transfiere el importe y usa esta referencia para que podamos identificarlo:
        </p>
        <p className="mt-3 font-mono text-lg font-bold tracking-wider text-fg">
          {estado.referencia}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-fg-subtle">
          En cuanto el equipo confirme el ingreso, tu acceso completo queda activo y te
          avisamos. Si prefieres otro medio de pago, escríbenos por WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-5">
      <fieldset className="space-y-3">
        <legend className={etiqueta}>Elige tu membresía</legend>
        {precios.map((precio, i) => (
          <label
            key={precio.id}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-5 transition-colors hover:border-cyan/60 dark:hover:border-sky/60"
          >
            <input
              type="radio"
              name="precio"
              value={precio.id}
              defaultChecked={i === 0}
              className="mt-1 h-4 w-4 accent-[#00a1e0]"
            />
            <span>
              <span className="block font-display text-base font-bold text-fg">
                {precio.etiqueta}
              </span>
              <span className="mt-1 block text-sm text-fg-muted">{precio.nota}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {estado.error ? <p role="alert" className={avisoError}>{estado.error}</p> : null}

      <Enviar texto="Solicitar mi membresía" cargando="Registrando…" />
    </form>
  );

  /* Cuando la pasarela está conectada, el mismo formulario ofrece las dos vías:
     pagar con tarjeta aquí mismo, o pedir la referencia para transferir. Se
     mantienen las dos a propósito: hay dueños que prefieren transferencia, y
     mientras el cobro con tarjeta se prueba conviene no cerrar la otra puerta. */
}

/** Botón de pago con tarjeta. Solo se muestra si Stripe está configurado. */
export function PagoConTarjeta({ precios }: { precios: { id: string; etiqueta: string }[] }) {
  const [precio, setPrecio] = useState(precios[0]?.id ?? "");

  return (
    <form action={iniciarPago} className="space-y-4">
      <div>
        <label htmlFor="precio-tarjeta" className={etiqueta}>
          Pagar con tarjeta
        </label>
        <select
          id="precio-tarjeta"
          name="precio"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className={campo}
        >
          {precios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <Boton type="submit" tamano="lg" className="barrido w-full">
        Pagar ahora
        <IconoFlecha className="h-4 w-4" />
      </Boton>

      <p className="text-xs leading-relaxed text-fg-subtle">
        El cobro lo procesa Stripe. Tus datos de tarjeta no pasan por CEDEM en ningún
        momento, y el acceso se activa en cuanto el pago se confirma.
      </p>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* El equipo define el precio                                                 */
/* -------------------------------------------------------------------------- */

export function FormularioPrecio({
  planes,
  precio,
}: {
  planes: { id: string; name: string }[];
  precio?: {
    id: string;
    plan_id: string;
    amount_cents: number;
    currency: string;
    billing_interval: string;
  };
}) {
  const [estado, accion] = useActionState(guardarPrecio, {} as EstadoMembresia);

  return (
    <form action={accion} className="space-y-4">
      {precio ? <input type="hidden" name="id" value={precio.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`plan-${precio?.id ?? "nuevo"}`} className={etiqueta}>
            Plan
          </label>
          <select
            id={`plan-${precio?.id ?? "nuevo"}`}
            name="plan"
            className={campo}
            defaultValue={precio?.plan_id ?? planes[0]?.id}
          >
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`moneda-${precio?.id ?? "nuevo"}`} className={etiqueta}>
            Moneda
          </label>
          <select
            id={`moneda-${precio?.id ?? "nuevo"}`}
            name="moneda"
            className={campo}
            defaultValue={precio?.currency ?? "MXN"}
          >
            <option value="MXN">Pesos mexicanos (MXN)</option>
            <option value="USD">Dólares (USD)</option>
            <option value="EUR">Euros (EUR)</option>
          </select>
        </div>
        <div>
          <label htmlFor={`importe-${precio?.id ?? "nuevo"}`} className={etiqueta}>
            Importe
          </label>
          <input
            id={`importe-${precio?.id ?? "nuevo"}`}
            name="importe"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={precio ? precio.amount_cents / 100 : ""}
            className={campo}
            placeholder="45000"
          />
          <p className="mt-1.5 text-xs text-fg-subtle">
            Sin centavos y sin símbolo: solo el número.
          </p>
        </div>
        <div>
          <label htmlFor={`intervalo-${precio?.id ?? "nuevo"}`} className={etiqueta}>
            Cada cuánto se paga
          </label>
          <select
            id={`intervalo-${precio?.id ?? "nuevo"}`}
            name="intervalo"
            className={campo}
            defaultValue={precio?.billing_interval ?? "anual"}
          >
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
            <option value="unico">Pago único</option>
          </select>
        </div>
      </div>

      {estado.error ? <p role="alert" className={avisoError}>{estado.error}</p> : null}
      {estado.ok ? <p role="status" className={avisoOk}>{estado.ok}</p> : null}

      <Enviar texto={precio ? "Guardar precio" : "Publicar precio"} cargando="Guardando…" />
    </form>
  );
}
