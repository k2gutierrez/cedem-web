# CEDEM · Aplicación web

Sitio público y plataforma **CEDEM 2.0**. La documentación del proyecto (plan, arquitectura,
modelo de datos, identidad de marca) vive **fuera** de esta carpeta, en `../docs/`.

## Requisitos

- Node.js 22+
- pnpm 10+

## Puesta en marcha

```bash
pnpm install
cp .env.local.example .env.local   # y rellena las llaves (ver más abajo)
pnpm dev                            # http://localhost:3000
```

## Variables de entorno

Todas viven en `.env.local`, que **está ignorado por git**. La plantilla comentada está en
`.env.local.example` y el procedimiento paso a paso, en `../docs/10-supabase-puesta-en-marcha.md`.

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave pública (puede llegar al navegador) |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave maestra — **solo servidor** |
| `DATABASE_URL` | Conexión directa a Postgres, para aplicar migraciones |
| `DEEPSEEK_API_KEY` | IA del Camino del Dueño |
| `STRIPE_SECRET_KEY` | Cobro de la membresía con tarjeta (opcional) |
| `STRIPE_WEBHOOK_SECRET` | Verificación de la firma de Stripe (opcional) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe (opcional) |

## Estructura

```
src/
├── app/
│   ├── (public)/          Sitio público: home, servicios, recursos, equipo
│   ├── (auth)/            Acceso y registro        (Fase 3)
│   ├── (app)/app/         Plataforma CEDEM 2.0     (panel, biblioteca, Mi Camino, admin)
│   ├── api/               Rutas de servidor: IA, webhooks (Fase 3-4)
│   ├── layout.tsx         Layout raíz: fuentes, tema, metadatos
│   └── globals.css        Sistema de diseño: tokens de marca
├── components/
│   ├── brand/             Logotipo y elementos de marca
│   ├── layout/            Navbar, Footer, selector de tema
│   ├── marketing/         Secciones del sitio público
│   └── ui/                Primitivas: botón, contenedor, iconos
├── content/site.ts        Contenido semilla (pasará a Supabase en la Fase 2)
└── types/                 Tipos de dominio y de la base de datos
```

## Estado

- ✅ **Fase 0 · Fundación** — Next.js 16 + TypeScript + Tailwind 4, sistema de diseño con la
  paleta del Brand Book, modo claro/oscuro, navbar y footer responsivos, home completa.
- ✅ **Fase 1 · Sitio público** — las tres puertas de servicio, recursos, equipo, nosotros (con
  el mapa de presencia), contacto, únete, acceso y las páginas legales.
- ✅ **Camino del Dueño (adelanto de la Fase 4)** — recorrido completo de 22 pantallas con motor
  de puntuación determinista verificado por pruebas automáticas.
- ✅ **Fase 2 · Administración** — autenticación real con Supabase, panel del miembro y panel de
  administración de contenido con publicación, visibilidad y destacados.
- ✅ **Biblioteca de miembros** — los 12 documentos del método publicados con texto completo en
  pantalla, agrupados por eje, y descarga en PDF con URL firmada de cinco minutos. La ruta del
  archivo no es pública (migración 18) y cada descarga queda en el registro de accesos.
- ✅ **Mi Camino (seguimiento)** — `/app/camino` es el historial del miembro: cada diagnóstico con
  su verbo crítico, sus puntajes, las fuerzas que lo frenan, la lectura completa y las
  recomendaciones. El perfil se recalcula con el motor actual desde las respuestas guardadas y
  avisa si la versión del motor cambió. El panel resume el último.
- ⏳ **Fase 3** — membresías y pagos: espera las decisiones comerciales (pasarela y precio).
- ⏳ **Fase 4** — conectar el Camino del Dueño a la base y a la IA de DeepSeek.

## Comandos

