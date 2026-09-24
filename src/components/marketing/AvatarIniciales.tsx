/**
 * Avatar de iniciales sobre navy.
 *
 * Se usa mientras CEDEM no entregue las fotografías en resolución original:
 * un hueco con una foto borrosa se ve peor que un avatar limpio y consistente.
 * El nombre siempre va al lado, así que las iniciales son decorativas y no se
 * anuncian al lector de pantalla.
 */
export function AvatarIniciales({
  nombre,
  className = "",
}: {
  nombre: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-14 w-14 shrink-0 place-items-center rounded-full bg-navy font-display text-lg font-bold tracking-wide text-white ring-1 ring-sky/25 ${className}`}
    >
      {iniciales(nombre)}
    </span>
  );
}

/** Primera letra del nombre y del apellido; ignora iniciales sueltas como "A.". */
function iniciales(nombre: string): string {
  const palabras = nombre
    .split(/\s+/)
    .filter((palabra) => palabra.replace(/\./g, "").length > 1);

  const primera = palabras[0]?.charAt(0) ?? "";
  const ultima = palabras.length > 1 ? palabras[palabras.length - 1].charAt(0) : "";

  return `${primera}${ultima}`.toUpperCase();
}
