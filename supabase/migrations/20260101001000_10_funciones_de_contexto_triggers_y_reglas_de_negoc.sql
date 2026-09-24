-- Migración 10 — Funciones de contexto, triggers y reglas de negocio
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101121000_10_funciones_triggers.sql
-- =============================================================================

set search_path = public, extensions;

-- ###########################################################################
-- A. CONTEXTO DEL SOLICITANTE
-- Estas funciones son SECURITY DEFINER: se ejecutan como el dueño de la tabla
-- (postgres), que NO está sujeto a RLS porque no usamos FORCE ROW LEVEL SECURITY.
-- Ese detalle es exactamente lo que rompe la recursión (ver §5.14).
-- Todas son STABLE: dentro de una misma sentencia el rol no cambia, y el
-- planificador puede evaluarlas una sola vez por consulta.
-- ###########################################################################

create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select p.role from public.profiles p where p.id = auth.uid()
$$;

comment on function public.current_user_role() is
  'Rol del solicitante. SECURITY DEFINER para que la policy de profiles no se llame a sí misma. NULL si no hay sesión.';

create or replace function public.has_role(variadic p_roles public.user_role[])
returns boolean
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select coalesce(public.current_user_role() = any(p_roles), false)
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$ select public.has_role('admin', 'super_admin') $$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$ select public.has_role('super_admin') $$;

-- Staff editorial: quien puede leer cualquier cuerpo, publicar y administrar
-- contenido. El consultor entra aquí porque tiene acceso total al contenido.
create or replace function public.is_staff_editor()
returns boolean
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$ select public.has_role('consultor', 'admin', 'super_admin') $$;

-- ---------------------------------------------------------------------------
-- has_active_membership(): LA comprobación de membresía. Un solo lugar para
-- "¿está vigente?" (pago, invitación o cortesía son indistinguibles aquí).
-- ---------------------------------------------------------------------------
create or replace function public.has_active_membership(p_user uuid default auth.uid())
returns boolean
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select p_user is not null and exists (
    select 1
      from public.subscriptions s
     where s.user_id = p_user
       and s.status in ('activa', 'en_prueba')
       and (s.ends_at is null or s.ends_at > now())
  )
$$;

comment on function public.has_active_membership(uuid) is
  'True si el usuario tiene una suscripción activa o en prueba y no vencida. Cobra igual el pago y la invitación.';

-- ---------------------------------------------------------------------------
-- is_premium_viewer(): respuesta a "¿puede ver el cuerpo premium?".
-- Se apoya en el rol (camino rápido) y además consulta la suscripción: así un
-- vencimiento no depende de que el job de sincronización ya haya corrido.
-- ---------------------------------------------------------------------------
create or replace function public.is_premium_viewer()
returns boolean
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select case
    when auth.uid() is null then false
    when public.has_role('miembro_premium', 'consultor', 'admin', 'super_admin') then true
    else public.has_active_membership(auth.uid())
  end
$$;

create or replace function public.current_consultant_id()
returns uuid
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select k.id from public.consultants k where k.profile_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- owns_content(): ¿este consultor es dueño del contenido?
-- Se responde por DOS vías, y la segunda no es un adorno:
--   1. Es el autor firmado (fila en `articles` con su ficha de consultor).
--   2. Lo creó él mismo (`created_by = auth.uid()`).
-- Sin la vía 2, el editor del consultor se rompe en silencio: al crear un
-- artículo, el cuerpo se guarda ANTES de la fila de autoría, así que la RLS
-- descartaría el UPDATE del cuerpo (0 filas, sin error) y el artículo quedaría
-- vacío. La vía 2 lo hace independiente del orden de los pasos. Se exige que el
-- rol siga siendo `consultor` para que un ex-consultor no conserve acceso.
-- ---------------------------------------------------------------------------
create or replace function public.owns_content(p_content_id uuid)
returns boolean
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (
           select 1
             from public.articles a
             join public.consultants k on k.id = a.consultant_id
            where a.content_id = p_content_id
              and k.profile_id = auth.uid()
         )
      or exists (
           select 1
             from public.contents c
            where c.id = p_content_id
              and c.created_by = auth.uid()
              and public.current_user_role() = 'consultor'
         )
