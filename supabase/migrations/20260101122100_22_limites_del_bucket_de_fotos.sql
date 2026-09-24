-- Migración 22 — Límites del bucket de fotos
--
-- POR QUÉ EXISTE
--
-- El bucket `avatars` se creó **sin límite de tamaño y sin tipos permitidos**:
--
--     avatars | public=True | file_size_limit=NULL | allowed_mime_types=NULL
--
-- La validación de 5 MB y de JPG/PNG/WebP/AVIF vivía **solo en el código** de la
-- aplicación, en `src/lib/fotos.ts`. Eso sirve para el camino normal —el formulario
-- de la plataforma— pero no protege la puerta: el bucket tiene políticas que
-- permiten a cualquier persona con sesión subir a su propia carpeta, así que con su
-- token podría subir un archivo de 300 MB, o un `.exe`, sin pasar por nuestro
-- formulario.
--
-- En un bucket **público** eso no es solo un problema de coste de almacenamiento:
-- el archivo queda servido por URL directa desde el dominio de CEDEM. Que la
-- validación viva en la infraestructura, y no en el formulario, es la diferencia
-- entre una regla y una sugerencia.
--
-- Los valores son los mismos que valida el código, para que las dos capas digan lo
-- mismo: si algún día se cambian, hay que cambiarlos en los dos sitios.

update storage.buckets
   set file_size_limit = 5 * 1024 * 1024,          -- 5 MB
       allowed_mime_types = array[
         'image/jpeg', 'image/png', 'image/webp', 'image/avif'
       ]
 where id = 'avatars';

-- Los mismos límites para los logos de clientes y las portadas, que estaban
-- declarados en la migración 15 y siguen igual: se repiten aquí solo para dejar
-- constancia de que se revisaron al añadir las fotos de personas.
-- (client-logos: 2 MB · covers: 8 MB · site-assets: 8 MB)

-- Comprobación posterior (como consulta, no como bloque ejecutable):
--
--   select id, public, file_size_limit, allowed_mime_types
--     from storage.buckets where id = 'avatars';
--     -- público · 5242880 · {image/jpeg,image/png,image/webp,image/avif}
