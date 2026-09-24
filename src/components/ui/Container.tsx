import type { ReactNode } from "react";

/** Ancho máximo y padding horizontal consistentes en todo el sitio. */
export function Container({
  children,
  className = "",
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "ancho" | "estrecho";
}) {
  const ancho =
    size === "ancho"
      ? "max-w-[1400px]"
      : size === "estrecho"
        ? "max-w-[820px]"
        : "max-w-[1200px]";

  return (
    <div className={`mx-auto w-full ${ancho} px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}
