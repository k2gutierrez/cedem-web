-- Migración 1 — Tipos ENUM
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101120100_01_enums.sql
-- Dominios cerrados del negocio. Un ENUM valida en la base y documenta el
-- vocabulario; se usa solo donde el conjunto de valores es estable.
-- Lo que puede crecer (monedas, idiomas, zonas horarias) va como text + CHECK.
-- =============================================================================

set search_path = public, extensions;

-- Roles del negocio. `visitante` existe para que el vocabulario esté completo,
-- pero NUNCA se guarda en profiles (ver CHECK en 03_identidad.sql): el visitante
-- es el rol de Postgres `anon`, sin auth.uid().
create type public.user_role as enum (
  'visitante', 'miembro_free', 'miembro_premium', 'consultor', 'admin', 'super_admin'
);

-- Preferencia de tema del usuario (modo claro/oscuro del sitio).
create type public.theme_preference as enum ('claro', 'oscuro', 'sistema');

-- Segmento comercial derivado de la facturación anual:
--   Consulting  >= 5 millones de USD   (acompañamiento con los socios)
--   PCE         <  5 millones de USD   (Consultor Senior + equipo)
-- Es la segmentación que pide el plan maestro (D2) y la que decide a qué
-- servicio se orienta cada miembro.
create type public.client_segment as enum ('consulting', 'pce', 'desconocido');

-- Tipos de contenido. `documento` cubre los PDFs metodológicos que hoy están
-- escondidos en el sitio actual y que el plan manda a la biblioteca de miembros.
create type public.content_type as enum ('articulo', 'podcast', 'video', 'evento', 'documento');

-- Visibilidad. Es la columna que decide el muro de extracto.
create type public.content_visibility as enum ('publico', 'free_registrado', 'premium');

-- Estado editorial. `programado` + `scheduled_for` permite publicar a futuro sin
-- que nadie esté despierto a medianoche (ver `is_content_live()`).
create type public.content_status as enum ('borrador', 'programado', 'publicado', 'archivado');

create type public.video_provider as enum ('youtube', 'vimeo', 'archivo', 'externo');
create type public.event_modality as enum ('presencial', 'en_linea', 'hibrido');

create type public.registration_status as enum (
  'confirmada', 'lista_espera', 'cancelada', 'asistio', 'no_asistio'
);

create type public.plan_tier as enum ('free', 'premium');
create type public.billing_interval as enum ('mensual', 'trimestral', 'semestral', 'anual', 'unico');

-- `impaga` existe para el periodo de gracia de la pasarela antes de dar de baja
-- el acceso (dunning). Sin ese estado, un pago rechazado expulsa al miembro el
-- mismo día y se pierde la renovación.
create type public.subscription_status as enum ('en_prueba', 'activa', 'impaga', 'vencida', 'cancelada');
create type public.subscription_origin as enum ('pago', 'invitacion', 'cortesia', 'manual');

create type public.payment_status as enum ('pendiente', 'pagado', 'fallido', 'reembolsado', 'contracargo');
create type public.payment_provider as enum ('stripe', 'mercadopago', 'conekta', 'transferencia', 'otro');

create type public.invitation_status as enum ('pendiente', 'canjeada', 'expirada', 'revocada');

create type public.question_kind as enum ('escala', 'opcion_unica', 'opcion_multiple', 'texto', 'numero');
create type public.journey_session_status as enum ('en_progreso', 'completada', 'abandonada');
create type public.journey_level as enum ('critico', 'en_desarrollo', 'solido', 'referente');
create type public.recommendation_source as enum ('ia', 'regla', 'manual');
create type public.ai_role as enum ('system', 'user', 'assistant', 'tool');

-- Acciones auditables. Las tres últimas son las que el encargo pide vigilar de
-- forma explícita (cambio de visibilidad, cambio de rol, canje de invitación).
create type public.audit_action as enum (
  'insert', 'update', 'delete',
  'login', 'logout', 'registro',
  'publicacion', 'cambio_visibilidad', 'cambio_rol',
  'canje_invitacion', 'lectura_premium', 'exportacion'
);

-- Accesos. Los cinco primeros son seguridad; los cuatro últimos son el embudo
-- que el plan maestro quiere medir (visita -> servicio -> registro -> Camino -> contacto).
create type public.access_action as enum (
  'login', 'logout', 'registro', 'vista_contenido', 'lectura_premium', 'descarga',
  'vista_pagina', 'vista_servicio', 'inicio_camino', 'fin_camino', 'solicitud_contacto',
  'inscripcion_evento', 'busqueda'
);
