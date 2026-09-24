"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Convierte los avisos que viajan en la URL (`?hecho=…`, `?aviso=…`) en avisos
 * de sonner.
 *
 * POR QUÉ ASÍ
 *
 * Las acciones del panel terminan con `redirect()` porque redirect es lo único
 * que garantiza que la página se vuelva a leer con los datos ya cambiados. El
 * mensaje viaja entonces en la dirección, y hasta ahora se pintaba como un
 * párrafo verde o ámbar dentro de la página.
 *
 * El párrafo funciona, pero se pierde de vista: si la fila que cambiaste está
 * abajo, el aviso queda arriba fuera de pantalla. El aviso flotante resuelve eso
 * sin renunciar al redirect.
 *
 * Dos detalles que importan:
 *  · El parámetro se borra de la URL en cuanto se muestra, para que al recargar
 *    o al compartir el enlace no vuelva a aparecer un aviso viejo.
 *  · Se quita con `replace` y no con `push`, para no llenar el historial.
 */
export function AvisoDeUrl() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const mostrado = useRef<string | null>(null);

  const hecho = params.get("hecho");
  const aviso = params.get("aviso");

  useEffect(() => {
    const clave = `${hecho ?? ""}|${aviso ?? ""}`;
    if ((!hecho && !aviso) || mostrado.current === clave) return;
    mostrado.current = clave;

    if (hecho) toast.success(hecho);
    // Los errores se quedan un poco más: hay que leerlos y decidir qué hacer.
    if (aviso) toast.error(aviso, { duration: 9000 });

    const limpios = new URLSearchParams(params.toString());
    limpios.delete("hecho");
    limpios.delete("aviso");
    const query = limpios.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [hecho, aviso, params, pathname, router]);

  return null;
}