$$;

create or replace function public.owns_journey_session(p_session_id uuid)
returns boolean
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (
    select 1 from public.journey_sessions s
     where s.id = p_session_id and s.user_id = auth.uid()
  )
$$;

-- ---------------------------------------------------------------------------
-- is_content_live(): ¿el contenido ya es visible al público?
-- Un contenido publicado lo es desde published_at; uno programado, desde
-- scheduled_for. Así el admin puede programar a futuro sin que nadie tenga que
-- acordarse de cambiar el estado a medianoche.
-- ---------------------------------------------------------------------------
create or replace function public.is_content_live(
  p_status        public.content_status,
  p_published_at  timestamptz,
  p_scheduled_for timestamptz
)
returns boolean
language sql stable
as $$
  select case
    when p_status = 'publicado'  then coalesce(p_published_at, now()) <= now()
    when p_status = 'programado' then p_scheduled_for is not null and p_scheduled_for <= now()
    else false                       -- borrador y archivado nunca están "en vivo"
  end
$$;

-- ---------------------------------------------------------------------------
-- content_visibility_allows(): traduce la visibilidad del contenido a
-- "¿este solicitante puede leer su CUERPO?".
-- Ojo con la distinción, que es el corazón del muro de extracto:
--   publico         -> cualquiera, incluso sin sesión
--   free_registrado -> cualquier usuario con sesión (basta registrarse)
--   premium         -> membresía vigente o staff
-- ---------------------------------------------------------------------------
create or replace function public.content_visibility_allows(p_visibility public.content_visibility)
returns boolean
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select case
    when p_visibility = 'publico'         then true
    when p_visibility = 'free_registrado' then auth.uid() is not null
    when p_visibility = 'premium'         then public.is_premium_viewer()
    else false
  end
$$;

-- ---------------------------------------------------------------------------
-- can_view_content(): ¿puede ver la FICHA (tarjeta, título, resumen, extracto,
-- portada)?
--   La respuesta es SÍ para cualquier contenido EN VIVO, sea público, de
--   registro o premium. Eso es exactamente el "muro de extracto" que pide el
--   plan maestro (D3): el visitante ve la portada y el primer párrafo del
--   contenido premium como anzuelo para registrarse. La visibilidad NO se
--   evalúa aquí; solo decide el cuerpo.
-- can_read_body():    ¿puede leer el CUERPO COMPLETO? Aquí sí manda la
--   visibilidad (content_visibility_allows) y es la única puerta al texto.
-- ---------------------------------------------------------------------------
create or replace function public.can_view_content(p_content_id uuid)
returns boolean
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (
    select 1 from public.contents c
     where c.id = p_content_id
       and (
         public.is_staff_editor()
         or public.owns_content(c.id)
         or public.is_content_live(c.status, c.published_at, c.scheduled_for)
       )
  )
$$;

create or replace function public.can_read_body(p_content_id uuid)
returns boolean
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (
    select 1 from public.contents c
     where c.id = p_content_id
       and (
         public.is_staff_editor()
         or public.owns_content(c.id)
         or (public.is_content_live(c.status, c.published_at, c.scheduled_for)
             and public.content_visibility_allows(c.visibility))
       )
  )
$$;

comment on function public.can_read_body(uuid) is
  'Única puerta al cuerpo completo. La usan la policy de content_bodies y la vista v_contents_for_viewer.';

-- ---------------------------------------------------------------------------
-- is_event_registrant(): da acceso a los datos privados del evento (sala
-- virtual) a quien tiene inscripción confirmada. El visitante que se inscribe
-- sin cuenta recibe el enlace por correo desde el servidor: no necesita RLS.
-- ---------------------------------------------------------------------------
create or replace function public.is_event_registrant(p_content_id uuid)
returns boolean
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select public.is_staff_editor() or exists (
    select 1 from public.event_registrations r
     where r.content_id = p_content_id
       and r.user_id = auth.uid()
       and r.status in ('confirmada', 'asistio')
  )
$$;

