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
| `DEEPSEEK_API_KEY` | IA del Camino del Dueño (Fase 4) |

## Estructura

```
src/
├── app/
│   ├── (public)/          Sitio público: home, servicios, recursos, equipo
│   ├── (auth)/            Acceso y registro        (Fase 3)
│   ├── (app)/app/         Plataforma CEDEM 2.0     (Fase 3-4)
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
| `pnpm importar:wordpress` | Descarga el archivo editorial a `supabase/datos/` |
| `node scripts/revisar-sistema.mjs` | Revisión integral antes de publicar (28 comprobaciones) |
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

## Decisiones técnicas que conviene recordar

- **Los colores se declaran una sola vez** en `src/app/globals.css`. Cambiar la marca es cambiar
  ese archivo, no 200 clases.
- **Tipografía:** Montserrat + Source Sans 3 como sustituto libre de Proxima Nova, que es
  comercial. Si CEDEM licencia Proxima Nova, se cambia en `layout.tsx`.
- **Las imágenes no se reprocesan para el duotono:** el tratamiento de marca se aplica por CSS
  (`.duotono-marco`), así se puede cambiar sin volver a exportar archivos.
- **`devIndicators: false`** en `next.config.ts`: el indicador flotante de desarrollo se
  superponía al contenido en las capturas de verificación en móvil.
