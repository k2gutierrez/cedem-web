import { sanearHtml } from "../src/lib/contenido/sanear-html";

const casos: [string, string, string][] = [
  [
    "enlace sin cerrar dentro de un párrafo (el caso real)",
    `<p>correo<br><a href="http://x.mx">www.x.mx<br>Carlos es Presidente.<br><strong><em>«Dueñez®»</em></strong><em> es marca.</em></p>`,
    `<p>correo<br><a href="http://x.mx">www.x.mx<br>Carlos es Presidente.<br><strong><em>«Dueñez®»</em></strong><em> es marca.</em></a></p>`,
  ],
  ["html ya correcto no se toca", `<p>uno</p>\n\n<p>dos</p>`, `<p>uno</p>\n\n<p>dos</p>`],
  ["párrafo sin cerrar", `<p>uno<p>dos`, `<p>uno</p><p>dos</p>`],
  ["cierre huérfano", `<p>uno</p></div>`, `<p>uno</p>`],
  ["lista anidada se conserva", `<ul><li>a<ul><li>b</li></ul></li></ul>`, `<ul><li>a<ul><li>b</li></ul></li></ul>`],
  ["br e img no se cierran", `<p>a<br>b<img src="x.png"></p>`, `<p>a<br>b<img src="x.png"></p>`],
  ["strong abierto al final", `<p>a<strong>b</p>`, `<p>a<strong>b</strong></p>`],
  ["texto sin etiquetas", `solo texto`, `solo texto`],
];

let fallos = 0;
for (const [nombre, entrada, esperado] of casos) {
  const salida = sanearHtml(entrada);
  const ok = salida === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? "✅" : "❌"} ${nombre}`);
  if (!ok) {
    console.log(`     entrada:  ${entrada}`);
    console.log(`     salida:   ${salida}`);
    console.log(`     esperado: ${esperado}`);
  }
}

// Idempotencia: sanear dos veces debe dar lo mismo que sanear una.
const doble = sanearHtml(sanearHtml(casos[0][1]));
console.log(`${doble === sanearHtml(casos[0][1]) ? "✅" : "❌"} el saneado es idempotente`);

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : "\n✅ 9/9");
process.exit(fallos ? 1 : 0);
