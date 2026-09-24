-- Migración 8 — Auditoría, accesos, configuración y redirecciones
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101120800_08_auditoria_config.sql
-- Dos tablas de registro con propósitos distintos, la configuración del sitio
-- y las redirecciones 301 del WordPress actual.
--
--   audit_logs  -> MOVIMIENTOS (quién cambió qué y cómo estaba antes)
--   access_logs -> ACCESOS (quién entró, qué leyó, qué descargó, embudo)
--
-- Van separadas porque tienen volúmenes y retenciones distintos: los movimientos
-- son pocos y se conservan años; los accesos son muchos y se purgan por periodo.
-- =============================================================================

set search_path = public, extensions;

create table public.audit_logs (
  id             bigint generated always as identity primary key,
  occurred_at    timestamptz not null default now(),
  actor_id       uuid references public.profiles(id) on delete set null,
  actor_email    text,                                     -- instantánea: sobrevive al borrado del usuario
  actor_role     public.user_role,
  action         public.audit_action not null,
  entity_table   text not null,
  entity_id      text,                                     -- referencia DÉBIL a propósito
  entity_label   text,                                     -- "Sucesión: el momento clave" (para leer el log sin joins)
  before         jsonb,
  after          jsonb,
  changed_fields text[],
  request_id     text,
  ip             inet,
  user_agent     text,
  severity       text not null default 'info',
  constraint audit_logs_severity_valid check (severity in ('info', 'aviso', 'critico')),
  constraint audit_logs_entity_table   check (entity_table ~ '^[a-z_]+$')
);

comment on table public.audit_logs is
  'Bitácora de movimientos, APPEND-ONLY. Nadie tiene policy de INSERT/UPDATE/DELETE: escribe el trigger de auditoría y lee solo admin.';
comment on column public.audit_logs.entity_id is
  'Referencia débil (text, sin FK): el registro debe sobrevivir al borrado de la entidad auditada.';

create table public.access_logs (
  id                 bigint generated always as identity primary key,
  occurred_at        timestamptz not null default now(),
  user_id            uuid references public.profiles(id) on delete set null,
  actor_email        text,
  action             public.access_action not null,
  entity_table       text,
  entity_id          text,
  content_type       public.content_type,
  journey_session_id uuid references public.journey_sessions(id) on delete set null,
  path               text,
  referrer           text,
  utm                jsonb not null default '{}'::jsonb,
  ip                 inet,
  user_agent         text,
  duration_ms        integer,
  constraint access_logs_duration_valid check (duration_ms is null or duration_ms >= 0)
);

comment on table public.access_logs is
  'Accesos, lecturas premium, descargas y eventos del embudo. Escritura solo por RPC (security definer); lectura solo admin.';

-- ---------------------------------------------------------------------------
-- site_settings: la configuración que el admin edita sin programadores
-- (textos del home, teléfonos, direcciones, redes, versión del aviso de
-- privacidad, minutos estimados del Camino del Dueño...).
-- NUNCA se guardan aquí secretos: las claves viven en variables de entorno.
-- ---------------------------------------------------------------------------
create table public.site_settings (
  key         text primary key,
  value       jsonb not null default 'null'::jsonb,
  value_type  text not null default 'json',
  group_name  text not null default 'general',
  label       text not null,
  description text,
  is_public   boolean not null default false,              -- ¿se sirve al visitante sin sesión?
  is_editable boolean not null default true,
  updated_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint site_settings_key_format  check (key ~ '^[a-z0-9_.]+$'),
  constraint site_settings_value_type  check (value_type in
    ('texto', 'markdown', 'url', 'numero', 'booleano', 'json', 'imagen', 'fecha')),
  constraint site_settings_group_valid check (group_name in
    ('general', 'contacto', 'home', 'seo', 'membresia', 'camino', 'legal', 'social'))
);

comment on table public.site_settings is
  'Configuración del sitio en clave-valor. Todo lo que el admin deba cambiar sin programadores. Sin secretos.';

-- ---------------------------------------------------------------------------
-- redirects: los 301 desde las URLs del WordPress actual. Complementa a
-- contents.legacy_url (que cubre artículos y fichas); aquí van las páginas
-- sueltas, categorías y el 410 de lo que ya no existe.
-- ---------------------------------------------------------------------------
create table public.redirects (
  id          uuid primary key default gen_random_uuid(),
  from_path   text not null unique,
  to_path     text not null,
  status_code smallint not null default 301,
  is_active   boolean not null default true,
  hits        integer not null default 0,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint redirects_from_format check (from_path ~ '^/'),
  constraint redirects_to_format   check (to_path ~ '^(/|https?://)'),
  constraint redirects_status      check (status_code in (301, 302, 307, 308, 410)),
  constraint redirects_hits_valid  check (hits >= 0)
);

comment on table public.redirects is
  'Redirecciones 301/410 del sitio anterior. Se resuelven en el middleware de Next.js leyendo esta tabla (con caché).';