| Comando | Para qué |
|---|---|
| `pnpm dev` | Servidor de desarrollo en http://localhost:3000 |
| `pnpm build` | Build de producción (incluye verificación de tipos) |
| `pnpm probar:motor` | Pruebas del motor de puntuación del Camino del Dueño |
| `pnpm probar:base` | Pruebas de la lectura base del Camino (la que se muestra si la IA no responde) |
| `pnpm fotos` | Lista las imágenes que el sitio ya pide y todavía no existen en `public/` |
| `pnpm importar:wordpress` | Descarga el archivo editorial a `supabase/datos/` |
| `node scripts/revisar-sistema.mjs` | Revisión integral antes de publicar (30 comprobaciones) |
| `pnpm importar:articulos` | Carga el archivo editorial a la base |
| `pnpm revisar:html` | Informa qué cuerpos tienen HTML mal formado (`--escribir` para corregirlos) |
| `pnpm probar:sanear` | Pruebas del saneador de HTML (9 casos) |
| `pnpm importar:documentos` | Publica los PDF del método en la biblioteca (`--revisar`, `--rehacer`) |
| `pnpm revisar` | Igual que `node scripts/revisar-sistema.mjs` |
| `node scripts/generar-redirecciones.mjs` | Regenera el mapa de redirecciones del sitio anterior |
| `node scripts/extraer-migraciones.mjs` | Regenera `supabase/migrations/` desde el documento de diseño |

En la carpeta del proyecto (un nivel arriba):

| Comando | Para qué |
|---|---|
| `python3 scripts/base-datos.py verificar` | Estado de la base: tablas, reglas y contenido |
| `python3 scripts/base-datos.py sembrar` | Aplica la semilla |
| `python3 scripts/probar-muro-pago.py` | Comprueba que el contenido premium no se filtre |
| `python3 scripts/probar-documentos.py` | Comprueba el muro de los 12 documentos del método |
| `python3 scripts/descargar-documentos.py` | Baja los PDF originales a `assets/documentos-metodo/` |
| `python3 scripts/promover-admin.py correo@dominio` | Convierte una cuenta en administradora |

## Publicar el sitio (despliegue)

El proyecto se despliega desde GitHub. El camino elegido es **AWS Amplify
Hosting**; Vercel queda como alternativa al final de esta sección.

### AWS Amplify Hosting

Ya está configurado en el repositorio: **`amplify.yml`** en la raíz instala pnpm
(la imagen de Amplify no lo trae y el build moría con `pnpm: command not found`),
vuelca las variables de entorno a `.env.production` y compila. Amplify usa ese
archivo en lugar de la configuración del panel, así que no hay que pegar nada en
la consola.

Lo único que hay que hacer a mano:

1. **Variables de entorno** en *Hosting → Environment variables* (las cinco
   primeras son obligatorias; sin `SUPABASE_SERVICE_ROLE_KEY` el build falla a
   propósito, con un mensaje claro, en vez de publicar un sitio que no deja
   entrar). Se copian de `.env.local`, que no se sube al repositorio.
2. **`NEXT_PUBLIC_SITE_URL`** apunta a la URL de Amplify mientras no esté el
   dominio (`https://main.<id-de-la-app>.amplifyapp.com`). Como las
   `NEXT_PUBLIC_*` se incrustan al compilar, cambiarla obliga a **volver a
   desplegar**.
3. **Dominio** en *Hosting → Custom domains*, y los registros DNS en GoDaddy.

El paso a paso completo, con la tabla de variables y la lista de comprobaciones,
está en [`../docs/20-despliegue-en-amplify.md`](../docs/20-despliegue-en-amplify.md).

### 1 · Subir el repositorio

```bash
git remote add origin git@github.com:<organización>/<repositorio>.git
git push -u origin main
```

El repositorio debe ser **privado**: lleva la lógica del negocio. Las llaves no
están ni han estado en el historial (viven en `.env.local`, que está ignorado);
para comprobarlo:

```bash
git log --all -p | grep -iE "service_role|sk-[a-zA-Z0-9]{20}|eyJhbGciOi"
```

### 2 · Conectar en Vercel (alternativa)

1. **Add New → Project**, elegir el repositorio de GitHub.
2. Vercel detecta Next.js solo: no hay que tocar la configuración de compilación.
3. En **Settings → Environment Variables**, cargar las cinco variables de la tabla
   de arriba (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `DEEPSEEK_API_KEY`, `NEXT_PUBLIC_SITE_URL`).
   `NEXT_PUBLIC_SITE_URL` apunta al dominio definitivo.
4. **Deploy**. Cada push a `main` publica; cada propuesta de cambio genera una URL
   de vista previa para revisarla antes.

