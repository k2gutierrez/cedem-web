-- Migración 14 — Privilegios (tablas, columnas y funciones)
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101121400_14_grants.sql
-- =============================================================================

set search_path = public, extensions;

-- 1. Punto de partida: quitar todo lo que Supabase concede por defecto.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

-- Que las tablas futuras tampoco hereden permisos.
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Lectura. `anon` solo lee lo que el sitio público necesita; `authenticated`
--    lee además lo que la RLS le deje ver.
-- ---------------------------------------------------------------------------
grant select on
  public.countries, public.consultants, public.clients, public.testimonials,
  public.tags, public.contents, public.content_bodies, public.content_tags,
  public.articles, public.podcasts, public.videos, public.documents, public.events,
  public.plans, public.plan_prices, public.site_settings, public.redirects
to anon;

grant select on
  public.countries, public.consultants, public.clients, public.testimonials,
  public.tags, public.contents, public.content_bodies, public.content_secrets,
  public.content_tags, public.articles, public.podcasts, public.videos,
  public.documents, public.events, public.plans, public.plan_prices,
  public.site_settings, public.redirects,
  public.profiles, public.subscriptions, public.payments,
  public.event_registrations, public.journey_segments, public.journey_questions,
  public.journey_sessions, public.journey_answers, public.journey_results,
  public.journey_recommendations, public.ai_conversations, public.journey_notes
to authenticated;

