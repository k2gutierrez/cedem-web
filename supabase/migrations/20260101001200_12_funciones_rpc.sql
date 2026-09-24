-- Migración 12 — Funciones RPC
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101121200_12_rpc.sql
-- =============================================================================

set search_path = public, extensions;

-- ###########################################################################
-- 1. CANJE DE INVITACIÓN (la puerta de entrada de los clientes actuales)
--    Valida: sesión, código, estado, vigencia, correo destinatario y que no
--    exista ya una membresía activa. Crea la suscripción, marca la invitación
--    como canjeada, sincroniza el rol y deja registro en la auditoría.
--    El `for update` serializa dos canjes simultáneos del mismo código.
-- ###########################################################################
create or replace function public.redeem_invitation(p_code text)
returns jsonb
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_email  citext;
  v_inv    public.invitations;
  v_plan   public.plans;
  v_ends   timestamptz;
  v_sub_id uuid;
begin
  if v_uid is null then
    raise exception 'Inicia sesión para canjear tu invitación.' using errcode = '42501';
  end if;
  if p_code is null or btrim(p_code) = '' then
    raise exception 'Escribe el código de tu invitación.' using errcode = '22023';
  end if;

  -- TRAMPA DE CITEXT: `btrim(p_code)` devuelve text, y `citext = text` NO usa el
  -- operador de citext (el cast text -> citext es de asignación, no implícito):
  -- PostgreSQL cae al operador de text y la comparación vuelve a distinguir
  -- mayúsculas. Por eso el cast explícito: es la diferencia entre aceptar
  -- "cedem-2026-abc" o responder "código inválido".
  select * into v_inv from public.invitations
   where code = btrim(p_code)::citext
   for update;

  if not found then
    raise exception 'Código de invitación inválido.' using errcode = '22023';
  end if;
  if v_inv.status = 'canjeada' then
    raise exception 'Esta invitación ya fue canjeada.' using errcode = '22023';
  end if;
  if v_inv.status = 'revocada' then
    raise exception 'Esta invitación fue revocada por CEDEM.' using errcode = '22023';
  end if;
  if v_inv.status = 'expirada'
     or (v_inv.expires_at is not null and v_inv.expires_at <= now()) then
    if v_inv.status <> 'expirada' then
      update public.invitations set status = 'expirada' where id = v_inv.id;
    end if;
    raise exception 'Esta invitación expiró. Escríbenos y te emitimos otra.' using errcode = '22023';
  end if;

  select p.email into v_email from public.profiles p where p.id = v_uid;
  if v_inv.email is not null and v_inv.email <> v_email then
    raise exception 'Esta invitación se emitió para otro correo (%).', v_inv.email::text
      using errcode = '42501';
  end if;

  if public.has_active_membership(v_uid) then
    raise exception 'Ya tienes una membresía activa. Escríbenos si necesitas cambiarla.'
      using errcode = '23505';
  end if;

  select * into v_plan from public.plans where id = v_inv.plan_id;

  v_ends := case when v_inv.duration_days is null then null
                 else now() + make_interval(days => v_inv.duration_days) end;

  insert into public.subscriptions (
    user_id, plan_id, status, origin, invitation_id,
    amount_cents, currency, billing_interval, auto_renew,
    started_at, current_period_start, current_period_end, ends_at,
    created_by, notes)
  values (
    v_uid, v_inv.plan_id, 'activa', 'invitacion', v_inv.id,
    0, 'MXN', 'unico', false,
    now(), now(), v_ends, v_ends,
    v_inv.issued_by, 'Alta automática por canje de invitación ' || v_inv.code::text)
  returning id into v_sub_id;

  update public.invitations
     set status           = 'canjeada',
         redeemed_by      = v_uid,
         redeemed_at      = now(),
         redemption_count = redemption_count + 1
   where id = v_inv.id;

  perform public.refresh_user_role(v_uid);

  insert into public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_table, entity_id, entity_label,
    before, after, changed_fields, ip, user_agent, severity)
  values (
    v_uid, v_email::text, public.current_user_role(), 'canje_invitacion',
    'invitations', v_inv.id::text, v_inv.code::text,
    jsonb_build_object('status', v_inv.status),
    jsonb_build_object('status', 'canjeada', 'subscription_id', v_sub_id,
                       'plan_id', v_inv.plan_id, 'ends_at', v_ends),
    array['status', 'redeemed_by', 'redeemed_at'],
    public.request_ip(), public.request_user_agent(), 'aviso');

  insert into public.access_logs (user_id, actor_email, action, entity_table, entity_id, ip)
  values (v_uid, v_email::text, 'registro', 'invitations', v_inv.id::text, public.request_ip());

  return jsonb_build_object(
    'ok', true,
    'subscription_id', v_sub_id,
    'plan_code', v_plan.code,
    'plan_name', v_plan.name,
    'ends_at', v_ends,
    'is_premium', true);