### 3 · Conectar el dominio

En **Settings → Domains** se añade `cedem.com.mx` y `www.cedem.com.mx`, y Vercel
indica los registros DNS que hay que crear. El día del corte, las 186 direcciones
del WordPress actual redirigen solas a su artículo nuevo (`src/lib/redirecciones.json`),
así que el posicionamiento no se pierde.

### Cobro con tarjeta (Stripe)

La integración está construida y **se enciende sola** cuando las tres variables de
Stripe están cargadas: sin ellas, la página de membresía sigue ofreciendo la
transferencia con confirmación manual, que es como opera hoy.

1. **Llaves.** En el panel de Stripe → *Developers → API keys*, copiar la llave
   publicable y la secreta (empezando por las de **prueba**, `pk_test_` y `sk_test_`).
2. **Webhook.** En *Developers → Webhooks → Add endpoint*, con la URL
   `https://TU-DOMINIO/api/webhooks/stripe` y los eventos
   `checkout.session.completed` y `charge.refunded`. El *signing secret* que genera
   va en `STRIPE_WEBHOOK_SECRET`.
3. **Precio en Stripe.** No hace falta crear el producto a mano: el precio se toma
   de la base (`plan_prices`) y se manda a Stripe al abrir el pago.

Para probar sin cobrar de verdad:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe   # reenvía los eventos
stripe trigger checkout.session.completed                        # simula un pago
node scripts/probar-firma-stripe.mjs                             # firma correcta y falsa
```

> **La membresía se activa por webhook, no por la vuelta del navegador.** Si se
> activara al volver, cerrar el navegador después de pagar dejaría al dueño sin
> acceso, y escribir la dirección a mano lo dejaría entrar sin pagar. El webhook
> llega firmado por Stripe y es la única fuente de verdad.

### Lo que corre solo en cada push

`.github/workflows/verificar.yml` ejecuta los tipos, el linter, las pruebas del
motor del Camino, las del saneador de HTML y la compilación. Son las redes que ya
han atrapado errores reales en este proyecto. Lo que necesita llaves —el muro de
pago, los documentos, el flujo de invitación— se corre a mano:

```bash
python3 scripts/probar-documentos.py
python3 scripts/probar-muro-pago.py
node scripts/revisar-sistema.mjs      # 30 comprobaciones sobre el sitio levantado
```

## Decisiones técnicas que conviene recordar

- **Los colores se declaran una sola vez** en `src/app/globals.css`. Cambiar la marca es cambiar
  ese archivo, no 200 clases.
- **Tipografía:** Montserrat + Source Sans 3 como sustituto libre de Proxima Nova, que es
  comercial. Si CEDEM licencia Proxima Nova, se cambia en `layout.tsx`.
- **Las imágenes no se reprocesan para el duotono:** el tratamiento de marca se aplica por CSS
  (`.duotono-marco`), así se puede cambiar sin volver a exportar archivos.
- **Las fotos se agregan sin tocar código:** se dejan en `public/fotos/` (logos en
  `public/logos/`, gráficos en `public/graficos/`, imagen social en `public/og/`) y
  `scripts/generar-manifiesto-fotos.mjs` —que corre solo en `pnpm dev` y `pnpm build`— decide si
  el componente muestra la foto o el hueco de marca. La lista se calcula al compilar porque en
  Amplify el servidor puede correr sin la carpeta `public/`. Los prompts para generarlas están en
  `../docs/21-prompts-de-imagenes.md`.
- **La escala tipográfica se cambia en un solo sitio:** `--text-*` en `src/app/globals.css`. Está
  subida respecto a la de Tailwind (`text-sm` = 16 px, `text-base` = 17 px y nada por debajo de
  14 px) porque el público de CEDEM tiene 40 años o más. Por eso en el código no se usan tamaños
  fijos en píxeles.
- **El PDF del Camino se genera en el navegador** (`src/lib/pdf/observacion.ts`, con `pdf-lib`).
  Así la observación de cada dueño no viaja a ningún servidor ni se guarda en disco, y el
  documento sale idéntico siempre, sin depender de los márgenes del navegador de quien imprime.
- **`devIndicators: false`** en `next.config.ts`: el indicador flotante de desarrollo se
  superponía al contenido en las capturas de verificación en móvil.