-- ---------------------------------------------------------------------------
-- can_read_storage_object(): traduce la ruta del objeto a la regla de contenido.
-- Convención obligatoria de ruta: <content_id>/<archivo>
-- ---------------------------------------------------------------------------
create or replace function public.can_read_storage_object(p_bucket text, p_name text)
returns boolean
language plpgsql stable security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_content uuid;
begin
  if public.is_staff_editor() then
    return true;
  end if;
  begin
    v_content := (regexp_match(p_name,
      '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/'))[1]::uuid;
  exception when others then
    v_content := null;
  end;
  if v_content is null then
    return false;
  end if;
  if p_bucket in ('audio', 'documents', 'videos') then
    return public.can_read_body(v_content);
  end if;
  return false;
end;
$$;

-- ###########################################################################
-- B. UTILIDADES DE TRIGGER
-- ###########################################################################

-- safe_boolean(): convierte el texto que llega en raw_user_meta_data sin
-- reventar la transacción de registro si viene basura.
create or replace function public.safe_boolean(p_value text, p_default boolean default false)
returns boolean
language plpgsql immutable
as $$
begin
  if p_value is null or btrim(p_value) = '' then
    return p_default;
  end if;
  return p_value::boolean;
exception when others then
  return p_default;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Cabeceras de la petición (PostgREST las expone como GUC `request.headers`).
-- Se centraliza el parseo aquí: la auditoría, los RPC y el alta de inscripciones
-- necesitan IP, user-agent y referrer, y ninguno debe reventar si no vienen.
create or replace function public.request_headers()
returns jsonb
language plpgsql stable
as $$
begin
  return coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
exception when others then
  return '{}'::jsonb;
end;
$$;

create or replace function public.request_ip()
returns inet
language plpgsql stable
as $$
declare
  v_raw text;
begin
  v_raw := split_part(coalesce(public.request_headers() ->> 'x-forwarded-for', ''), ',', 1);
  if btrim(v_raw) = '' then
    v_raw := public.request_headers() ->> 'cf-connecting-ip';
  end if;
  return nullif(btrim(v_raw), '')::inet;
exception when others then
  return null;
end;
$$;

create or replace function public.request_user_agent()
returns text
language sql stable
as $$
  select left(public.request_headers() ->> 'user-agent', 400)
$$;

create or replace function public.request_id()
returns text
language sql stable
as $$
  select public.request_headers() ->> 'x-request-id'
$$;

-- Prohíbe UPDATE y DELETE en las tablas append-only. Es la garantía real de que
-- "nadie edita ni borra la auditoría": la RLS ya lo impide por API, y este
-- trigger lo impide incluso con permisos amplios. La purga por retención debe
-- encender la bandera a propósito.
create or replace function public.forbid_mutation()
returns trigger
language plpgsql
as $$
begin
  if public.flag_is_on('cedem.allow_purge') then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;
  raise exception 'La tabla public.% es append-only: no admite %.', tg_table_name, tg_op
    using errcode = '42501';
end;
$$;

-- ###########################################################################
-- C. PERFILES Y REGISTRO
-- ###########################################################################

-- Deriva el segmento comercial. Se hace en trigger (y no en columna generada)
-- porque un casteo a ENUM no es IMMUTABLE y PostgreSQL lo rechaza.
create or replace function public.profiles_set_segment()
returns trigger
language plpgsql
as $$
begin
  new.segment := public.segment_for_revenue(new.annual_revenue_usd);
  return new;
end;
$$;

-- Guardaespaldas del perfil:
--   * impide que un usuario se cambie el rol o el correo;
--   * impide que un no-admin toque los campos internos del panel
--     (bloqueo, motivo de bloqueo, notas internas).
-- El correo lo sincroniza auth.users; el rol solo lo cambia super_admin o el RPC
-- admin_set_user_role (que enciende la bandera dentro de su transacción).
-- Si auth.uid() es NULL (service_role, migración, SQL directo) se permite: ese
-- contexto ya tiene todos los privilegios y bloquearlo solo genera confusión.
--
-- Nota de diseño: esto NO se puede resolver con privilegios por columna, porque
-- admin y miembro comparten el mismo rol de Postgres (`authenticated`). Donde la
-- frontera es "rol vs rol" se usa un trigger; donde la frontera es
-- "usuario vs servidor" (ver §5.15) sí se usan privilegios por columna.
create or replace function public.profiles_guard()
returns trigger
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'El id del perfil es inmutable.' using errcode = '42501';
  end if;

  if new.email is distinct from old.email
     and auth.uid() is not null
     and not public.flag_is_on('cedem.allow_email_change')
     and not public.is_super_admin() then
    raise exception 'El correo se sincroniza desde auth.users: no se edita desde el perfil.'
      using errcode = '42501';
  end if;

  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.flag_is_on('cedem.role_change_ok')
     and not public.is_super_admin() then
    raise exception 'Solo super_admin cambia roles. Usa la función admin_set_user_role().'
      using errcode = '42501';
  end if;

  if auth.uid() is not null and not public.is_admin() then
    if new.is_blocked     is distinct from old.is_blocked
       or new.blocked_reason is distinct from old.blocked_reason
       or new.internal_notes is distinct from old.internal_notes
       or new.segment        is distinct from old.segment then
      raise exception 'Solo el staff puede modificar el estado de la cuenta o las notas internas.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

