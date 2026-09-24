-- Migración 11 — Vistas
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101121100_11_vistas.sql
-- =============================================================================

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- v_contents_for_viewer: LA vista del contenido.
-- Devuelve la ficha de cada contenido visible para el solicitante y, en la
-- columna body_md, el cuerpo completo si tiene derecho o SOLO EL PRIMER PÁRRAFO
-- si no lo tiene, con la bandera is_body_truncated para que la interfaz sepa
-- que debe mostrar el muro.
-- ---------------------------------------------------------------------------
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
    where ct.content_id = c.id and t.is_active) as tags
from public.contents c
join public.content_bodies b on b.content_id = c.id
left join public.articles    a on a.content_id = c.id and c.content_type = 'articulo'
left join public.consultants k on k.id = a.consultant_id
left join public.events      e on e.content_id = c.id and c.content_type = 'evento'
left join public.podcasts    p on p.content_id = c.id and c.content_type = 'podcast'
left join public.videos      v on v.content_id = c.id and c.content_type = 'video'
left join public.documents   d on d.content_id = c.id and c.content_type = 'documento'
where public.can_view_content(c.id);

comment on view public.v_contents_for_viewer is
  'Contenido listo para pintar: ficha siempre, cuerpo completo solo si el solicitante tiene derecho; si no, primer párrafo.';

-- ---------------------------------------------------------------------------
-- v_content_cards: listados (home, /recursos, buscador). Ni siquiera selecciona
-- el cuerpo: lo que no se pide no se puede filtrar.
-- ---------------------------------------------------------------------------
create or replace view public.v_content_cards
with (security_invoker = false, security_barrier = true)
as
select
  id, content_type, slug, title, subtitle, summary, excerpt, cover_path, cover_alt,
  visibility, status, published_at, is_featured, view_count, reading_minutes,
  consultant_slug, consultant_name, consultant_photo, authored_by_cedem, author_label,
  starts_at, modality, city, country_code, price_cents, currency,
  podcast_duration_seconds, video_provider, video_external_id, video_duration_seconds,
  document_pages, tags, locale
from public.v_contents_for_viewer;

-- ---------------------------------------------------------------------------
-- v_public_team: lo que ve el visitante en /equipo. No expone `profiles`.
-- ---------------------------------------------------------------------------
create or replace view public.v_public_team
with (security_invoker = false, security_barrier = true)
as
select
  k.id, k.slug, k.full_name, k.headline, k.bio_md, k.location, k.photo_path,
  k.linkedin_url, k.x_url, k.website_url, k.email_public, k.specialties, k.languages,
  k.is_founder, k.started_year, k.sort_order, k.legacy_url,
  (select count(*)
     from public.articles a
     join public.contents c on c.id = a.content_id
    where a.consultant_id = k.id
      and c.status = 'publicado'
      and c.visibility = 'publico') as published_articles
from public.consultants k
where k.is_active;

-- ---------------------------------------------------------------------------
-- v_clients_public: el nombre y el logo SOLO salen si la marca está autorizada.
-- El país y el sector sí (son datos de presencia, no de marca) y son los que
-- alimentan el mapa a través de v_countries_map.
-- ---------------------------------------------------------------------------
create or replace view public.v_clients_public
with (security_invoker = false, security_barrier = true)
as
select
  cl.id, cl.slug, cl.country_code, cl.city, cl.sector, cl.website_url,
  cl.relationship_since, cl.sort_order,
  case when cl.brand_authorized then cl.name          end as name,
  case when cl.brand_authorized then cl.logo_path     end as logo_path,
  case when cl.brand_authorized then cl.logo_dark_path end as logo_dark_path,
  case when cl.brand_authorized then cl.metrics       else '[]'::jsonb end as metrics
from public.clients cl
where cl.is_active;

-- ---------------------------------------------------------------------------
-- v_countries_map: el mapa resalta los países que tienen clientes.
-- Quitar el HAVING devuelve el mapamundi completo con los países sin clientes
-- en clients_count = 0 (por si el diseño pide pintarlos en gris).
-- ---------------------------------------------------------------------------
create or replace view public.v_countries_map
with (security_invoker = false, security_barrier = true)
as
select
  co.code, co.iso3, co.name_es, co.name_en, co.region, co.sort_order,
  count(cl.id) as clients_count,
  count(cl.id) filter (where cl.brand_authorized) as clients_authorized_count
from public.countries co
left join public.clients cl
       on cl.country_code = co.code
      and cl.is_active
      and cl.show_on_map
where co.is_active
group by co.code, co.iso3, co.name_es, co.name_en, co.region, co.sort_order
having count(cl.id) > 0;

-- ---------------------------------------------------------------------------
-- v_public_testimonials
-- ---------------------------------------------------------------------------
create or replace view public.v_public_testimonials
with (security_invoker = false, security_barrier = true)
as
select
  t.id, t.person_name, t.person_role, t.person_company, t.quote, t.photo_path, t.sort_order,
  cl.slug as client_slug,
  case when cl.brand_authorized then cl.name      end as client_name,
  case when cl.brand_authorized then cl.logo_path end as client_logo_path
from public.testimonials t
left join public.clients cl on cl.id = t.client_id
where t.is_published
  and t.authorized;

-- ---------------------------------------------------------------------------
-- v_admin_members: panel /app/admin/miembros. security_invoker = TRUE para que
-- la RLS de profiles y subscriptions decida: solo un admin ve todas las filas.
-- ---------------------------------------------------------------------------
create or replace view public.v_admin_members
with (security_invoker = true)
as
select
  p.id, p.email, p.full_name, p.role, p.company_name, p.job_title, p.company_sector,
  p.employees_count, p.annual_revenue_usd, p.segment, p.company_country_code,
  p.theme, p.marketing_opt_in, p.privacy_accepted_at, p.is_blocked,
  p.created_at, p.last_seen_at,
  s.id as subscription_id, s.status as subscription_status, s.origin as subscription_origin,
  s.started_at, s.ends_at, s.auto_renew, s.currency, s.amount_cents,
  pl.code as plan_code, pl.name as plan_name
from public.profiles p
left join public.subscriptions s
       on s.user_id = p.id and s.status in ('activa', 'en_prueba')
left join public.plans pl on pl.id = s.plan_id;

comment on view public.v_admin_members is
  'Listado de miembros con su membresía vigente. security_invoker = true: la RLS decide quién ve qué.';

-- ---------------------------------------------------------------------------
-- v_journey_overview: seguimiento del Camino del Dueño por parte del staff.
-- Igual que la anterior: security_invoker = true, la RLS manda.
-- ---------------------------------------------------------------------------
create or replace view public.v_journey_overview
with (security_invoker = true)
as
select
  js.id, js.user_id, p.full_name, p.email, p.company_name, p.segment, p.job_title,
  js.status, js.started_at, js.completed_at, js.last_activity_at, js.duration_seconds,
  js.answered_count, js.total_questions, js.score_total, js.profile_label, js.engine_version,
  (select count(*) from public.ai_conversations c where c.session_id = js.id) as ai_turns,
  (select count(*) from public.journey_notes n
    where n.session_id = js.id and not n.is_private) as shared_notes,
  (select r.dimension from public.journey_results r
    where r.session_id = js.id and r.is_primary limit 1) as primary_dimension
from public.journey_sessions js
join public.profiles p on p.id = js.user_id;
