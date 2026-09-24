-- Migración 23 — Cola de correos
--
-- POR QUÉ EXISTE
--
-- La plataforma **no enviaba ningún correo**. No es que fallara el envío: no había
-- ninguna pieza que enviara. El dueño terminaba el Camino, dejaba su correo, se le
-- creaba la cuenta... y nunca recibía nada. Ni su lectura, ni la confirmación de
-- que tenía cuenta, ni la forma de volver.
--
-- Ese es el activo más valioso del Camino: el correo de un dueño que acaba de
-- contar cómo está su empresa. Guardarlo y no escribirle es dejar el trabajo a
-- medias.
--
-- CÓMO SE RESUELVE SIN PROVEEDOR TODAVÍA
--
-- Configurar el envío (Google Workspace, Resend) lleva unos días de trámite. Para
-- que esos correos no se pierdan mientras tanto, todos pasan por aquí primero:
--
--   · Con proveedor configurado → se envía y queda registrado como enviado.
--   · Sin proveedor → queda en `pendiente`, visible en el panel, con el texto listo
--     para copiarlo y mandarlo desde el correo del equipo.
--
-- Así el día que se configure el envío no hay que recuperar nada: lo pendiente se
-- puede reenviar de golpe, y lo que ya salió a mano queda con su marca.
--
-- POR QUÉ GUARDAR EL CUERPO Y NO SOLO EL AVISO
--
-- Porque el correo es el mensaje: si solo se guardara «avisar a X», al ir a
-- mandarlo a mano habría que reconstruir el texto. Guardado entero, el equipo lo
-- copia y lo envía sin interpretar nada.

create table public.email_outbox (
  id            uuid primary key default gen_random_uuid(),
  para          citext not null,
  asunto        text not null,
  cuerpo_html   text not null,
  cuerpo_texto  text,                                    -- versión sin formato, para copiar a mano

  -- Para qué es. No es decorativo: decide qué correos se pueden reenviar solos
  -- cuando se configure el proveedor y cuáles ya no tiene sentido mandar.
  tipo          text not null default 'aviso',
  estado        text not null default 'pendiente',
  intentos      smallint not null default 0,
  error         text,
  enviado_at    timestamptz,
  enviado_por   text,                                    -- 'proveedor' o el correo de quien lo mandó a mano

  -- De qué va el correo, para poder rastrearlo (un diagnóstico, una invitación…).
  entity_table  text,
  entity_id     text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint email_outbox_tipo_valido check (
    tipo in ('camino', 'acceso', 'aviso-equipo', 'invitacion', 'membresia', 'aviso')
  ),
  constraint email_outbox_estado_valido check (
    estado in ('pendiente', 'enviado', 'fallido', 'descartado')
  ),
  constraint email_outbox_asunto_len check (char_length(asunto) between 3 and 200),
  constraint email_outbox_correo_fmt  check (para ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint email_outbox_enviado_meta check (estado <> 'enviado' or enviado_at is not null)
);

comment on table public.email_outbox is
  'Todo correo que la plataforma quiere mandar. Con proveedor se envía; sin él queda pendiente para mandarlo a mano.';

create index email_outbox_pendientes_idx on public.email_outbox (created_at desc)
  where estado = 'pendiente';

alter table public.email_outbox enable row level security;

-- Solo el equipo lo lee. Escribe el servidor (service_role) o un RPC definer: un
-- usuario no tiene por qué poder fabricar un correo a nombre de CEDEM.
create policy email_outbox_select_admin on public.email_outbox
  for select to authenticated
  using (public.is_admin());

create policy email_outbox_admin_all on public.email_outbox
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Y el disparador de siempre, para que updated_at no dependa de nadie.
create trigger trg_email_outbox_updated_at
  before update on public.email_outbox
  for each row execute function public.set_updated_at();

create trigger trg_email_outbox_audit
  after insert or update or delete on public.email_outbox
  for each row execute function public.audit_row_change();

-- Comprobación posterior:
--   select estado, count(*) from public.email_outbox group by estado;