-- Guardaespaldas de la ficha pública: un consultor edita SU ficha y solo los
-- campos de su perfil público (nombre, bio, locación, CV, LinkedIn, X, foto...).
-- No puede cambiarse el slug, el orden, la antigüedad ni desactivarse.
create or replace function public.consultants_guard()
returns trigger
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_allowed text[] := array[
    'full_name', 'headline', 'bio_md', 'location', 'photo_path', 'cv_path',
    'linkedin_url', 'x_url', 'website_url', 'email_public', 'specialties',
    'languages', 'started_year', 'updated_at'
  ];
  v_forbidden text[];
begin
  -- service_role / SQL directo / admin: sin restricciones.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if old.profile_id is distinct from auth.uid() then
    raise exception 'Solo puedes editar tu propia ficha de consultor.' using errcode = '42501';
  end if;

  select array_agg(e.key order by e.key)
    into v_forbidden
    from jsonb_each(to_jsonb(new)) as e
   where to_jsonb(old) -> e.key is distinct from e.value
     and e.key <> all (v_allowed);

  if v_forbidden is not null then
    raise exception 'Un consultor no puede modificar: %. Campos editables: %.',
      array_to_string(v_forbidden, ', '), array_to_string(v_allowed, ', ')
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- handle_new_user(): crea el perfil al registrarse.
-- Sin esto, cada usuario nuevo llegaría sin rol y sin fila en profiles: toda la
-- autorización del sistema se caería.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_full_name text;
  v_locale    text;
  v_theme     public.theme_preference;
  v_privacy   boolean;
begin
  v_full_name := nullif(btrim(coalesce(
                   new.raw_user_meta_data ->> 'full_name',
                   new.raw_user_meta_data ->> 'name', '')), '');
  v_locale := coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'es-MX');

  -- Se evita el casteo directo a ENUM para que un valor inesperado no aborte el registro.
  v_theme := case new.raw_user_meta_data ->> 'theme'
               when 'claro'  then 'claro'::public.theme_preference
               when 'oscuro' then 'oscuro'::public.theme_preference
               else 'sistema'::public.theme_preference
             end;

  v_privacy := public.safe_boolean(new.raw_user_meta_data ->> 'privacy_accepted', false);

  -- Se salta el trigger genérico de auditoría: el registro de alta se escribe a
  -- mano unas líneas más abajo, con la acción 'registro' (si no, quedarían dos
  -- filas por cada alta: una 'insert' del trigger y otra 'registro' de aquí).
  perform public.flag_set('cedem.skip_audit', true);
  insert into public.profiles (
    id, email, full_name, display_name, locale, theme, role,
    privacy_accepted_at, privacy_policy_version, marketing_opt_in)
  values (
    new.id, new.email, v_full_name, v_full_name, v_locale, v_theme, 'miembro_free',
    case when v_privacy then now() end,
    case when v_privacy then new.raw_user_meta_data ->> 'privacy_version' end,
    public.safe_boolean(new.raw_user_meta_data ->> 'marketing_opt_in', false))
  on conflict (id) do nothing;
  perform public.flag_set('cedem.skip_audit', false);

  insert into public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_table, entity_id, after)
  values (
    new.id, new.email, 'miembro_free', 'registro', 'profiles', new.id::text,
    jsonb_build_object('email', new.email, 'locale', v_locale,
                       'privacy_accepted', v_privacy));

  return new;