end;
$$;

comment on function public.redeem_invitation(text) is
  'Canjea una invitación: valida, crea la suscripción, marca la invitación y audita. Único camino para hacerse premium por invitación.';

-- ###########################################################################
-- 2. CAMBIO DE ROL (solo admin / super_admin, siempre auditado con motivo)
-- ###########################################################################
create or replace function public.admin_set_user_role(
  p_user   uuid,
  p_role   public.user_role,
  p_reason text default null)
returns jsonb
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_actor  public.user_role := public.current_user_role();
  v_before public.user_role;
  v_email  text;
begin
  if v_actor is null or v_actor not in ('admin', 'super_admin') then
    raise exception 'Solo admin o super_admin pueden cambiar roles.' using errcode = '42501';
  end if;
  if p_role in ('admin', 'super_admin') and v_actor <> 'super_admin' then
    raise exception 'Solo super_admin puede otorgar roles administrativos.' using errcode = '42501';
  end if;
  if p_role = 'visitante' then
    raise exception 'El rol visitante no se asigna: es el estado sin sesión.' using errcode = '22023';
  end if;
  if p_user = auth.uid() and p_role <> 'super_admin' then
    raise exception 'No puedes quitarte a ti mismo el rol administrativo.' using errcode = '42501';
  end if;

  select p.role, p.email::text into v_before, v_email
    from public.profiles p where p.id = p_user for update;
  if v_before is null then
    raise exception 'El usuario % no existe.', p_user using errcode = '23503';
  end if;
  if v_before = p_role then
    return jsonb_build_object('ok', true, 'unchanged', true, 'role', p_role);
  end if;

  -- Se salta el trigger genérico para poder firmar el cambio con su motivo.
  perform public.flag_set('cedem.role_change_ok', true);
  perform public.flag_set('cedem.skip_audit', true);
  update public.profiles set role = p_role where id = p_user;
  perform public.flag_set('cedem.skip_audit', false);
  perform public.flag_set('cedem.role_change_ok', false);

  insert into public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_table, entity_id, entity_label,
    before, after, changed_fields, ip, user_agent, severity)
  values (
    auth.uid(), v_email, v_actor, 'cambio_rol', 'profiles', p_user::text, v_email,
    jsonb_build_object('role', v_before),
    jsonb_build_object('role', p_role, 'reason', p_reason),
    array['role'], public.request_ip(), public.request_user_agent(), 'aviso');

  return jsonb_build_object('ok', true, 'role', p_role, 'previous_role', v_before);
end;
$$;

comment on function public.admin_set_user_role(uuid, public.user_role, text) is
  'Cambia el rol de un usuario. Solo super_admin puede otorgar admin/super_admin. Siempre deja registro con motivo.';

-- ###########################################################################
-- 3. ALTA MANUAL DE MEMBRESÍA (cortesía, acuerdo comercial, extensión)
-- ###########################################################################
create or replace function public.admin_grant_subscription(
  p_user    uuid,
  p_plan_id uuid,
  p_days    integer default 365,
  p_reason  text default null)
returns jsonb
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_actor public.user_role := public.current_user_role();
  v_sub   public.subscriptions;
  v_ends  timestamptz;
  v_id    uuid;
