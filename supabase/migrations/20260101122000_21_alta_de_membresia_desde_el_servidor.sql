-- Migración 21 — Alta de membresía desde el servidor (para la pasarela de pago)
--
-- POR QUÉ EXISTE
--
-- `admin_grant_subscription()` activa una membresía, pero exige que quien la llame
-- sea admin o super_admin: comprueba `current_user_role()`, que sale de la sesión
-- del usuario. El webhook de Stripe no tiene sesión de nadie —llega del servidor
-- de Stripe, no de una persona— así que esa función no le sirve.
--
-- Y no es cuestión de relajar la comprobación de rol: sería abrir la puerta a que
-- cualquiera con una sesión se regalara membresías. La frontera correcta aquí no
-- es «qué rol tiene» sino «desde dónde se llama»: esta función se ejecuta
-- únicamente con la llave de servicio, y esa llave nunca sale del servidor.
--
-- CÓMO SE PROTEGE
--
--   1. Es SECURITY DEFINER y no comprueba rol.
--   2. Se le REVOCA el permiso de ejecución a `anon` y a `authenticated`: un
--      usuario con sesión recibe «permission denied for function», aunque conozca
--      su nombre. Solo `service_role` (y el propio dueño de la base) puede llamarla.
--   3. Deja registro en `audit_logs` con actor `sistema`, para que en la auditoría
--      se vea que el alta vino de la pasarela y no de una persona.

create or replace function public.service_grant_subscription(
  p_user       uuid,
  p_plan_id    uuid,
  p_days       integer,
  p_payment_id uuid default null,
  p_reason     text default null)
returns jsonb
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_sub   public.subscriptions;
  v_ends  timestamptz;
  v_id    uuid;
  v_pago  public.payments;
begin
  if p_days is null or p_days <= 0 then
    raise exception 'Los días de vigencia deben ser mayores a cero.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.plans pl where pl.id = p_plan_id) then
    raise exception 'El plan % no existe.', p_plan_id using errcode = '23503';
  end if;

  if not exists (select 1 from public.profiles pr where pr.id = p_user) then
    raise exception 'El usuario % no existe.', p_user using errcode = '23503';
  end if;

  select * into v_sub from public.subscriptions s
   where s.user_id = p_user and s.status in ('activa', 'en_prueba')
   for update;

  if found then
    -- Extiende la vigencia en lugar de crear una segunda membresía: es lo que
    -- espera quien renueva, y el índice único parcial lo impediría de todos modos.
    v_ends := greatest(coalesce(v_sub.ends_at, now()), now()) + make_interval(days => p_days);
    perform public.flag_set('cedem.skip_audit', true);
    update public.subscriptions
       set ends_at = v_ends,
           current_period_end = v_ends,
           auto_renew = true
     where id = v_sub.id;
    perform public.flag_set('cedem.skip_audit', false);
    v_id := v_sub.id;
  else
    v_ends := now() + make_interval(days => p_days);
    insert into public.subscriptions (
      user_id, plan_id, status, origin, amount_cents, currency, billing_interval,
      auto_renew, started_at, current_period_start, current_period_end, ends_at,
      notes)
    values (
      p_user, p_plan_id, 'activa', 'pago', 0, 'MXN', 'unico',
      true, now(), now(), v_ends, v_ends,
      coalesce(p_reason, 'Alta automática por pago confirmado'))
    returning id into v_id;
  end if;

  perform public.refresh_user_role(p_user);

  -- El pago queda ligado a la membresía que acaba de activar.
  if p_payment_id is not null then
    select * into v_pago from public.payments where id = p_payment_id;
    if found then
      perform public.flag_set('cedem.skip_audit', true);
      update public.payments
         set subscription_id = v_id,
             status = 'pagado',
             paid_at = coalesce(paid_at, now()),
             period_start = coalesce(period_start, now()),
             period_end = coalesce(period_end, v_ends)
       where id = p_payment_id;
      perform public.flag_set('cedem.skip_audit', false);
    end if;
  end if;

  insert into public.audit_logs (
    actor_role, action, entity_table, entity_id, actor_email, after, severity)
  values (
    null, 'update', 'subscriptions', v_id::text, 'sistema (pasarela)',
    jsonb_build_object(
      'user_id', p_user, 'plan_id', p_plan_id, 'ends_at', v_ends,
      'payment_id', p_payment_id, 'reason', coalesce(p_reason, 'pago confirmado')),
    'aviso');

  return jsonb_build_object('ok', true, 'subscription_id', v_id, 'ends_at', v_ends);
end;
$$;

comment on function public.service_grant_subscription(uuid, uuid, integer, uuid, text) is
  'Activa o extiende una membresía desde el servidor (webhook de la pasarela). Solo service_role puede ejecutarla.';

-- La puerta cerrada: ni `anon` ni `authenticated` pueden llamarla, aunque la
-- conozcan. La comprobación de rol no serviría aquí porque no hay usuario.
revoke execute on function public.service_grant_subscription(uuid, uuid, integer, uuid, text)
  from public, anon, authenticated;

grant execute on function public.service_grant_subscription(uuid, uuid, integer, uuid, text)
  to service_role;

-- Comprobación posterior (como consulta, no como bloque ejecutable):
--
--   select has_function_privilege('authenticated',
--            'public.service_grant_subscription(uuid,uuid,integer,uuid,text)', 'EXECUTE');  -- false
--   select has_function_privilege('service_role',
--            'public.service_grant_subscription(uuid,uuid,integer,uuid,text)', 'EXECUTE');  -- true
