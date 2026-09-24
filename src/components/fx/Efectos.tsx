"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";

/**
 * Los efectos del sitio, en un solo archivo.
 *
 * CRITERIO COMÚN A TODOS
 *
 * · Son decorativos. Si se apagan, la página se entiende igual: no hay contenido
 *   que dependa de una animación para aparecer.
 * · Respetan `prefers-reduced-motion` (además del `MotionConfig` global).
 * · El HTML se renderiza en el servidor; esto solo añade el movimiento encima, así
 *   que el posicionamiento en Google y la primera pintura no dependen del JS.
 * · Nada de animaciones infinitas caras: el halo es un solo elemento con muelle, y
 *   la rejilla y la marquesina son CSS puro.
 */

/** Aparece al entrar en pantalla, una sola vez. */
export function Revelar({
  children,
  retraso = 0,
  desplazamiento = 26,
  className = "",
}: {
  children: ReactNode;
  /** Retraso en segundos, para escalonar elementos hermanos. */
  retraso?: number;
  desplazamiento?: number;
  className?: string;
}) {
  const reducido = useReducedMotion();

  if (reducido) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: desplazamiento }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: retraso, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** El halo que sigue al cursor. Solo aparece con ratón; en táctil no existe. */
export function HaloCursor() {
  const reducido = useReducedMotion();
  const x = useMotionValue(-300);
  const y = useMotionValue(-300);
  const blando = { stiffness: 140, damping: 26, mass: 0.6 };
  const sx = useSpring(x, blando);
  const sy = useSpring(y, blando);
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    if (reducido) return;

    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setActivo(true);
    };
    const salir = () => setActivo(false);

    window.addEventListener("pointermove", mover, { passive: true });
    window.addEventListener("pointerleave", salir);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerleave", salir);
    };
  }, [reducido, x, y]);

  if (reducido) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="halo-cursor pointer-events-none fixed z-0 hidden lg:block"
      style={{ left: sx, top: sy, translateX: "-50%", translateY: "-50%" }}
      animate={{ opacity: activo ? 1 : 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(0,161,224,0.16),transparent_66%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(108,197,233,0.14),transparent_66%)]" />
    </motion.div>
  );
}

/** Un número que cuenta hasta su valor cuando entra en pantalla. */
export function ContadorAnimado({
  valor,
  sufijo = "",
  duracion = 1.4,
  className = "",
}: {
  valor: number;
  sufijo?: string;
  duracion?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, margin: "-40px" });
  const reducido = useReducedMotion();
  const [contado, setContado] = useState(0);

  // Si el sistema pide menos movimiento, el número se muestra entero y nunca se
  // anima. Se resuelve en el render y no con un `setState` dentro del efecto, que
  // provocaría un render en cascada.
  const mostrado = reducido ? valor : contado;

  useEffect(() => {
    if (!visible || reducido) return;

    let frame = 0;
    const inicio = performance.now();
    const paso = (ahora: number) => {
      const avance = Math.min(1, (ahora - inicio) / (duracion * 1000));
      // Suavizado de salida: arranca rápido y frena, como un contador de verdad.
      const suave = 1 - Math.pow(1 - avance, 3);
      setContado(Math.round(valor * suave));
      if (avance < 1) frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [visible, valor, duracion, reducido]);

  return (
    <span ref={ref} className={className}>
      {mostrado}
      {sufijo}
    </span>
  );
}

/** Tarjeta que se inclina siguiendo el cursor. */
export function TarjetaInclinada({
  children,
  className = "",
  intensidad = 7,
}: {
  children: ReactNode;
  className?: string;
  /** Grados máximos de inclinación. Bajo a propósito: no es un juguete. */
  intensidad?: number;
}) {
  const reducido = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const muelle = { stiffness: 220, damping: 24 };
  const sx = useSpring(rx, muelle);
  const sy = useSpring(ry, muelle);

  return (
    <motion.div
      className={className}
      style={reducido ? undefined : { rotateX: sx, rotateY: sy, transformPerspective: 1100 }}
      onPointerMove={(e) => {
        if (reducido || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        rx.set((-(e.clientY - r.top - r.height / 2) / r.height) * intensidad * 2);
        ry.set(((e.clientX - r.left - r.width / 2) / r.width) * intensidad * 2);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Entrada de la página: el contenido sube y aparece al cargar. */
export function LlegadaPagina({ children }: { children: ReactNode }) {
  const reducido = useReducedMotion();

  if (reducido) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0.4, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Una palabra que rota dentro de una frase, con el degradado de marca. */
export function PalabraRotativa({ palabras, intervalo = 3.2 }: { palabras: string[]; intervalo?: number }) {
  const reducido = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reducido || palabras.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % palabras.length), intervalo * 1000);
    return () => clearInterval(t);
  }, [reducido, palabras.length, intervalo]);

  if (reducido) {
    return <span className="texto-degradado">{palabras[0]}</span>;
  }

  return (
    // `inline-block` con ancho mínimo evita que la línea dé saltos al cambiar.
    <span className="relative inline-block align-baseline">
      <motion.span
        key={palabras[i]}
        className="texto-degradado inline-block"
        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {palabras[i]}
      </motion.span>
    </span>
  );
}

/** Barra de progreso de lectura, arriba y fija. */
export function ProgresoLectura() {
  const reducido = useReducedMotion();
  const progreso = useMotionValue(0);
  const suave = useSpring(progreso, { stiffness: 120, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    if (reducido) return;
    const alScroll = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      progreso.set(alto > 0 ? window.scrollY / alto : 0);
    };
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, [reducido, progreso]);

  if (reducido) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 top-0 z-[60] h-[2px] w-full origin-left bg-gradient-to-r from-cyan via-blue to-sky"
      style={{ scaleX: suave }}
    />
  );
}
