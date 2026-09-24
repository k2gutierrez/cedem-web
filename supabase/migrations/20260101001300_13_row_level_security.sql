-- Migración 13 — Row Level Security
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101121300_13_rls.sql
-- RLS en TODAS las tablas del esquema public. Sin policies, el acceso es
-- denegado por defecto: ese es el punto de partida, no una omisión.
-- =============================================================================

set search_path = public, extensions;

alter table public.countries            enable row level security;
alter table public.profiles             enable row level security;
alter table public.consultants          enable row level security;
alter table public.clients              enable row level security;
alter table public.testimonials         enable row level security;
alter table public.tags                 enable row level security;
alter table public.contents             enable row level security;
alter table public.content_bodies       enable row level security;
alter table public.content_secrets      enable row level security;
alter table public.content_tags         enable row level security;
alter table public.articles             enable row level security;
alter table public.podcasts             enable row level security;
alter table public.videos               enable row level security;
alter table public.documents            enable row level security;
alter table public.events               enable row level security;
alter table public.event_registrations  enable row level security;
alter table public.plans                enable row level security;
alter table public.plan_prices          enable row level security;
alter table public.invitations          enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.payments             enable row level security;
alter table public.journey_segments     enable row level security;
alter table public.journey_questions    enable row level security;
alter table public.journey_sessions     enable row level security;
alter table public.journey_answers      enable row level security;
alter table public.journey_results      enable row level security;
alter table public.journey_recommendations enable row level security;
alter table public.ai_conversations     enable row level security;
alter table public.journey_notes        enable row level security;
alter table public.audit_logs           enable row level security;
alter table public.access_logs          enable row level security;
alter table public.site_settings        enable row level security;
alter table public.redirects            enable row level security;

-- --- countries -------------------------------------------------------------
-- El visitante necesita los países para el mapa y los formularios.
create policy countries_select_public on public.countries
  for select to anon, authenticated
  using (is_active);

create policy countries_admin_all on public.countries
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- profiles --------------------------------------------------------------
-- Cada quien ve y edita su perfil. El admin ve todos. NO hay policy de INSERT:
-- el perfil lo crea el trigger handle_new_user (security definer) y nadie más
-- puede fabricarse uno.
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (public.is_admin());

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy profiles_delete_super_admin on public.profiles
  for delete to authenticated
  using (public.is_super_admin());

-- --- consultants -----------------------------------------------------------
-- Ficha pública: solo activos. Su dueño la ve siempre (aunque esté inactiva) y
-- solo puede editar la suya, con los campos limitados por consultants_guard().
create policy consultants_select_public on public.consultants
  for select to anon, authenticated
  using (is_active);

create policy consultants_select_self on public.consultants
  for select to authenticated
  using (profile_id = auth.uid());

create policy consultants_update_self on public.consultants
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy consultants_admin_all on public.consultants
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- clients ---------------------------------------------------------------
-- El país y el sector son públicos (alimentan el mapa); el nombre y el logo se
-- protegen en la VISTA (v_clients_public) según brand_authorized. La tabla se
-- lee completa solo desde el panel (admin).
create policy clients_select_public on public.clients
  for select to anon, authenticated
  using (is_active);

create policy clients_admin_all on public.clients
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- testimonials ----------------------------------------------------------
create policy testimonials_select_public on public.testimonials
  for select to anon, authenticated
  using (is_published);          -- el CHECK ya obliga a authorized = true

create policy testimonials_admin_all on public.testimonials
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- tags ------------------------------------------------------------------
create policy tags_select_public on public.tags
  for select to anon, authenticated
  using (is_active);

create policy tags_admin_all on public.tags
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- contents --------------------------------------------------------------
-- can_view_content() decide la FICHA (tarjeta, título, resumen, extracto,
-- portada): es visible para CUALQUIER contenido en vivo, sea público, de
-- registro o premium. El visitante ve la tarjeta y el primer párrafo del
-- contenido premium; eso es el muro de extracto (D3 del plan maestro), no una
-- fuga. La visibilidad solo decide el CUERPO, y eso se resuelve en
-- content_bodies.
--
-- ⚠️ El primer término (`is_staff_editor()`) NO es redundante: es lo que hace
-- posible `INSERT ... RETURNING`, que es justo lo que ejecuta supabase-js al
-- encadenar `.insert().select()` (y por tanto todo el panel de admin).
-- Motivo: la comprobación de RETURNING aplica la policy de SELECT a la fila
-- recién escrita DENTRO de la misma sentencia, y `can_view_content()` es una
-- función STABLE que vuelve a leer `contents`… y una función STABLE no ve la
-- fila que la propia sentencia acaba de escribir. Resultado: el admin recibiría
-- "new row violates row-level security policy" al crear cualquier contenido.
-- `is_staff_editor()` resuelve lo mismo leyendo solo `profiles`, sin releer la
-- tabla que se está escribiendo. Regla general: **ninguna policy debe depender
-- de una función que relea la misma tabla que se está insertando.**
create policy contents_select_viewer on public.contents
  for select to anon, authenticated
  using (public.is_staff_editor() or public.can_view_content(id));

