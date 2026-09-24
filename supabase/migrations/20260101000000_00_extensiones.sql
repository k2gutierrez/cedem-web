-- Migración 0 — Extensiones
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101120000_00_extensions.sql
-- Extensiones. En Supabase viven en el esquema `extensions` para no contaminar
-- `public` (que es el que PostgREST expone como API).
-- =============================================================================

-- Búsqueda insensible a mayúsculas en correos (invitaciones, perfiles).
create extension if not exists citext    with schema extensions;
-- Normalización de acentos al generar slugs.
create extension if not exists unaccent  with schema extensions;
-- Búsqueda difusa por similitud en títulos y nombres.
create extension if not exists pg_trgm   with schema extensions;
-- gen_random_uuid() es nativo desde PostgreSQL 13; pgcrypto se incluye por
-- digest()/hmac() que usamos para hashear códigos de invitación en el futuro.
create extension if not exists pgcrypto  with schema extensions;

-- OPCIONAL (no incluido en el bloque): pg_cron para el job diario que expira
-- suscripciones. En Supabase se habilita desde el panel y, si se crea a mano,
-- debe ir en pg_catalog:
--   create extension if not exists pg_cron with schema pg_catalog;
-- Alternativa sin pg_cron: Vercel Cron llamando al RPC `public.job_expire_subscriptions()`
-- (incluido en la migración 12). Se deja como decisión de operación, no de modelo.

-- `extensions` entra al search_path para poder escribir `citext` sin prefijo en
-- las migraciones siguientes. Cada archivo de migración repite esta línea.
set search_path = public, extensions;
