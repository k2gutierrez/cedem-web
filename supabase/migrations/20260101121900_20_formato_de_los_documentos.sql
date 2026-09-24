-- Migración 20 — El formato de los documentos del método es markdown
--
-- POR QUÉ EXISTE ESTA MIGRACIÓN
--
-- La migración 19 corrigió el formato de los cuerpos importados de WordPress
-- (eran HTML, estaban marcados como markdown) con este criterio:
--
--     update public.content_bodies b set body_format = 'html'
--       from public.contents c
--      where c.id = b.content_id
--        and c.imported_at is not null      -- ← el criterio era demasiado ancho
--        and b.body_format <> 'html';
--
-- `imported_at` no distingue de dónde vino el contenido, solo que se importó. Los
-- doce documentos del método también lo tienen, porque se cargaron con
-- `scripts/importar-documentos.mjs`, y su cuerpo es **markdown** —lo extrae
-- `pdftotext` y lo compone ese script párrafo a párrafo—. Resultado: los doce
-- quedaron marcados como HTML.
--
-- No rompía nada visible, porque el renderizador todavía no leía el campo, pero
-- habría hecho exactamente lo contrario de lo que buscaba la migración 19: al
-- pasar los documentos por un renderizador de HTML, los párrafos en markdown se
-- habrían comido sus propios saltos de línea.
--
-- La migración 19 ya está aplicada y no se edita (regla del proyecto). Se
-- corrige aquí, con el criterio que faltaba: el tipo de contenido.
--
-- El criterio correcto, para futuras importaciones:
--   · artículo importado de WordPress  → HTML (lo devuelve la API de WordPress)
--   · documento construido por el script → markdown (lo compone el script)

update public.content_bodies b
   set body_format = 'markdown'
  from public.contents c
 where c.id = b.content_id
   and c.content_type = 'documento'
   and b.body_format <> 'markdown';

-- Los artículos importados de WordPress se quedan como están (html): eso lo hizo
-- bien la migración 19.

-- Comprobación posterior:
--
--   select c.content_type, b.body_format, count(*)
--     from public.contents c join public.content_bodies b on b.content_id = c.id
--    group by 1, 2 order by 3 desc;
--     -- articulo | html     | 186
--     -- documento| markdown |  12