end;
$$;

-- Mantiene el correo del perfil en sincronía cuando cambia en auth.users.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if new.email is distinct from old.email then
    perform public.flag_set('cedem.allow_email_change', true);
    update public.profiles set email = new.email where id = new.id;
    perform public.flag_set('cedem.allow_email_change', false);
  end if;
  return new;
end;
$$;

-- ###########################################################################
-- D. CONTENIDO
-- ###########################################################################

-- Slug automático, coherencia de fechas y autoría de la última edición.
create or replace function public.contents_before_write()
returns trigger
language plpgsql
as $$
begin
  -- Un contenido no puede NACER publicado: al INSERT todavía no existe su fila
  -- en content_bodies (la crea el trigger AFTER INSERT), así que la validación
  -- de publicación no tendría qué validar y se colaría un artículo vacío.
  -- El flujo correcto es: borrador -> cuerpo -> publicar.
  if tg_op = 'INSERT' and new.status = 'publicado' then
    raise exception 'Crea el contenido como borrador: el cuerpo se guarda después y la publicación se valida al publicar.'
      using errcode = '23514';
  end if;

  if new.slug is null or btrim(new.slug) = '' then
    new.slug := public.slugify(new.title);
  else
    new.slug := public.slugify(new.slug);
  end if;

  if new.status = 'publicado' and new.published_at is null then
    new.published_at := now();
  end if;
  if new.status = 'archivado' then
    new.archived_at := coalesce(new.archived_at, now());
  else
    new.archived_at := null;
  end if;

  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

-- Garantiza la relación 1-1 con content_bodies: el editor solo hace UPDATE del
-- cuerpo, nunca tiene que crear la fila.
create or replace function public.contents_after_insert()
returns trigger
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
begin
  perform public.flag_set('cedem.skip_audit', true);
  insert into public.content_bodies (content_id, body_md, updated_by)
  values (new.id, '', new.created_by)
  on conflict (content_id) do nothing;
  perform public.flag_set('cedem.skip_audit', false);
  return null;
end;
$$;

create or replace function public.content_bodies_before()
returns trigger
language plpgsql
as $$
begin
  new.word_count := case
    when btrim(new.body_md) = '' then 0
    else array_length(regexp_split_to_array(btrim(new.body_md), '[[:space:]]+'), 1)
  end;
  return new;
end;
$$;

-- Si el admin no escribió un extracto, se toma el primer párrafo del cuerpo.
-- Es el texto que verán visitantes y miembros free: por eso se calcula y se
-- guarda en `contents`, que sí es legible.
create or replace function public.content_bodies_after()
returns trigger
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_first text;
begin
  v_first := public.first_paragraph(new.body_md);
  if v_first = '' then
    return null;
  end if;
  perform public.flag_set('cedem.skip_audit', true);
  update public.contents c
     set excerpt    = v_first,
         updated_by = coalesce(new.updated_by, c.updated_by)
   where c.id = new.content_id
     and coalesce(btrim(c.excerpt), '') = '';
  perform public.flag_set('cedem.skip_audit', false);
  return null;
end;
$$;

-- Completitud exigida AL PUBLICAR (no antes): un borrador puede estar a medias.
create or replace function public.contents_validate_publish()
returns trigger
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if new.status <> 'publicado' or old.status = 'publicado' then
    return new;
  end if;

  if coalesce(btrim((select b.body_md from public.content_bodies b
                      where b.content_id = new.id)), '') = '' then
    raise exception 'No se puede publicar "%": el cuerpo está vacío.', new.title
      using errcode = '23514';
  end if;

  if new.content_type = 'articulo' then
    if not exists (select 1 from public.articles a where a.content_id = new.id) then
      raise exception 'Artículo sin autoría: asigna un consultor o marca la autoría de CEDEM.'
        using errcode = '23514';
    end if;
  elsif new.content_type = 'podcast' then
    if not exists (select 1 from public.podcasts p
                    where p.content_id = new.id
                      and (p.audio_path is not null or p.audio_url is not null)) then
      raise exception 'Podcast sin audio: falta audio_path o audio_url.' using errcode = '23514';
    end if;
  elsif new.content_type = 'video' then
    if not exists (select 1 from public.videos v
                    where v.content_id = new.id
                      and (v.file_path is not null or v.external_id is not null
                           or v.embed_url is not null)) then
      raise exception 'Video sin fuente: falta external_id, embed_url o file_path.'
        using errcode = '23514';
    end if;
  elsif new.content_type = 'evento' then
    if not exists (select 1 from public.events e
                    where e.content_id = new.id and e.starts_at is not null) then
      raise exception 'Evento sin fecha: falta starts_at.' using errcode = '23514';
    end if;
  elsif new.content_type = 'documento' then
    if not exists (select 1 from public.documents d
                    where d.content_id = new.id
                      and (d.file_path is not null
                           or exists (select 1 from public.content_secrets s
                                       where s.content_id = d.content_id
                                         and s.download_path is not null))) then
      raise exception 'Documento sin archivo: falta file_path o download_path.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