-- `content_bodies` SÍ se concede a `anon`, y es deliberado: el visitante tiene
-- que poder leer el cuerpo COMPLETO del contenido público ("ve contenido
-- público completo"). Quien separa una cosa de la otra es la RLS, no el
-- privilegio: `can_read_body()` devuelve falso para el contenido premium, así
-- que el visitante solo obtiene la fila cuando el contenido es público de
-- verdad. Confundir "no lo veas" con "no lo puedas pedir" es lo que rompe el
-- sitio público.
-- `invitations`, `audit_logs` y `access_logs` solo se conceden al staff.

grant select on public.invitations, public.audit_logs, public.access_logs
to authenticated;   -- la RLS limita a admin (y super_admin) las filas

-- 2.b Vistas. ¡Ojo! `revoke all on all tables` también alcanza a las vistas
--     (para PostgreSQL una vista es una relación más), así que hay que
--     volver a concederlas a mano. Es el error clásico de esta migración.
grant select on
  public.v_contents_for_viewer, public.v_content_cards, public.v_public_team,
  public.v_clients_public, public.v_countries_map, public.v_public_testimonials
to anon, authenticated;

-- Las vistas de panel se ejecutan con los permisos de quien consulta
-- (security_invoker = true), así que además necesitan poder leer las tablas base.
grant select on public.v_admin_members, public.v_journey_overview to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Escritura por tabla. Lo que no aparece aquí, no se escribe por API.
-- ---------------------------------------------------------------------------
grant insert, update, delete on
  public.countries, public.clients, public.testimonials, public.tags,
  public.contents, public.content_bodies, public.content_secrets, public.content_tags,
  public.articles, public.podcasts, public.videos, public.documents, public.events,
  public.plans, public.plan_prices, public.invitations, public.site_settings,
  public.redirects, public.journey_segments, public.journey_questions,
  public.consultants
to authenticated;

grant insert, update, delete on public.event_registrations to authenticated;  -- admin
grant insert, update, delete on public.subscriptions, public.payments,
                                public.journey_notes to authenticated;

-- Nadie escribe auditoría ni accesos por API (ni admin): definer o nada.
-- (revoke ya aplicado arriba; se deja explícito como intención.)
revoke insert, update, delete on public.audit_logs, public.access_logs
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Privilegios por COLUMNA.
--    OJO, TRAMPA CLÁSICA (verificada en PostgreSQL 16 con has_column_privilege):
--    `grant update on tabla` + `revoke update (columna)` NO restringe nada.
--    Un privilegio de tabla implica todas sus columnas, así que la comprobación
--    de columna sigue devolviendo verdadero. La única forma de limitar columnas
--    es NO conceder el privilegio a nivel de tabla y conceder columna a columna.
--
--    Aquí está la frontera "usuario vs servidor": columnas que solo deben
--    escribirlas el servidor (service_role) o un RPC definer. Donde la frontera
--    es "rol vs rol" (admin vs miembro) este mecanismo NO sirve, porque ambos
--    comparten el rol `authenticated`: ahí mandan los triggers guard
--    (profiles_guard, consultants_guard, subscriptions_guard).
-- ---------------------------------------------------------------------------

-- profiles: el perfil lo crea handle_new_user; no hay INSERT para nadie.
-- `role`, `email`, `segment`, `id` y `created_at` NO se conceden: se cambian por
-- admin_set_user_role / refresh_user_role o por el trigger de sincronización.
-- Ni siquiera un admin puede tocarlos con su token de usuario.
grant update (
  full_name, display_name, phone, avatar_path, locale, theme, timezone,
  company_name, job_title, company_country_code, company_city, company_sector,
  employees_count, annual_revenue_usd, marketing_opt_in,
  privacy_accepted_at, privacy_policy_version, profile_completed_at, last_seen_at,
  is_blocked, blocked_reason, internal_notes
) on public.profiles to authenticated;

-- journey_sessions: el usuario abre y cierra su recorrido; las puntuaciones,
-- el resumen de la IA y la duración los escribe el motor (service_role).
grant insert (user_id, status, device, source)
  on public.journey_sessions to authenticated;
grant update (status, current_segment_id, last_activity_at, device, source)
  on public.journey_sessions to authenticated;

-- journey_answers: el usuario responde; `numeric_value` lo normaliza el motor.
grant insert (session_id, question_id, segment_id, value, answered_at)
  on public.journey_answers to authenticated;
grant update (value, answered_at) on public.journey_answers to authenticated;

-- journey_recommendations: el usuario solo marca visto / útil.
grant update (seen_at, is_helpful)
  on public.journey_recommendations to authenticated;

-- Comprobación rápida de que la restricción quedó bien puesta:
--   select has_column_privilege('authenticated','public.profiles','role','UPDATE');     -- false
--   select has_column_privilege('authenticated','public.profiles','full_name','UPDATE');-- true
--   select has_column_privilege('authenticated','public.journey_sessions','score_total','UPDATE'); -- false

-- ---------------------------------------------------------------------------
-- 5. Funciones. Solo se expone lo que el cliente necesita llamar.
-- ---------------------------------------------------------------------------
-- 5.a Helpers que evalúan las policies: los necesitan TODOS los roles que
--     consultan (si no, la propia policy falla por falta de permiso).
--
--     `first_paragraph` entra aquí por un detalle que cuesta encontrar: el
--     permiso de EXECUTE de una función se comprueba SIEMPRE contra el usuario
--     de la sesión, incluso dentro de una vista con security_invoker = false
--     (ese mecanismo solo afecta al acceso a tablas). Sin este grant, la vista
--     v_contents_for_viewer falla con "permission denied for function
--     first_paragraph" en cuanto alguien pide la columna body_md.
grant execute on function
  public.current_user_role(),
  public.has_role(public.user_role[]),
  public.is_admin(),
  public.is_super_admin(),
  public.is_staff_editor(),
  public.is_premium_viewer(),
  public.has_active_membership(uuid),
  public.current_consultant_id(),
  public.owns_content(uuid),
  public.owns_journey_session(uuid),
  public.is_content_live(public.content_status, timestamptz, timestamptz),
  public.content_visibility_allows(public.content_visibility),
  public.can_view_content(uuid),
  public.can_read_body(uuid),
  public.is_event_registrant(uuid),
  public.can_read_storage_object(text, text),
  public.first_paragraph(text)
to anon, authenticated;

-- 5.b RPC públicas (sitio sin sesión incluido).
grant execute on function
  public.get_content(text, public.content_type),
  public.register_content_view(uuid),
  public.register_for_event(uuid, text, citext, text, text, text, text, text)
to anon, authenticated;

-- 5.c RPC de usuario con sesión.
grant execute on function
  public.get_my_membership(),
  public.get_download_path(uuid),
  public.log_access(public.access_action, text, text, public.content_type, text, jsonb, integer, uuid),
  public.redeem_invitation(text)
to authenticated;

-- 5.d RPC de staff (la función vuelve a verificar el rol por dentro: la
--     seguridad no depende de este grant, pero reduce la superficie expuesta).
grant execute on function
  public.admin_set_user_role(uuid, public.user_role, text),
  public.admin_grant_subscription(uuid, uuid, integer, text)
to authenticated;

-- 5.e Solo service_role / cron. `job_expire_subscriptions` NO se concede a
--     authenticated: la llama el programador con la clave de servicio.
revoke execute on function public.job_expire_subscriptions() from anon, authenticated;

-- 5.f Helpers internos (slugify, first_paragraph, audit_redact, flag_set...):
--     nadie los llama desde la API. Se quedan sin grant.