begin
  if v_actor is null or v_actor not in ('admin', 'super_admin') then
    raise exception 'Solo admin o super_admin pueden otorgar membresías.' using errcode = '42501';
  end if;
  if p_days is null or p_days <= 0 then
    raise exception 'Los días de vigencia deben ser mayores a cero.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.plans pl where pl.id = p_plan_id) then
    raise exception 'El plan % no existe.', p_plan_id using errcode = '23503';
  end if;

  select * into v_sub from public.subscriptions s
   where s.user_id = p_user and s.status in ('activa', 'en_prueba')
   for update;

  if found then
    -- Extiende la vigencia en lugar de crear una segunda membresía
    -- (el índice único parcial lo impediría de todos modos).
    v_ends := greatest(coalesce(v_sub.ends_at, now()), now()) + make_interval(days => p_days);
    perform public.flag_set('cedem.skip_audit', true);
    update public.subscriptions
       set ends_at = v_ends, current_period_end = v_ends, auto_renew = false
     where id = v_sub.id;
    perform public.flag_set('cedem.skip_audit', false);
    v_id := v_sub.id;
  else
    v_ends := now() + make_interval(days => p_days);
    insert into public.subscriptions (
      user_id, plan_id, status, origin, amount_cents, currency, billing_interval,
      auto_renew, started_at, current_period_start, current_period_end, ends_at,
      created_by, notes)
    values (
      p_user, p_plan_id, 'activa', 'manual', 0, 'MXN', 'unico',
      false, now(), now(), v_ends, v_ends,
      auth.uid(), coalesce(p_reason, 'Alta manual del staff'))
    returning id into v_id;
  end if;

  perform public.refresh_user_role(p_user);

  insert into public.audit_logs (
    actor_id, actor_role, action, entity_table, entity_id, after, severity)
  values (auth.uid(), v_actor, 'update', 'subscriptions', v_id::text,
          jsonb_build_object('user_id', p_user, 'plan_id', p_plan_id,
                             'ends_at', v_ends, 'reason', p_reason), 'aviso');

  return jsonb_build_object('ok', true, 'subscription_id', v_id, 'ends_at', v_ends);
end;
$$;

-- ###########################################################################
-- 4. CONTADOR DE VISTAS + REGISTRO DE LECTURA
--    El incremento de views no puede hacerse desde el cliente (no tiene UPDATE
--    sobre contents) y la lectura premium tiene que quedar registrada.
-- ###########################################################################
create or replace function public.register_content_view(p_content_id uuid)
returns integer
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_visibility public.content_visibility;
  v_type       public.content_type;
  v_views      integer;
begin
  select c.visibility, c.content_type into v_visibility, v_type
    from public.contents c
   where c.id = p_content_id
     and public.can_view_content(c.id);

  if v_visibility is null then
    raise exception 'Contenido no disponible.' using errcode = '42501';
  end if;

  perform public.flag_set('cedem.skip_audit', true);
  update public.contents
     set view_count = view_count + 1
   where id = p_content_id
  returning view_count into v_views;
  perform public.flag_set('cedem.skip_audit', false);

  insert into public.access_logs (
    user_id, actor_email, action, entity_table, entity_id, content_type, ip, user_agent)
  values (
    auth.uid(),
    (select p.email::text from public.profiles p where p.id = auth.uid()),
    case when v_visibility = 'premium' and public.can_read_body(p_content_id)
         then 'lectura_premium'::public.access_action
         else 'vista_contenido'::public.access_action end,
    'contents', p_content_id::text, v_type,
    public.request_ip(), public.request_user_agent());

  return v_views;
end;
$$;

comment on function public.register_content_view(uuid) is
  'Suma una vista y registra el acceso (lectura_premium si el cuerpo es premium). Se llama desde el servidor al renderizar.';

-- ###########################################################################
-- 5. INSCRIPCIÓN A EVENTO (con cupo y lista de espera, en una transacción)
-- ###########################################################################
create or replace function public.register_for_event(
  p_content_id uuid,
  p_full_name  text,
  p_email      citext,
  p_phone      text default null,
  p_company    text default null,
  p_job_title  text default null,
  p_notes      text default null,
  p_source     text default null)
returns jsonb
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_content   public.contents;
  v_event     public.events;
  v_existing  public.event_registrations;
  v_confirmed integer;
  v_status    public.registration_status;
  v_reg_id    uuid;