-- Garantiza que la extensión corresponda al content_type del tronco.
-- Se parametriza con TG_ARGV[0] para no repetir cinco funciones iguales.
create or replace function public.ensure_content_type()
returns trigger
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_expected public.content_type := tg_argv[0]::public.content_type;
  v_actual   public.content_type;
begin
  select c.content_type into v_actual from public.contents c where c.id = new.content_id;
  if v_actual is null then
    raise exception 'El contenido % no existe.', new.content_id using errcode = '23503';
  end if;
  if v_actual <> v_expected then
    raise exception 'El contenido % es de tipo % y no admite una fila de tipo %.',
      new.content_id, v_actual, v_expected using errcode = '23514';
  end if;
  return new;
end;
$$;

-- ###########################################################################
-- E. MEMBRESÍAS
-- ###########################################################################

-- Recalcula el rol a partir de las suscripciones. Nunca degrada a admin,
-- super_admin ni consultor: esos roles se otorgan a mano y no dependen de pagos.
create or replace function public.refresh_user_role(p_user uuid)
returns public.user_role
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_current public.user_role;
  v_new     public.user_role;
begin
  select p.role into v_current from public.profiles p where p.id = p_user for update;
  if v_current is null then
    return null;
  end if;
  if v_current in ('admin', 'super_admin', 'consultor') then
    return v_current;
  end if;

  v_new := case when public.has_active_membership(p_user)
                then 'miembro_premium'::public.user_role
                else 'miembro_free'::public.user_role end;

  if v_new <> v_current then
    perform public.flag_set('cedem.role_change_ok', true);
    update public.profiles set role = v_new where id = p_user;
    perform public.flag_set('cedem.role_change_ok', false);
  end if;
  return v_new;
end;
$$;

comment on function public.refresh_user_role(uuid) is
  'Sincroniza profiles.role con la membresía vigente. No degrada admin/super_admin/consultor.';

create or replace function public.subscriptions_sync_role()
returns trigger
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_user_role(old.user_id);
    return old;
  end if;
  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    perform public.refresh_user_role(old.user_id);
  end if;
  perform public.refresh_user_role(new.user_id);
  return new;
end;
$$;

-- Un miembro puede cancelar su membresía, pero no reescribirla (cambiar plan,
-- fecha de inicio o importe). Si intenta cualquier otra cosa, se le indica que
-- hable con CEDEM. El service_role (webhooks de pago) queda fuera del guardia.
create or replace function public.subscriptions_guard_self_update()
returns trigger
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if auth.uid() is null or public.is_admin() or public.flag_is_on('cedem.subscription_service_write') then
    return new;
  end if;
  if new.user_id <> old.user_id
     or new.plan_id <> old.plan_id
     or new.origin <> old.origin
     or new.started_at <> old.started_at
     or new.plan_price_id is distinct from old.plan_price_id
     or new.amount_cents is distinct from old.amount_cents then
    raise exception 'Una suscripción no se reescribe: solo se cancela o la actualiza la pasarela.'
      using errcode = '42501';
  end if;
  if new.status <> old.status and new.status <> 'cancelada' then
    raise exception 'Solo puedes cancelar tu membresía. Para cambiarla, contacta a CEDEM.'
      using errcode = '42501';
  end if;
  if new.status = 'cancelada' then
    new.cancelled_at := coalesce(new.cancelled_at, now());
    new.auto_renew   := false;
  end if;
  return new;