create policy contents_insert_admin on public.contents
  for insert to authenticated
  with check (public.is_admin());

create policy contents_update_admin on public.contents
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy contents_delete_admin on public.contents
  for delete to authenticated
  using (public.is_admin());

-- El consultor publica artículos, y se publican también en el área pública:
-- por eso la visibilidad permitida es 'publico'. [DECISIÓN §8: ¿puede premium?]
create policy contents_insert_consultor on public.contents
  for insert to authenticated
  with check (
    public.current_user_role() = 'consultor'
    and content_type = 'articulo'
    and visibility = 'publico'
    and status in ('borrador', 'programado', 'publicado')
    and created_by = auth.uid()
  );

create policy contents_update_consultor on public.contents
  for update to authenticated
  using (public.current_user_role() = 'consultor' and public.owns_content(id))
  with check (
    public.current_user_role() = 'consultor'
    and content_type = 'articulo'
    and visibility = 'publico'
  );

-- No puede borrar lo publicado: el artículo tiene URL pública y auditoría.
create policy contents_delete_consultor on public.contents
  for delete to authenticated
  using (public.current_user_role() = 'consultor'
         and public.owns_content(id)
         and status <> 'publicado');

-- --- content_bodies: LA tabla del muro de pago ------------------------------
-- Un miembro free no obtiene NI UNA FILA de aquí para contenido premium.
-- Aunque pida ?select=body_md a la API con su token, la respuesta es vacía.
create policy content_bodies_select on public.content_bodies
  for select to anon, authenticated
  using (public.can_read_body(content_id));

create policy content_bodies_insert_admin on public.content_bodies
  for insert to authenticated
  with check (public.is_admin());

create policy content_bodies_update_admin on public.content_bodies
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy content_bodies_update_consultor on public.content_bodies
  for update to authenticated
  using (public.current_user_role() = 'consultor' and public.owns_content(content_id))
  with check (public.current_user_role() = 'consultor' and public.owns_content(content_id));

create policy content_bodies_delete_admin on public.content_bodies
  for delete to authenticated
  using (public.is_admin());

-- --- content_secrets: sala virtual y rutas de descarga ---------------------
create policy content_secrets_select on public.content_secrets
  for select to authenticated
  using (
    public.is_staff_editor()
    or public.is_event_registrant(content_id)
    or public.can_read_body(content_id)
  );

create policy content_secrets_admin_all on public.content_secrets
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- content_tags ----------------------------------------------------------
create policy content_tags_select on public.content_tags
  for select to anon, authenticated
  using (public.can_view_content(content_id));

create policy content_tags_consultor_all on public.content_tags
  for all to authenticated
  using (public.current_user_role() = 'consultor' and public.owns_content(content_id))
  with check (public.current_user_role() = 'consultor' and public.owns_content(content_id));

create policy content_tags_admin_all on public.content_tags
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- articles: autoría -----------------------------------------------------
create policy articles_select on public.articles
  for select to anon, authenticated
  using (public.can_view_content(content_id));

create policy articles_insert_consultor on public.articles
  for insert to authenticated
  with check (
    public.current_user_role() = 'consultor'
    and consultant_id = public.current_consultant_id()   -- solo se firma a sí mismo
  );

create policy articles_update_consultor on public.articles
  for update to authenticated
  using (public.current_user_role() = 'consultor'
         and consultant_id = public.current_consultant_id())
  with check (public.current_user_role() = 'consultor'
              and consultant_id = public.current_consultant_id());

create policy articles_admin_all on public.articles
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- extensiones de solo lectura pública (las escribe el admin) ------------
create policy podcasts_select on public.podcasts
  for select to anon, authenticated
  using (public.can_view_content(content_id));
create policy podcasts_admin_all on public.podcasts
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy videos_select on public.videos
  for select to anon, authenticated
  using (public.can_view_content(content_id));
create policy videos_admin_all on public.videos
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy documents_select on public.documents
  for select to anon, authenticated
  using (public.can_view_content(content_id));
