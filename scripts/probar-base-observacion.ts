/**
 * Comprobación de la lectura base del Camino del Dueño.
 *
 * La lectura base es la red de seguridad: se muestra cuando la IA tarda, falla o
 * responde algo inválido, y es la que sostiene el producto. Tiene que leerse como
 * una observación de consultor —sin etiquetas, sin puntajes— porque es la que más
 * gente va a ver.
 *
 * Uso:  pnpm probar:base
 */
import { calcularPerfil, type Respuestas } from "../src/lib/camino/puntuar";
import { lecturaBase, normalizarLectura } from "../src/lib/ia/lectura";

let fallos = 0;
function comprobar(nombre: string, condicion: boolean) {
  console.log(`  ${condicion ? "✓" : "✗"} ${nombre}`);
  if (!condicion) fallos++;
}

const RESPUESTAS: Respuestas = {
  Q1: "3",
  Q2: "2",
  Q3: "1",
  Q4: "2",
  Q5: "1",
  Q6: "0",
  Q7: "0",
  Q8: "1",
  Q9: "1",
  Q10: "2",
  Q11: "1",
  Q13: "0",
  Q14: "Delegar la operación.",
  Q15: "Me cuesta soltar el día a día.",
};

const perfil = calcularPerfil(RESPUESTAS);
const lectura = lecturaBase(perfil);

console.log("\nLectura base generada:\n");
console.log(`  Titular: ${lectura.titular}`);
for (const p of lectura.observacion) console.log(`  · ${p}`);
console.log(`  Ejercicios: ${lectura.ejercicios.length}\n`);

const texto = [lectura.titular, ...lectura.observacion].join(" ").toLowerCase();

comprobar("trae entre 2 y 3 párrafos", lectura.observacion.length >= 2 && lectura.observacion.length <= 3);
comprobar("trae 3 ejercicios", lectura.ejercicios.length === 3);
comprobar("no habla de arquetipo ni de verbo atorado", !/arquetipo|verbo atorado|se te atora/.test(texto));
comprobar(
  "nombra los componentes flojos detectados",
  perfil.focos.every((f) => texto.includes(f.componente.toLowerCase())),
);
comprobar("no usa la raya larga (no está en WinAnsi de las fuentes del PDF)", !texto.includes("—"));

/* La forma anterior se sigue leyendo: una sesión guardada antes del cambio no se
   puede romper. */
const vieja = {
  subtitulo: "Titular viejo",
  verbo: "Párrafo viejo del verbo.",
  freno: "Párrafo viejo del freno.",
  ejercicios: lectura.ejercicios,
};
const normalizada = normalizarLectura(vieja, perfil);
comprobar("la forma anterior se convierte en observación", normalizada.observacion.length === 2 && normalizada.titular === "Titular viejo");

console.log(`\n${fallos === 0 ? "✅ Todo correcto" : `❌ ${fallos} fallo(s)`}\n`);
process.exit(fallos === 0 ? 0 : 1);