end;
$$;

-- ###########################################################################
-- F. CAMINO DEL DUEÑO
-- ###########################################################################

-- Mantiene el contador de respuestas y la marca de actividad de la sesión.
create or replace function public.journey_answers_touch()
returns trigger
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_session uuid := coalesce(new.session_id, old.session_id);
begin
  perform public.flag_set('cedem.skip_audit', true);
  update public.journey_sessions s
     set answered_count   = (select count(*) from public.journey_answers a
                              where a.session_id = v_session),
         last_activity_at = now()
   where s.id = v_session;
  perform public.flag_set('cedem.skip_audit', false);
  return null;
end;
$$;

-- ###########################################################################
-- G. AUDITORÍA
-- ###########################################################################

-- Trigger genérico: se cuelga de todas las tablas que el encargo manda vigilar.
-- Registra actor, acción, entidad, valores antes/después y campos cambiados.
-- Reglas:
--   * Si la bandera cedem.skip_audit está encendida, no escribe (escrituras
--     derivadas: excerpt, contadores, creación de la fila de cuerpo).
--   * Si un UPDATE no cambió nada, no ensucia el log.
--   * audit_redact() quita secretos antes de guardar.
--   * Distingue publicacion, cambio_visibilidad y cambio_rol, que son las
--     acciones que el negocio quiere poder revisar de un vistazo.
create or replace function public.audit_row_change()
returns trigger
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_actor   uuid := auth.uid();
  v_role    public.user_role;
  v_email   text;
  v_before  jsonb;
  v_after   jsonb;
  v_changed text[];
  v_id      text;
  v_label   text;
  v_action  public.audit_action;
begin
  if public.flag_is_on('cedem.skip_audit') then
    return null;
  end if;

  if tg_op = 'INSERT' then
    v_action := 'insert';
    v_after  := public.audit_redact(to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
    v_before := public.audit_redact(to_jsonb(old));
    v_after  := public.audit_redact(to_jsonb(new));
    select array_agg(e.key order by e.key)
      into v_changed
      from jsonb_each(v_after) as e
     where v_before -> e.key is distinct from e.value;
    if v_changed is null then
      return null;
    end if;
  else
    v_action := 'delete';
    v_before := public.audit_redact(to_jsonb(old));
  end if;

  v_id := coalesce(v_after ->> 'id', v_before ->> 'id');
  v_label := left(coalesce(
      v_after ->> 'title',     v_after ->> 'name',  v_after ->> 'full_name',
      v_after ->> 'label',     v_after ->> 'code',  v_after ->> 'slug', v_after ->> 'email',
      v_before ->> 'title',    v_before ->> 'name', v_before ->> 'full_name',
      v_before ->> 'email'), 200);

  if tg_table_name = 'contents' and tg_op = 'UPDATE' then
    if v_before ->> 'visibility' is distinct from v_after ->> 'visibility' then
      v_action := 'cambio_visibilidad';
    elsif v_before ->> 'status' is distinct from v_after ->> 'status'
          and v_after ->> 'status' = 'publicado' then
      v_action := 'publicacion';
    end if;
  elsif tg_table_name = 'profiles' and tg_op = 'UPDATE'
        and v_before ->> 'role' is distinct from v_after ->> 'role' then
    v_action := 'cambio_rol';
  end if;

  if v_actor is not null then
    select p.role, p.email::text into v_role, v_email
      from public.profiles p where p.id = v_actor;
  end if;

  insert into public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_table, entity_id, entity_label,
    before, after, changed_fields, request_id, ip, user_agent, severity)
  values (
    v_actor, v_email, v_role, v_action, tg_table_name, v_id, v_label,
    v_before, v_after, v_changed,
    public.request_id(), public.request_ip(), public.request_user_agent(),
    case when v_action in ('cambio_rol', 'cambio_visibilidad', 'delete', 'canje_invitacion')
         then 'aviso' else 'info' end);

  return null;
end;
$$;

comment on function public.audit_row_change() is
  'Trigger de auditoría genérico. Se cuelga de las tablas de negocio; escribe en audit_logs como SECURITY DEFINER.';

