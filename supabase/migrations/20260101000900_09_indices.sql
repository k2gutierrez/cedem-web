-- Migración 9 — Índices
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101120900_09_indexes.sql
-- Índices para las consultas que el sitio y el panel hacen de verdad.
-- Criterio: cubrir listados públicos, filtros del admin, comprobaciones de
-- permisos (se ejecutan en CADA petición) y búsquedas.
-- =============================================================================

set search_path = public, extensions;

-- --- identidad -------------------------------------------------------------
create index profiles_role_idx            on public.profiles (role);
create index profiles_segment_idx         on public.profiles (segment);
create index profiles_created_at_idx      on public.profiles (created_at desc);
create index profiles_full_name_trgm_idx  on public.profiles using gin (full_name gin_trgm_ops);

create index consultants_active_order_idx on public.consultants (is_active, sort_order);
create index consultants_name_trgm_idx    on public.consultants using gin (full_name gin_trgm_ops);

-- --- clientes y mapa -------------------------------------------------------
create index clients_country_idx          on public.clients (country_code);
create index clients_active_order_idx     on public.clients (is_active, sort_order);
create index clients_featured_idx         on public.clients (sort_order) where is_featured and brand_authorized;
create index testimonials_published_idx   on public.testimonials (is_published, sort_order);

-- --- contenido -------------------------------------------------------------
-- El listado público siempre filtra por tipo + estado + fecha.
create index contents_type_status_idx     on public.contents (content_type, status, published_at desc);
create index contents_visibility_idx      on public.contents (visibility, status);
create index contents_featured_idx        on public.contents (content_type, published_at desc)
  where is_featured and status = 'publicado';
create index contents_scheduled_idx       on public.contents (scheduled_for) where status = 'programado';
create index contents_search_idx          on public.contents using gin (search_vector);
create index contents_legacy_url_idx      on public.contents (legacy_url) where legacy_url is not null;
create index contents_translation_idx     on public.contents (translation_of) where translation_of is not null;
create index contents_created_by_idx      on public.contents (created_by);

create index content_tags_tag_idx         on public.content_tags (tag_id);
create index articles_consultant_idx      on public.articles (consultant_id);
create index articles_series_idx          on public.articles (series) where series is not null;
create index podcasts_episode_idx         on public.podcasts (season, episode_number);
create index videos_external_idx          on public.videos (provider, external_id) where external_id is not null;
create index events_starts_at_idx         on public.events (starts_at);
create index events_country_idx           on public.events (country_code);

create index event_registrations_event_idx on public.event_registrations (content_id, status);
create index event_registrations_user_idx  on public.event_registrations (user_id) where user_id is not null;

-- --- membresías ------------------------------------------------------------
create index plans_public_idx             on public.plans (is_public, is_active, sort_order);
create index plan_prices_plan_idx         on public.plan_prices (plan_id);
create unique index plan_prices_one_default_idx
  on public.plan_prices (plan_id, currency) where is_default;

create index invitations_pending_email_idx on public.invitations (email) where status = 'pendiente';
create index invitations_status_idx        on public.invitations (status, expires_at);
create index invitations_issued_by_idx     on public.invitations (issued_by);

create index subscriptions_user_idx        on public.subscriptions (user_id);
create index subscriptions_status_idx      on public.subscriptions (status, ends_at);
create index subscriptions_invitation_idx  on public.subscriptions (invitation_id) where invitation_id is not null;
create unique index subscriptions_external_idx
  on public.subscriptions (provider, external_subscription_id) where external_subscription_id is not null;

create index payments_user_idx             on public.payments (user_id, created_at desc);
create index payments_subscription_idx     on public.payments (subscription_id);
create index payments_status_idx           on public.payments (status, created_at desc);

-- --- camino del dueño ------------------------------------------------------
create index journey_questions_segment_idx on public.journey_questions (segment_id, sort_order);
create index journey_sessions_user_idx     on public.journey_sessions (user_id, started_at desc);
create index journey_sessions_status_idx   on public.journey_sessions (status);
create index journey_answers_session_idx   on public.journey_answers (session_id);
create index journey_answers_question_idx  on public.journey_answers (question_id);
create index journey_results_session_idx   on public.journey_results (session_id);
create index journey_results_primary_idx   on public.journey_results (session_id) where is_primary;
create index journey_recos_session_idx     on public.journey_recommendations (session_id, rank);
create index journey_recos_content_idx     on public.journey_recommendations (content_id);
create index ai_conversations_session_idx  on public.ai_conversations (session_id, turn);
create index ai_conversations_user_idx     on public.ai_conversations (user_id, created_at desc);
create index journey_notes_session_idx     on public.journey_notes (session_id, created_at desc);
create index journey_notes_user_idx        on public.journey_notes (user_id);

-- --- auditoría y configuración --------------------------------------------
-- Los logs se leen casi siempre "lo último primero" y filtrando por actor o entidad.
create index audit_logs_occurred_idx  on public.audit_logs (occurred_at desc);
create index audit_logs_actor_idx     on public.audit_logs (actor_id, occurred_at desc);
create index audit_logs_entity_idx    on public.audit_logs (entity_table, entity_id, occurred_at desc);
create index audit_logs_action_idx    on public.audit_logs (action, occurred_at desc);
create index audit_logs_changed_idx   on public.audit_logs using gin (changed_fields);

create index access_logs_occurred_idx on public.access_logs (occurred_at desc);
create index access_logs_user_idx     on public.access_logs (user_id, occurred_at desc);
create index access_logs_entity_idx   on public.access_logs (entity_table, entity_id);
create index access_logs_action_idx   on public.access_logs (action, occurred_at desc);

create index site_settings_group_idx  on public.site_settings (group_name) where is_public;
create index redirects_active_idx     on public.redirects (from_path) where is_active;