create policy documents_admin_all on public.documents
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy events_select on public.events
  for select to anon, authenticated
  using (public.can_view_content(content_id));
create policy events_admin_all on public.events
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- event_registrations: cupo, lista de espera y privacidad del asistente --
-- Nadie inserta desde el cliente: la inscripción pasa por register_for_event().
create policy event_registrations_select_self on public.event_registrations
  for select to authenticated
  using (user_id = auth.uid());

create policy event_registrations_select_admin on public.event_registrations
  for select to authenticated
  using (public.is_admin());

create policy event_registrations_update_self on public.event_registrations
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status in ('confirmada', 'cancelada', 'lista_espera'));

create policy event_registrations_admin_all on public.event_registrations
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- plans -----------------------------------------------------------------
-- Los planes públicos se muestran en /unete. Un miembro además puede leer el
-- plan que tiene contratado aunque no sea público (p. ej. plan por invitación).
create policy plans_select_public on public.plans
  for select to anon, authenticated
  using (is_public and is_active);

create policy plans_select_own on public.plans
  for select to authenticated
  using (exists (select 1 from public.subscriptions s
                  where s.plan_id = plans.id and s.user_id = auth.uid()));

create policy plans_admin_all on public.plans
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- plan_prices -----------------------------------------------------------
create policy plan_prices_select_public on public.plan_prices
  for select to anon, authenticated
  using (is_active and exists (
    select 1 from public.plans p
     where p.id = plan_prices.plan_id and p.is_public and p.is_active));

create policy plan_prices_select_own on public.plan_prices
  for select to authenticated
  using (exists (select 1 from public.subscriptions s
                  where s.plan_price_id = plan_prices.id and s.user_id = auth.uid()));

create policy plan_prices_admin_all on public.plan_prices
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- invitations -----------------------------------------------------------
-- NINGÚN miembro lee invitaciones, ni siquiera las suyas: si pudiera listarlas,
-- podría enumerar códigos ajenos. El canje ocurre por redeem_invitation(), que
-- es security definer y valida todo. Crear y revocar es tarea del admin.
create policy invitations_admin_all on public.invitations
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- subscriptions ---------------------------------------------------------
-- El usuario ve la suya; el admin ve todas. La escritura del día a día llega
-- por el webhook de la pasarela con service_role (que no pasa por RLS) y el
-- alta manual, por admin_grant_subscription(). El único cambio que un miembro
-- puede hacer por sí mismo es cancelar, y subscriptions_guard_self_update()
-- impide que con eso reescriba el plan o el importe.
create policy subscriptions_select_self on public.subscriptions
  for select to authenticated
  using (user_id = auth.uid());

create policy subscriptions_select_admin on public.subscriptions
  for select to authenticated
  using (public.is_admin());

create policy subscriptions_update_self_cancel on public.subscriptions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy subscriptions_admin_all on public.subscriptions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- payments --------------------------------------------------------------
-- Historial de pagos: el usuario ve los suyos, el admin todos. Nadie inserta
-- por API (los cargos los registra la pasarela con service_role).
create policy payments_select_self on public.payments
  for select to authenticated
  using (user_id = auth.uid());

create policy payments_select_admin on public.payments
  for select to authenticated
  using (public.is_admin());

create policy payments_admin_all on public.payments
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- journey_segments / journey_questions ----------------------------------
-- El recorrido es para miembros registrados (free y premium): es el gancho de
-- conversión, no contenido público.
create policy journey_segments_select_member on public.journey_segments
  for select to authenticated
  using (is_active);
create policy journey_segments_admin_all on public.journey_segments
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy journey_questions_select_member on public.journey_questions
  for select to authenticated
  using (is_active);
create policy journey_questions_admin_all on public.journey_questions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- journey_sessions ------------------------------------------------------
create policy journey_sessions_select_self on public.journey_sessions
  for select to authenticated
  using (user_id = auth.uid());

create policy journey_sessions_insert_self on public.journey_sessions
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'en_progreso');

create policy journey_sessions_update_self on public.journey_sessions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- El admin lee todas las sesiones (panel de seguimiento) pero no las escribe:
-- el histórico del recorrido es evidencia, no un formulario.
create policy journey_sessions_select_admin on public.journey_sessions
  for select to authenticated
  using (public.is_admin());

-- --- journey_answers -------------------------------------------------------
-- Sin policy de DELETE: las respuestas quedan registradas para que la IA y el
-- staff puedan dar seguimiento (es un requisito explícito del proyecto).
create policy journey_answers_select_self on public.journey_answers
  for select to authenticated
  using (public.owns_journey_session(session_id));