-- ###########################################################################
-- H. ENGANCHE DE TRIGGERS
-- Se recorren listas de tablas con format() para no repetir 60 líneas iguales.
-- ###########################################################################

-- updated_at automático (todas las tablas que lo tienen).
do $$
declare
  t text;
  tablas text[] := array[
    'countries','profiles','consultants','clients','testimonials','tags','contents',
    'content_bodies','content_secrets','articles','podcasts','videos','documents','events',
    'event_registrations','plans','plan_prices','invitations','subscriptions','payments',
    'journey_segments','journey_questions','journey_sessions','journey_answers','journey_results',
    'journey_recommendations','journey_notes','site_settings','redirects'
  ];
begin
  foreach t in array tablas loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$I', t);
    execute format('create trigger trg_%1$s_updated_at before update on public.%1$I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Auditoría de movimientos. NO se cuelga de: audit_logs y access_logs (son el
-- destino), journey_answers y ai_conversations (altísimo volumen y sin valor de
-- auditoría por fila: lo que importa ya queda en journey_sessions).
do $$
declare
  t text;
  tablas text[] := array[
    'countries','profiles','consultants','clients','testimonials','tags','contents',
    'content_bodies','content_secrets','articles','podcasts','videos','documents','events',
    'plans','plan_prices','invitations','subscriptions','payments',
    'journey_segments','journey_questions','journey_sessions','journey_results',
    'journey_recommendations','journey_notes','site_settings','redirects'
  ];
begin
  foreach t in array tablas loop
    execute format('drop trigger if exists trg_%1$s_audit on public.%1$I', t);
    execute format('create trigger trg_%1$s_audit
                    after insert or update or delete on public.%1$I
                    for each row execute function public.audit_row_change()', t);
  end loop;
end $$;

-- Inmutabilidad de los registros.
create trigger trg_audit_logs_immutable
  before update or delete on public.audit_logs
  for each row execute function public.forbid_mutation();

create trigger trg_access_logs_immutable
  before update or delete on public.access_logs
  for each row execute function public.forbid_mutation();

-- Perfiles.
create trigger trg_profiles_set_segment
  before insert or update of annual_revenue_usd on public.profiles
  for each row execute function public.profiles_set_segment();

create trigger trg_profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard();

create trigger trg_consultants_guard
  before update on public.consultants
  for each row execute function public.consultants_guard();

-- Registro: el trigger vive en el esquema auth y crea el perfil.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Contenido.
create trigger trg_contents_before_write
  before insert or update on public.contents
  for each row execute function public.contents_before_write();

create trigger trg_contents_after_insert
  after insert on public.contents
  for each row execute function public.contents_after_insert();

create trigger trg_contents_validate_publish
  before update on public.contents
  for each row execute function public.contents_validate_publish();

create trigger trg_content_bodies_before
  before insert or update on public.content_bodies
  for each row execute function public.content_bodies_before();

create trigger trg_content_bodies_after
  after insert or update of body_md on public.content_bodies
  for each row execute function public.content_bodies_after();

-- Cada extensión valida que el tronco sea de su tipo.
create trigger trg_articles_type   before insert or update of content_id on public.articles
  for each row execute function public.ensure_content_type('articulo');
create trigger trg_podcasts_type   before insert or update of content_id on public.podcasts
  for each row execute function public.ensure_content_type('podcast');
create trigger trg_videos_type     before insert or update of content_id on public.videos
  for each row execute function public.ensure_content_type('video');
create trigger trg_documents_type  before insert or update of content_id on public.documents
  for each row execute function public.ensure_content_type('documento');
create trigger trg_events_type     before insert or update of content_id on public.events
  for each row execute function public.ensure_content_type('evento');

-- Membresías.
create trigger trg_subscriptions_sync_role
  after insert or update or delete on public.subscriptions
  for each row execute function public.subscriptions_sync_role();

create trigger trg_subscriptions_guard_self_update
  before update on public.subscriptions
  for each row execute function public.subscriptions_guard_self_update();

-- Camino del Dueño.
create trigger trg_journey_answers_touch
  after insert or update or delete on public.journey_answers
  for each row execute function public.journey_answers_touch();