begin
  select * into v_content from public.contents c where c.id = p_content_id;
  if not found or v_content.content_type <> 'evento' then
    raise exception 'El evento no existe.' using errcode = '22023';
  end if;
  if not public.is_content_live(v_content.status, v_content.published_at, v_content.scheduled_for) then
    raise exception 'Este evento todavía no está abierto.' using errcode = '22023';
  end if;

  -- Bloquea la fila del evento: dos inscripciones simultáneas no pueden pasar
  -- del cupo por una condición de carrera.
  select * into v_event from public.events e where e.content_id = p_content_id for update;
  if not v_event.is_registration_open then
    raise exception 'Las inscripciones de este evento están cerradas.' using errcode = '22023';
  end if;
  if v_event.registration_closes_at is not null and v_event.registration_closes_at <= now() then
    raise exception 'El periodo de inscripción terminó.' using errcode = '22023';
  end if;

  p_full_name := btrim(coalesce(p_full_name, ''));
  if char_length(p_full_name) < 3 then
    raise exception 'Escribe tu nombre completo.' using errcode = '22023';
  end if;
  if p_email is null or p_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Escribe un correo válido.' using errcode = '22023';
  end if;

  -- Cast explícito por la trampa de citext (ver redeem_invitation): sin él,
  -- "Ana@Test.mx" no encontraría la inscripción de "ana@test.mx" y en su lugar
  -- saltaría la restricción UNIQUE con un error feo.
  select * into v_existing from public.event_registrations r
   where r.content_id = p_content_id and r.email = btrim(p_email)::citext;

  if found and v_existing.status <> 'cancelada' then
    return jsonb_build_object('ok', true, 'already_registered', true,
                              'registration_id', v_existing.id,
                              'status', v_existing.status);
  end if;

  if found then
    update public.event_registrations
       set status = 'confirmada', cancelled_at = null, confirmed_at = now(),
           full_name = p_full_name, phone = p_phone, company = p_company,
           job_title = p_job_title, notes = p_notes, source = p_source,
           ip = public.request_ip(), user_agent = public.request_user_agent()
     where id = v_existing.id
    returning id into v_reg_id;
    v_status := 'confirmada';
  else
    select count(*) into v_confirmed
      from public.event_registrations r
     where r.content_id = p_content_id and r.status in ('confirmada', 'asistio');

    if v_event.capacity is not null and v_confirmed >= v_event.capacity then
      if not v_event.allow_waitlist then
        raise exception 'El evento está lleno.' using errcode = '22023';
      end if;
      v_status := 'lista_espera';
    else
      v_status := 'confirmada';
    end if;

    insert into public.event_registrations (
      content_id, user_id, full_name, email, phone, company, job_title,
      status, notes, source, ip, user_agent, confirmed_at)
    values (
      p_content_id, auth.uid(), p_full_name, btrim(p_email), p_phone, p_company, p_job_title,
      v_status, p_notes, p_source, public.request_ip(), public.request_user_agent(),
      case when v_status = 'confirmada' then now() end)
    returning id into v_reg_id;
  end if;

  insert into public.access_logs (
    user_id, actor_email, action, entity_table, entity_id, content_type, ip)
  values (auth.uid(), btrim(p_email)::text, 'inscripcion_evento', 'contents',
          p_content_id::text, 'evento', public.request_ip());

  return jsonb_build_object(
    'ok', true,
    'registration_id', v_reg_id,
    'status', v_status,
    'waitlist_position', case when v_status = 'lista_espera'
                              then greatest(1, v_confirmed - coalesce(v_event.capacity, 0) + 1)
                         end);
end;
$$;

comment on function public.register_for_event(uuid, text, citext, text, text, text, text, text) is
  'Inscripción a evento con control de cupo y lista de espera. Único camino de escritura en event_registrations.';

-- ###########################################################################
-- 6. LECTURA DE CONTENIDO Y DESCARGAS
-- ###########################################################################
create or replace function public.get_content(
  p_slug text,
  p_type public.content_type default 'articulo')
returns setof public.v_contents_for_viewer
language sql stable
set search_path = public, extensions, pg_temp
as $$
  select * from public.v_contents_for_viewer
   where slug = p_slug
     and content_type = p_type
   limit 1
$$;

comment on function public.get_content(text, public.content_type) is
  'Devuelve la ficha de un contenido por slug: cuerpo completo o primer párrafo según el solicitante.';

-- La ruta del archivo no se sirve en la vista: se entrega por aquí y solo a
-- quien tiene derecho. El servidor genera después la URL firmada de Storage.
create or replace function public.get_download_path(p_content_id uuid)
returns text
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_path text;
begin
  if not public.can_read_body(p_content_id) then
    raise exception 'Necesitas una membresía activa para descargar este material.'
      using errcode = '42501';
  end if;

  select coalesce(d.file_path, s.download_path)
    into v_path
    from public.contents c
    left join public.documents d       on d.content_id = c.id
    left join public.content_secrets s on s.content_id = c.id
   where c.id = p_content_id;

  if v_path is null then
    raise exception 'Este contenido no tiene archivo descargable.' using errcode = '22023';
  end if;

  insert into public.access_logs (
    user_id, actor_email, action, entity_table, entity_id, content_type, ip)
  values (auth.uid(),
          (select p.email::text from public.profiles p where p.id = auth.uid()),
          'descarga', 'contents', p_content_id::text, 'documento', public.request_ip());

  return v_path;
