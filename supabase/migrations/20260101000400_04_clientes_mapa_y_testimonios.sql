-- Migración 4 — Clientes, mapa y testimonios
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101120400_04_clientes.sql
-- Empresas cliente (logos y países del mapa) y testimonios.
--
-- REGLA DE ORO: nada con marca de un cliente se publica sin brand_authorized.
-- El documento 00 deja este punto abierto ("hay marcas que quizá no quieras
-- mostrar") y el 02 lo vuelve entregable; el modelo lo resuelve con dos
-- banderas y un CHECK, no con buena voluntad.
-- =============================================================================

set search_path = public, extensions;

create table public.clients (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  name                 text not null,
  legal_name           text,
  country_code         char(2) not null references public.countries(code) on delete restrict,
  city                 text,
  sector               text,

  -- marca
  logo_path            text,                            -- bucket `client-logos`
  logo_dark_path       text,                            -- variante para modo oscuro
  brand_authorized     boolean not null default false,  -- ¿podemos usar su marca?
  brand_authorized_at  timestamptz,
  brand_authorized_by  uuid references public.profiles(id) on delete set null,

  -- presencia
  show_on_map          boolean not null default true,   -- cuenta para el mapa (dato de país, no de marca)
  is_featured          boolean not null default false,  -- carrusel de logos del sitio público
  is_active            boolean not null default true,
  relationship_since   smallint,
  website_url          text,

  -- cifras autodeclaradas del caso de éxito. Se guardan en jsonb porque NO están
  -- auditadas por un tercero (ver 01-investigacion): mientras no haya fuente
  -- verificable, no merecen columnas propias ni una tabla normalizada.
  -- Forma: [{"label":"Ventas","from":20,"to":250,"unit":"MDD","years":21,"source":"declarado por CEDEM"}]
  metrics              jsonb not null default '[]'::jsonb,

  notes_internal       text,
  sort_order           integer not null default 100,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint clients_slug_format    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint clients_name_len       check (char_length(name) between 2 and 160),
  constraint clients_metrics_array  check (jsonb_typeof(metrics) = 'array'),
  constraint clients_authorized_meta check (brand_authorized or brand_authorized_at is null),
  -- No se puede destacar (carrusel) una marca que no está autorizada.
  constraint clients_featured_requires_brand check (not is_featured or brand_authorized)
);

comment on table public.clients is
  'Empresas cliente. El mapa solo necesita país; el logo y el nombre exigen brand_authorized = true.';
comment on column public.clients.metrics is
  'Cifras de caso de éxito autodeclaradas (Coppel, Caffenio, Sukarne...). Sin verificación externa: no publicar sin fuente y fecha.';

create table public.testimonials (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid references public.clients(id) on delete set null,
  person_name     text not null,
  person_role     text,
  person_company  text,
  quote           text not null,
  photo_path      text,                                 -- bucket `avatars`
  source_url      text,
  authorized      boolean not null default false,       -- autorización de la persona
  is_published    boolean not null default false,
  locale          text not null default 'es-MX',
  sort_order      integer not null default 100,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint testimonials_quote_len   check (char_length(quote) between 20 and 1200),
  constraint testimonials_name_len    check (char_length(person_name) between 3 and 160),
  -- Un testimonio no se publica sin autorización explícita de quien lo firma.
  constraint testimonials_publish_requires_authorization check (not is_published or authorized)
);

comment on table public.testimonials is
  'Testimonios del sitio público. is_published exige authorized = true (CHECK).';
