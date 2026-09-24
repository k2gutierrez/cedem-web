-- Migración 19 — El formato del cuerpo también es parte de la ficha
--
-- POR QUÉ EXISTE ESTA MIGRACIÓN
--
-- `content_bodies.body_format` distingue 'markdown' de 'html', y el renderizador
-- necesita saber cuál es para no romper el HTML. Hasta ahora la vista no lo
-- exponía, así que la página tenía que adivinar.
--
-- Adivinar salía caro: los 186 artículos migrados de WordPress traen **HTML**
-- (`<p>`, `<h4>`, `<em>`, `<a>`), pero el importador los dejó marcados como
-- 'markdown' y el renderizador los envolvía en un `<p>` propio. El resultado era
--
--     <p><p>…texto…</p></p>
--
-- que es HTML inválido: el navegador lo repara moviendo nodos mientras React
-- hidrata, y la consola escupe `Minified React error #418` en cada artículo. La
-- página se veía, pero la hidratación estaba rota y cualquier componente
-- interactivo dentro del cuerpo habría fallado.
--
-- El arreglo tiene tres partes:
--   1. Esta migración: la vista expone `body_format`.
--   2. Los datos: los artículos migrados pasan a 'html' (ver el `update` al
--      final del archivo, que es de datos y por eso va comentado con su motivo).
--   3. El renderizador: `CuerpoContenido` decide según el formato en vez de
--      envolver todo en párrafos.

create or replace view public.v_contents_for_viewer
with (security_invoker = false, security_barrier = true)
as
select
  c.id,
  c.content_type,
  c.slug,
  c.title,
  c.subtitle,
  c.summary,
  -- Extracto: lo escrito por el admin o, si no hay, el primer párrafo del cuerpo.
  coalesce(nullif(btrim(c.excerpt), ''), public.first_paragraph(b.body_md)) as excerpt,
  -- Cuerpo: completo o cortado al primer párrafo. El corte ocurre AQUÍ, en la base.
  case
    when public.can_read_body(c.id) then b.body_md
    else public.first_paragraph(b.body_md)
  end as body_md,
  not public.can_read_body(c.id) as is_body_truncated,
  c.cover_path, c.cover_alt, c.visibility, c.status,
  c.published_at, c.scheduled_for, c.is_featured, c.view_count, c.reading_minutes,
  c.locale, c.translation_of, c.seo_title, c.seo_description, c.og_image_path,
  c.created_at, c.updated_at,
  -- autoría
  a.consultant_id, k.slug as consultant_slug, k.full_name as consultant_name,
  k.photo_path as consultant_photo, a.authored_by_cedem,
  coalesce(k.full_name, case when a.authored_by_cedem then 'CEDEM' end) as author_label,
  -- evento
  e.starts_at, e.ends_at, e.timezone, e.modality, e.venue_name, e.city, e.country_code,
  e.capacity, e.registration_opens_at, e.registration_closes_at, e.is_registration_open,
  e.price_cents, e.currency,
  -- podcast
  p.episode_number, p.season, p.duration_seconds as podcast_duration_seconds,
  p.guest_name, p.guest_role, p.guest_company, p.audio_url is not null as has_external_audio,
  -- video
  v.provider as video_provider, v.external_id as video_external_id,
  v.embed_url as video_embed_url, v.duration_seconds as video_duration_seconds,
  -- documento (la ruta del archivo NO se expone: se descarga por RPC con URL firmada)
  d.file_mime, d.pages as document_pages, d.is_downloadable, d.rights_notice,
  -- etiquetas
  (select coalesce(jsonb_agg(jsonb_build_object('slug', t.slug, 'label', t.label)
                             order by t.sort_order, t.label), '[]'::jsonb)
     from public.content_tags ct
     join public.tags t on t.id = ct.tag_id
    where ct.content_id = c.id and t.is_active) as tags,
  -- Con qué está escrito ese cuerpo: 'markdown' o 'html'. Sin este dato, el
  -- renderizador no puede saber si debe interpretar etiquetas o escaparlas.
  --
  -- Va al FINAL a propósito: `create or replace view` no admite insertar una
  -- columna en medio —renombraría por posición todas las siguientes y falla con
  -- «cannot change name of view column»—. Al final se añade sin tocar las
  -- anteriores y sin perder los GRANT que la migración 14 dio a la vista.
  b.body_format
from public.contents c
join public.content_bodies b on b.content_id = c.id
left join public.articles    a on a.content_id = c.id and c.content_type = 'articulo'
left join public.consultants k on k.id = a.consultant_id
left join public.events      e on e.content_id = c.id and c.content_type = 'evento'
left join public.podcasts    p on p.content_id = c.id and c.content_type = 'podcast'
left join public.videos      v on v.content_id = c.id and c.content_type = 'video'
left join public.documents   d on d.content_id = c.id and c.content_type = 'documento';

-- ---------------------------------------------------------------------------
-- Los cuerpos migrados de WordPress son HTML, no markdown.
--
-- El importador no declaró el formato y quedaron con el valor por omisión. Este
-- `update` dice la verdad del dato. Es idempotente y no depende del idioma del
-- contenido: un artículo importado tiene `imported_at`, y lo que se importó se
-- importó de WordPress, que devuelve HTML.
--
-- Se puede comprobar antes de aplicarlo:
--   select content_type, body_format, count(*)
--     from public.contents c join public.content_bodies b on b.content_id = c.id
--    where c.imported_at is not null group by 1, 2;
-- ---------------------------------------------------------------------------
update public.content_bodies b
   set body_format = 'html'
  from public.contents c
 where c.id = b.content_id
   and c.imported_at is not null
   and b.body_format <> 'html';

-- Comprobación posterior (como consulta, no como bloque: una consulta dentro de
-- la migración ve la tabla transitoria del CLI y aborta la aplicación).
--
--   select body_format, count(*) from public.content_bodies group by 1;
--     -- html: 186 artículos migrados + 0 documentos · markdown: los 12 documentos
