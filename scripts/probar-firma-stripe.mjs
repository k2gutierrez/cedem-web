/**
 * Comprueba que el webhook acepta una firma BIEN HECHA y rechaza la falsa.
 *
 * La firma es la única defensa de una dirección pública: sin ella, mandar un JSON
 * diciendo «esta persona pagó» bastaría para regalar membresías.
 */
import { createHmac } from "node:crypto";

const SECRETO = "whsec_prueba_para_verificar_firma";
const URL = "http://localhost:3000/api/webhooks/stripe";

const cuerpo = JSON.stringify({
  id: "evt_prueba_firma",
  object: "event",
  type: "customer.created", // un tipo que el webhook ignora: contesta 200 y no toca la base
  data: { object: { id: "cus_prueba" } },
});

const t = Math.floor(Date.now() / 1000);
const firma = createHmac("sha256", SECRETO).update(`${t}.${cuerpo}`).digest("hex");

const r = await fetch(URL, {
  method: "POST",
  headers: { "content-type": "application/json", "stripe-signature": `t=${t},v1=${firma}` },
  body: cuerpo,
});
const texto = await r.text();
console.log(`firma correcta → HTTP ${r.status} · ${texto}`);

// Y la misma petición con un byte cambiado en el cuerpo: la firma deja de valer.
const r2 = await fetch(URL, {
  method: "POST",
  headers: { "content-type": "application/json", "stripe-signature": `t=${t},v1=${firma}` },
  body: cuerpo.replace("cus_prueba", "cus_tocado"),
});
console.log(`cuerpo alterado → HTTP ${r2.status} · ${await r2.text()}`);

// Un evento viejo (fuera de la tolerancia de 5 minutos) también se rechaza.
const viejo = t - 4000;
const firmaVieja = createHmac("sha256", SECRETO).update(`${viejo}.${cuerpo}`).digest("hex");
const r3 = await fetch(URL, {
  method: "POST",
  headers: { "content-type": "application/json", "stripe-signature": `t=${viejo},v1=${firmaVieja}` },
  body: cuerpo,
});
console.log(`evento viejo    → HTTP ${r3.status} · ${await r3.text()}`);

const ok = r.status === 200 && r2.status === 400 && r3.status === 400;
console.log(ok ? "\n✅ La firma protege el webhook" : "\n❌ La verificación de firma falla");
process.exit(ok ? 0 : 1);
