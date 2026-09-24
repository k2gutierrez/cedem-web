-- Migración 5 — Contenido
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101120500_05_contenido.sql
-- Tronco común de contenido + extensiones por tipo + cuerpo protegido.
-- =============================================================================

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- tags: etiquetas transversales a todos los tipos de contenido.
-- Alimentan los filtros del sitio público y la recuperación de artículos que
-- usa el motor de recomendación del Camino del Dueño (arquitectura §6).
-- ---------------------------------------------------------------------------
create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  label_en    text,
  kind        text not null default 'tema',
  description text,
  is_active   boolean not null default true,
  sort_order  integer not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint tags_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint tags_kind_valid  check (kind in ('tema', 'eje', 'formato', 'publico', 'otro')),
  constraint tags_label_len   check (char_length(label) between 2 and 60)
);

comment on table public.tags is
  'Etiquetas de contenido (vocabulario CEDEM: Dueñez, Sucesión, Querencia, Gobierno Corporativo...).';

-- ---------------------------------------------------------------------------
-- contents: el tronco. Todo lo que se lista, se busca, se etiqueta y se audita
-- pasa por aquí. NO contiene el cuerpo completo (ver content_bodies).
--
-- `search_vector` es columna generada: indexa título, subtítulo, resumen y
-- extracto, NUNCA el cuerpo. Es deliberado: buscar dentro del cuerpo revelaría
-- términos que solo existen en la parte premium.
-- Se usa la configuración 'spanish' también para las traducciones al inglés
-- (compromiso aceptable de la fase 1; ver §8).
-- ---------------------------------------------------------------------------
create table public.contents (
  id              uuid primary key default gen_random_uuid(),
  content_type    public.content_type not null,
  slug            text not null,
  title           text not null,
  subtitle        text,
  summary         text,
  excerpt         text,                                  -- primer párrafo visible siempre
  cover_path      text,                                  -- bucket `covers`
  cover_alt       text,
  visibility      public.content_visibility not null default 'publico',
  status          public.content_status not null default 'borrador',
  published_at    timestamptz,
  scheduled_for   timestamptz,
  archived_at     timestamptz,
  is_featured     boolean not null default false,
  view_count      integer not null default 0,
  reading_minutes smallint,
  locale          text not null default 'es-MX',
  translation_of  uuid references public.contents(id) on delete set null,
  legacy_url      text,                                  -- URL del WordPress actual (301)
  legacy_id       text,                                  -- id del post original (migración)
  imported_at     timestamptz,
  seo_title       text,
  seo_description text,
  og_image_path   text,
  created_by      uuid references public.profiles(id) on delete set null,
  updated_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  search_vector   tsvector generated always as (
                    setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
                    setweight(to_tsvector('spanish',
                      coalesce(subtitle, '') || ' ' || coalesce(summary, '')), 'B') ||
                    setweight(to_tsvector('spanish', coalesce(excerpt, '')), 'C')
                  ) stored,

  constraint contents_slug_unique       unique (content_type, slug),
  constraint contents_translation_unique unique (translation_of, locale),
  constraint contents_slug_format       check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint contents_title_len         check (char_length(title) between 3 and 200),
  constraint contents_summary_len       check (summary is null or char_length(summary) <= 400),
  constraint contents_views_valid       check (view_count >= 0),
  constraint contents_status_scheduled  check (status <> 'programado' or scheduled_for is not null),
  constraint contents_status_published  check (status <> 'publicado' or published_at is not null),
  constraint contents_archived_meta     check (archived_at is null or status = 'archivado'),
  constraint contents_no_self_translation check (translation_of is null or translation_of <> id),
  constraint contents_locale_format     check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

comment on table public.contents is
  'Tronco común de artículos, podcasts, videos, eventos y documentos. El cuerpo completo NO vive aquí.';
comment on column public.contents.excerpt is
  'Extracto de portada y único texto de cuerpo que ve un visitante o miembro free. Si el admin no lo escribe, el trigger lo llena con el primer párrafo del cuerpo.';
comment on column public.contents.legacy_url is
  'URL en el sitio WordPress actual. Se usa para generar las redirecciones 301 y no perder posicionamiento.';

-- ---------------------------------------------------------------------------
-- content_bodies: EL CUERPO COMPLETO, EN TABLA APARTE.
--
-- Este es el corazón del muro de pago. Row Level Security protege FILAS, no
-- columnas: si el cuerpo viviera en `contents`, cualquier fila visible expondría
-- el texto completo a un miembro free con una simple consulta a la API.
-- Al separarlo, la RLS decide fila por fila quién puede leer el cuerpo, y el
-- extracto (contents.excerpt) queda disponible para todos.
--
-- El trigger de `contents` crea aquí la fila vacía al insertar el contenido, de
-- modo que la relación 1-1 se cumple siempre y el editor solo hace UPDATE.
-- ---------------------------------------------------------------------------
create table public.content_bodies (
  content_id  uuid primary key references public.contents(id) on delete cascade,
  body_md     text not null default '',
  body_format text not null default 'markdown',
  word_count  integer,
  updated_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint content_bodies_format_valid check (body_format in ('markdown', 'html')),
  constraint content_bodies_words_valid  check (word_count is null or word_count >= 0)
);

comment on table public.content_bodies is
  'Cuerpo completo del contenido. Tabla protegida por RLS: solo staff y quienes tienen derecho al cuerpo pueden leerla.';

-- ---------------------------------------------------------------------------
-- content_secrets: lo que no puede viajar en una fila visible.
-- La URL de la sala virtual de un evento en línea y la ruta de descarga de un
-- PDF premium son datos con valor propio: si vivieran en `events`, cualquiera
-- que vea la fila del evento (aunque sea solo el extracto) los leería.
-- ---------------------------------------------------------------------------
create table public.content_secrets (
  content_id          uuid primary key references public.contents(id) on delete cascade,
  virtual_url         text,
  access_code         text,
  download_path       text,
  download_expires_at timestamptz,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint content_secrets_url_format check (virtual_url is null or virtual_url ~* '^https?://')
);

comment on table public.content_secrets is
  'Datos de acceso restringido (sala virtual, código, ruta de descarga premium). RLS: staff y quien tenga derecho al cuerpo.';

-- ---------------------------------------------------------------------------
-- content_tags: relación N-M entre contenido y etiquetas.
-- ---------------------------------------------------------------------------
create table public.content_tags (
  content_id uuid not null references public.contents(id) on delete cascade,
  tag_id     uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (content_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- articles: autoría. Un artículo es de un consultor O de CEDEM (nunca de ambos
-- ni de ninguno). `series` recoge las series reales del sitio actual
-- ("Crónica de una Travesía", "Dueñez Empresaria").
-- ---------------------------------------------------------------------------
create table public.articles (
  content_id             uuid primary key references public.contents(id) on delete cascade,
  consultant_id          uuid references public.consultants(id) on delete set null,
  authored_by_cedem      boolean not null default false,
  coauthors              text[] not null default '{}',
  series                 text,
  published_elsewhere_url text,                          -- Noroeste, República, El Economista...
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint articles_author_present check (consultant_id is not null or authored_by_cedem),
  constraint articles_elsewhere_url  check (published_elsewhere_url is null or published_elsewhere_url ~* '^https?://')
);

comment on table public.articles is
  'Extensión de contenido para artículos. La autoría es de un consultor o de CEDEM (CHECK articles_author_present).';

-- ---------------------------------------------------------------------------
-- podcasts: el plan maestro deja el modelo listo pero la producción pendiente.
-- ---------------------------------------------------------------------------
create table public.podcasts (
  content_id       uuid primary key references public.contents(id) on delete cascade,
  episode_number   integer,
  season           smallint,
  audio_path       text,                                 -- bucket `audio`
  audio_url        text,                                 -- CDN externo (Spotify, SoundCloud...)
  duration_seconds integer,
  guest_name       text,
  guest_role       text,
  guest_company    text,
  guest_linkedin_url text,
  transcript_md    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint podcasts_episode_valid  check (episode_number is null or episode_number > 0),
  constraint podcasts_season_valid   check (season is null or season > 0),
  constraint podcasts_duration_valid check (duration_seconds is null or duration_seconds > 0),
  constraint podcasts_audio_url      check (audio_url is null or audio_url ~* '^https?://')
);

-- ---------------------------------------------------------------------------
-- videos: los 8 webinars de YouTube y el canal @cedemcentrodeduenez ya existen
-- y se migran; por eso `provider` + `external_id` son la vía principal.
-- ---------------------------------------------------------------------------
create table public.videos (
  content_id       uuid primary key references public.contents(id) on delete cascade,
  provider         public.video_provider not null default 'youtube',
  external_id      text,                                 -- p. ej. KiV4iBFZwnY
  embed_url        text,
  file_path        text,                                 -- bucket `videos`
  duration_seconds integer,
  transcript_md    text,
  recorded_at      date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint videos_duration_valid check (duration_seconds is null or duration_seconds > 0),
  constraint videos_embed_url      check (embed_url is null or embed_url ~* '^https?://')
);

-- ---------------------------------------------------------------------------
-- documents: los 11 PDFs metodológicos que hoy están escondidos y que el plan
-- manda a la biblioteca de miembros. `rights_notice` recoge el aviso legal que
-- ya traen ("Dueñez® es marca registrada por Carlos A. Dumois Núñez...").
-- ---------------------------------------------------------------------------
create table public.documents (
  content_id      uuid primary key references public.contents(id) on delete cascade,
  file_path       text,                                  -- bucket `documents`
  file_mime       text,
  file_size_bytes bigint,
  pages           smallint,
  author_label    text,
  rights_notice   text,
  is_downloadable boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint documents_size_valid  check (file_size_bytes is null or file_size_bytes > 0),
  constraint documents_pages_valid check (pages is null or pages > 0)
);

-- ---------------------------------------------------------------------------
-- events: fecha, lugar, modalidad, cupo e inscripción.
-- `starts_at` es NULL-able a propósito (borrador sin fecha); el trigger de
-- publicación lo exige. La URL de la sala virtual NO está aquí: va en
-- content_secrets.
-- ---------------------------------------------------------------------------
create table public.events (
  content_id              uuid primary key references public.contents(id) on delete cascade,
  starts_at               timestamptz,
  ends_at                 timestamptz,
  timezone                text not null default 'America/Mexico_City',
  modality                public.event_modality not null default 'presencial',
  venue_name              text,
  venue_address           text,
  city                    text,
  country_code            char(2) references public.countries(code) on delete set null,
  capacity                integer,
  allow_waitlist          boolean not null default true,
  registration_opens_at   timestamptz,
  registration_closes_at  timestamptz,
  is_registration_open    boolean not null default true,
  price_cents             bigint not null default 0,     -- 0 = gratuito
  currency                char(3) not null default 'MXN',
  external_registration_url text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint events_dates_valid      check (ends_at is null or starts_at is null or ends_at >= starts_at),
  constraint events_capacity_valid   check (capacity is null or capacity > 0),
  constraint events_price_valid      check (price_cents >= 0),
  constraint events_currency_format  check (currency ~ '^[A-Z]{3}$'),
  constraint events_registration_window check (
    registration_closes_at is null or registration_opens_at is null
    or registration_closes_at > registration_opens_at),
  constraint events_external_url     check (external_registration_url is null or external_registration_url ~* '^https?://')
);

comment on table public.events is
  'Extensión de contenido para eventos. La URL de la sala virtual vive en content_secrets (no aquí).';

-- ---------------------------------------------------------------------------
-- event_registrations: inscripción. Puede ser de un miembro (user_id) o de un
-- visitante que dejó su correo. Se llena SOLO por el RPC register_for_event(),
-- que valida cupo y lista de espera de forma atómica.
-- ---------------------------------------------------------------------------
create table public.event_registrations (
  id           uuid primary key default gen_random_uuid(),
  content_id   uuid not null references public.contents(id) on delete cascade,
  user_id      uuid references public.profiles(id) on delete set null,
  full_name    text not null,
  email        citext not null,
  phone        text,
  company      text,
  job_title    text,
  status       public.registration_status not null default 'confirmada',
  seats        smallint not null default 1,
  notes        text,
  source       text,                                     -- utm_source / de dónde llegó
  ip           inet,
  user_agent   text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  attended_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint event_registrations_unique_email unique (content_id, email),
  constraint event_registrations_seats_valid  check (seats between 1 and 10),
  constraint event_registrations_name_len     check (char_length(full_name) between 3 and 160),
  constraint event_registrations_cancelled    check (status <> 'cancelada' or cancelled_at is not null),
  constraint event_registrations_attended     check (status <> 'asistio' or attended_at is not null)
);

comment on table public.event_registrations is
  'Inscripciones a eventos. El cupo se valida en el RPC register_for_event, no en la aplicación.';
