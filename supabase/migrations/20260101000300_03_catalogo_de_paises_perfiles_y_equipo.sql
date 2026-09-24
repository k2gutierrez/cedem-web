-- Migración 3 — Catálogo de países, perfiles y equipo
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101120300_03_identidad.sql
-- Países (catálogo que usan perfiles, clientes y eventos), perfiles de usuario
-- y fichas públicas de consultor.
-- =============================================================================

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- countries: alimenta el mapa de clientes y la sede de los eventos.
-- Se guarda como catálogo propio (no como texto libre) para que el mapa tenga
-- un código ISO con el que pintar el SVG y para poder traducir el nombre.
-- ---------------------------------------------------------------------------
create table public.countries (
  code        char(2) primary key,                    -- ISO 3166-1 alpha-2
  iso3        char(3) not null unique,
  name_es     text    not null,
  name_en     text    not null,
  region      text    not null,                       -- Norteamérica | Latinoamérica | Europa
  is_active   boolean not null default true,
  sort_order  integer not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint countries_code_format check (code ~ '^[A-Z]{2}$'),
  constraint countries_iso3_format check (iso3 ~ '^[A-Z]{3}$'),
  constraint countries_name_es_len  check (char_length(name_es) between 2 and 80)
);

comment on table public.countries is
  'Catálogo ISO de países. El mapa resalta los que tienen clientes activos (vista v_countries_map).';

-- ---------------------------------------------------------------------------
-- profiles: 1-1 con auth.users. Es la tabla que responde "¿quién es y qué puede
-- hacer?". El rol vive aquí (no en el JWT) para que un cambio de rol surta
-- efecto en la siguiente petición, sin esperar a que caduque el token.
--
-- `segment` NO es columna generada a propósito: un casteo a ENUM dentro de una
-- columna generada depende de una función STABLE y PostgreSQL lo rechaza. Se
-- mantiene con el trigger `profiles_set_segment` (migración 10).
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 citext not null,
  role                  public.user_role not null default 'miembro_free',

  -- identidad
  full_name             text,
  display_name          text,
  phone                 text,
  avatar_path           text,                          -- bucket `avatars`
  locale                text not null default 'es-MX',
  theme                 public.theme_preference not null default 'sistema',
  timezone              text not null default 'America/Mexico_City',

  -- empresa (lo que segmenta Consulting vs PCE)
  company_name          text,
  job_title             text,
  company_country_code  char(2) references public.countries(code) on delete set null,
  company_city          text,
  company_sector        text,
  employees_count       integer,
  annual_revenue_usd    numeric(14,2),
  segment               public.client_segment not null default 'desconocido',

  -- cumplimiento y preferencias
  privacy_accepted_at       timestamptz,
  privacy_policy_version    text,
  marketing_opt_in          boolean not null default false,
  profile_completed_at      timestamptz,

  -- operación
  last_seen_at          timestamptz,
  is_blocked            boolean not null default false,
  blocked_reason        text,
  internal_notes        text,                          -- visible solo para staff

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint profiles_email_unique      unique (email),
  constraint profiles_no_visitante      check (role <> 'visitante'),
  constraint profiles_email_format      check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint profiles_locale_format     check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  constraint profiles_employees_valid   check (employees_count is null or employees_count >= 0),
  constraint profiles_revenue_valid     check (annual_revenue_usd is null or annual_revenue_usd >= 0),
  constraint profiles_name_len          check (full_name is null or char_length(full_name) between 2 and 160),
  constraint profiles_blocked_reason    check (not is_blocked or blocked_reason is not null)
);

comment on table public.profiles is
  'Perfil del usuario y fuente única del rol. Se crea automáticamente al registrarse (handle_new_user).';
comment on column public.profiles.segment is
  'Derivado de annual_revenue_usd por el trigger profiles_set_segment: consulting >= 5M USD, pce < 5M USD.';
comment on column public.profiles.privacy_accepted_at is
  'Fecha de aceptación del aviso de privacidad. Se guarda también la versión del documento aceptado.';

-- ---------------------------------------------------------------------------
-- consultants: la ficha pública del equipo (la que ve el visitante en /equipo).
-- No se expone `profiles` al público: aquí solo vive lo que el consultor decidió
-- publicar (bio, LinkedIn, X, CV). Borrar la cuenta NO borra la ficha: se pone
-- profile_id en NULL para no perder el histórico de autoría.
-- ---------------------------------------------------------------------------
create table public.consultants (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid unique references public.profiles(id) on delete set null,
  slug           text not null unique,
  full_name      text not null,
  headline       text,                                  -- "Socio Consultor · Gobierno corporativo"
  bio_md         text,
  location       text,
  photo_path     text,                                  -- bucket `avatars`
  cv_path        text,                                  -- bucket `documents` (privado)
  linkedin_url   text,
  x_url          text,
  website_url    text,
  email_public   citext,
  specialties    text[] not null default '{}',
  languages      text[] not null default '{es}',
  started_year   smallint,
  is_founder     boolean not null default false,
  is_active      boolean not null default true,
  sort_order     integer not null default 100,
  legacy_url     text,                                  -- URL del sitio WordPress (301)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint consultants_slug_format   check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint consultants_name_len      check (char_length(full_name) between 3 and 160),
  constraint consultants_linkedin_url  check (linkedin_url is null or linkedin_url ~* '^https://([a-z]{2,3}\.)?linkedin\.com/'),
  constraint consultants_x_url         check (x_url is null or x_url ~* '^https://(www\.)?(x|twitter)\.com/'),
  constraint consultants_website_url   check (website_url is null or website_url ~* '^https?://'),
  constraint consultants_started_year  check (started_year is null or started_year between 1900 and 2100)
);

comment on table public.consultants is
  'Ficha pública del equipo. Editable por su dueño (profile_id = auth.uid()) o por admin.';