end;
$$;

create or replace function public.get_my_membership()
returns jsonb
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select coalesce(
    (select jsonb_build_object(
              'is_premium', public.is_premium_viewer(),
              'role',       public.current_user_role(),
              'status',     s.status,
              'origin',     s.origin,
              'plan_code',  pl.code,
              'plan_name',  pl.name,
              'started_at', s.started_at,
              'ends_at',    s.ends_at,
              'auto_renew', s.auto_renew,
              'days_left',  case when s.ends_at is null then null
                                 else greatest(0, ceil(extract(epoch from (s.ends_at - now())) / 86400))::int
                            end)
       from public.subscriptions s
       join public.plans pl on pl.id = s.plan_id
      where s.user_id = auth.uid()
        and s.status in ('activa', 'en_prueba')
      limit 1),
    jsonb_build_object('is_premium', public.is_premium_viewer(),
                       'role', public.current_user_role(),
                       'status', null));
$$;

-- ###########################################################################
-- 7. REGISTRO DE ACCESOS Y EMBUDO
--    Se expone a `authenticated` (no a `anon`): el embudo de visitantes se
--    registra desde el servidor con el service_role, para que un visitante no
--    pueda inflar la tabla de accesos llamando al RPC en bucle.
-- ###########################################################################
create or replace function public.log_access(
  p_action             public.access_action,
  p_entity_table       text default null,
  p_entity_id          text default null,
  p_content_type       public.content_type default null,
  p_path               text default null,
  p_utm                jsonb default '{}'::jsonb,
  p_duration_ms        integer default null,
  p_journey_session_id uuid default null)
returns void
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
begin
  insert into public.access_logs (
    user_id, actor_email, action, entity_table, entity_id, content_type,
    path, referrer, utm, ip, user_agent, duration_ms, journey_session_id)
  values (
    auth.uid(),
    (select p.email::text from public.profiles p where p.id = auth.uid()),
    p_action, p_entity_table, p_entity_id, p_content_type,
    p_path, public.request_headers() ->> 'referer', coalesce(p_utm, '{}'::jsonb),
    public.request_ip(), public.request_user_agent(), p_duration_ms, p_journey_session_id);
end;
$$;

-- ###########################################################################
-- 8. MANTENIMIENTO DIARIO
--    Vence suscripciones e invitaciones y resincroniza roles. Se ejecuta con
--    pg_cron (create extension) o con Vercel Cron llamando a este RPC con el
--    service_role. Es idempotente: correrlo dos veces no cambia nada.
-- ###########################################################################
create or replace function public.job_expire_subscriptions()
returns jsonb
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_sub  record;
  v_subs integer := 0;
  v_inv  integer := 0;
begin
  for v_sub in
    select s.id, s.user_id
      from public.subscriptions s
     where s.status in ('activa', 'en_prueba', 'impaga')
       and s.ends_at is not null
       and s.ends_at <= now()
     for update
  loop
    perform public.flag_set('cedem.skip_audit', true);
    update public.subscriptions
       set status = 'vencida', auto_renew = false
     where id = v_sub.id;
    perform public.flag_set('cedem.skip_audit', false);

    perform public.refresh_user_role(v_sub.user_id);

    insert into public.audit_logs (
      action, entity_table, entity_id, after, actor_email, actor_role, severity)
    values ('update', 'subscriptions', v_sub.id::text,
            jsonb_build_object('status', 'vencida', 'reason', 'job_expire_subscriptions'),
            'sistema', null, 'info');
    v_subs := v_subs + 1;
  end loop;

  update public.invitations
     set status = 'expirada'
   where status = 'pendiente'
     and expires_at is not null
     and expires_at <= now();
  get diagnostics v_inv = row_count;

  return jsonb_build_object('ok', true,
                            'subscriptions_expired', v_subs,
                            'invitations_expired', v_inv,
                            'ran_at', now());
end;
$$;

comment on function public.job_expire_subscriptions() is
  'Job diario idempotente: vence suscripciones e invitaciones y resincroniza roles. Ejecutar con pg_cron o Vercel Cron.';