create policy journey_answers_insert_self on public.journey_answers
  for insert to authenticated
  with check (public.owns_journey_session(session_id));

create policy journey_answers_update_self on public.journey_answers
  for update to authenticated
  using (public.owns_journey_session(session_id))
  with check (public.owns_journey_session(session_id));

create policy journey_answers_select_admin on public.journey_answers
  for select to authenticated
  using (public.is_admin());

-- --- journey_results -------------------------------------------------------
-- El usuario LEE su resultado; lo escribe el motor de puntuación del servidor
-- (service_role). Si el navegador pudiera escribirlo, el resultado no valdría nada.
create policy journey_results_select_self on public.journey_results
  for select to authenticated
  using (public.owns_journey_session(session_id));

create policy journey_results_select_admin on public.journey_results
  for select to authenticated
  using (public.is_admin());

-- --- journey_recommendations ----------------------------------------------
create policy journey_recommendations_select_self on public.journey_recommendations
  for select to authenticated
  using (public.owns_journey_session(session_id));

-- El usuario solo puede marcar visto / útil (los privilegios por columna de
-- §5.15 le impiden tocar el ranking, el motivo o el artículo recomendado).
create policy journey_recommendations_update_self on public.journey_recommendations
  for update to authenticated
  using (public.owns_journey_session(session_id))
  with check (public.owns_journey_session(session_id));

create policy journey_recommendations_select_admin on public.journey_recommendations
  for select to authenticated
  using (public.is_admin());

create policy journey_recommendations_admin_all on public.journey_recommendations
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- ai_conversations ------------------------------------------------------
-- Append-only desde el servidor: el usuario y el admin LEEN, nadie escribe por
-- API (el Route Handler de DeepSeek guarda con service_role). Nada de UPDATE ni
-- DELETE: la conversación es la evidencia del seguimiento.
create policy ai_conversations_select_self on public.ai_conversations
  for select to authenticated
  using (user_id = auth.uid());

create policy ai_conversations_select_admin on public.ai_conversations
  for select to authenticated
  using (public.is_admin());

-- --- journey_notes ---------------------------------------------------------
-- Las notas son del usuario: puede escribir, editar y borrar las suyas.
-- El staff ve las que el usuario marcó como compartidas (is_private = false).
create policy journey_notes_self_all on public.journey_notes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy journey_notes_select_staff on public.journey_notes
  for select to authenticated
  using (public.is_admin()
         or (public.current_user_role() = 'consultor' and not is_private));

create policy journey_notes_admin_all on public.journey_notes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --- audit_logs: solo el admin lee; nadie escribe, edita ni borra ----------
create policy audit_logs_select_admin on public.audit_logs
  for select to authenticated
  using (public.is_admin());
-- Sin policies de INSERT/UPDATE/DELETE:
--   * INSERT: lo hace el trigger de auditoría como SECURITY DEFINER.
--   * UPDATE/DELETE: además de la RLS, el trigger forbid_mutation() los bloquea
--     incluso con permisos amplios (append-only de verdad).
-- No hay policy de lectura para el propio actor: el admin es el único que ve
-- el registro completo, como pide el encargo.

-- --- access_logs -----------------------------------------------------------
create policy access_logs_select_admin on public.access_logs
  for select to authenticated
  using (public.is_admin());
-- La escritura llega por register_content_view(), register_for_event(),
-- get_download_path(), log_access() y redeem_invitation(): todos definer.

-- --- site_settings ---------------------------------------------------------
-- El visitante solo recibe lo marcado como público (textos, contacto, redes).
create policy site_settings_select_public on public.site_settings
  for select to anon, authenticated
  using (is_public);

create policy site_settings_select_admin on public.site_settings
  for select to authenticated
  using (public.is_admin());

-- El admin alimenta el sitio (contenido, contacto, home, SEO, redes); lo que
-- es configuración del sistema (membresía, Camino, legal) es de super_admin.
create policy site_settings_admin_write on public.site_settings
  for all to authenticated
  using (public.is_admin() and group_name in ('general', 'contacto', 'home', 'seo', 'social'))
  with check (public.is_admin() and group_name in ('general', 'contacto', 'home', 'seo', 'social'));

create policy site_settings_super_admin_all on public.site_settings
  for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- --- redirects -------------------------------------------------------------
-- El middleware resuelve los 301 con la clave anónima: necesita leer.
create policy redirects_select_public on public.redirects
  for select to anon, authenticated
  using (is_active);

create policy redirects_admin_all on public.redirects
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
