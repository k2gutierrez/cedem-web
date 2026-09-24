import Stripe from "stripe";

/**
 * La pasarela de pago.
 *
 * DECISIONES QUE CONVIENE ENTENDER
 *
 * 1 · **Sin llaves, el sitio no se rompe.** `stripeConfigurado()` devuelve falso y
 *    la plataforma sigue funcionando por transferencia con confirmación manual,
 *    que es como opera hoy. La integración se enciende sola el día que las llaves
 *    lleguen: no hay que tocar código.
 *
 * 2 · **La llave secreta nunca sale del servidor.** Este módulo no debe importarse
 *    desde un componente de navegador. El precio y la sesión de pago se crean aquí.
 *
 * 3 · **El pago se confirma por webhook, no por la vuelta del navegador.** Cuando
 *    alguien paga, Stripe avisa a nuestro servidor. Si esa confirmación dependiera
 *    de que la persona vuelva a la página, bastaría con cerrar el navegador —o con
 *    escribir la dirección a mano— para quedarse sin membresía habiendo pagado, o
 *    para conseguirla sin pagar.
 */

export function stripeConfigurado(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

let cliente: Stripe | null = null;

/** El cliente de Stripe, o null si no hay llaves configuradas. */
export function crearClienteStripe(): Stripe | null {
  const llave = process.env.STRIPE_SECRET_KEY?.trim();
  if (!llave) return null;

  if (!cliente) {
    cliente = new Stripe(llave, {
      // Se fija la versión de la API para que una actualización del paquete no
      // cambie el formato de los eventos sin que nos enteremos. El valor tiene
      // que ser el que trae esta versión del SDK (`stripe/esm/apiVersion.js`):
      // por eso se declara con el tipo del propio paquete y no como texto suelto.
      apiVersion: "2026-08-26.dahlia" as Stripe.LatestApiVersion,
      appInfo: { name: "CEDEM 2.0", url: "https://www.cedem.com.mx" },
    });
  }

  return cliente;
}

/** La llave publicable, para el navegador. Puede no haber. */
export function llavePublicable(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null;
}
