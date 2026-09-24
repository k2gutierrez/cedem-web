-- Migración 6 — Membresías, planes, invitaciones y pagos
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101120600_06_membresias.sql
-- Planes, precios, invitaciones, suscripciones y pagos.
-- El premium se obtiene por PAGO o por INVITACIÓN, pero se comprueba en un solo
-- lugar: `has_active_membership()`. El canje de una invitación crea una
-- suscripción con origin = 'invitacion', de modo que no hay dos caminos
-- paralelos de autorización ni dos formas de que algo se quede sin vencer.
-- =============================================================================

set search_path = public, extensions;

create table public.plans (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,               -- 'premium-anual', 'circulo-de-duenos'
  name                text not null,
  description         text,
  tier                public.plan_tier not null default 'premium',
  target_segment      public.client_segment,              -- consulting | pce | null = cualquiera
  features            jsonb not null default '[]'::jsonb, -- ["Biblioteca completa","Eventos",...]
  is_public           boolean not null default false,     -- ¿aparece en la página de precios?
  is_active           boolean not null default true,
  trial_days          smallint not null default 0,
  requires_invitation boolean not null default false,     -- plan que solo se otorga por invitación
  sort_order          integer not null default 100,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint plans_code_format     check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint plans_features_array  check (jsonb_typeof(features) = 'array'),
  constraint plans_trial_valid     check (trial_days between 0 and 365)
);

comment on table public.plans is
  'Planes de membresía. Los importes NO viven aquí sino en plan_prices (multimoneda y periodicidad).';

-- ---------------------------------------------------------------------------
-- plan_prices: un plan puede venderse en MXN y en USD, mensual o anual.
-- Guardar el precio en tabla aparte evita duplicar el plan por moneda y permite
-- cambiar el precio sin reescribir el historial (las suscripciones guardan su
-- propia instantánea de importe).
-- ---------------------------------------------------------------------------
create table public.plan_prices (
  id                    uuid primary key default gen_random_uuid(),
  plan_id               uuid not null references public.plans(id) on delete cascade,
  currency              char(3) not null,
  amount_cents          bigint not null,
  billing_interval      public.billing_interval not null default 'mensual',
  interval_count        smallint not null default 1,
  is_active             boolean not null default true,
  is_default            boolean not null default false,
  provider              public.payment_provider,
  provider_price_id     text,                             -- price_... de Stripe / id de plan de la pasarela
  external_checkout_url text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint plan_prices_unique_variant unique (plan_id, currency, billing_interval, interval_count),
  constraint plan_prices_amount_valid   check (amount_cents >= 0),
  constraint plan_prices_currency_fmt   check (currency ~ '^[A-Z]{3}$'),
  constraint plan_prices_interval_valid check (interval_count > 0)
);

comment on table public.plan_prices is
  'Precios por plan, moneda y periodicidad. Importes en centavos (bigint) para no arrastrar errores de redondeo.';

-- ---------------------------------------------------------------------------
-- invitations: la vía de entrada de los clientes actuales de la firma.
-- `email` NULL = invitación abierta (cualquiera con el código); con correo, solo
-- esa cuenta puede canjearla. `duration_days` NULL = membresía sin vencimiento.
-- Nadie las escribe desde el cliente: se crean por panel admin (RLS) y se canjean
-- por el RPC redeem_invitation().
-- ---------------------------------------------------------------------------
create table public.invitations (
  id               uuid primary key default gen_random_uuid(),
  code             citext not null unique,                -- CITEXT: el canje no distingue mayúsculas
  email            citext,
  client_id        uuid references public.clients(id) on delete set null,
  plan_id          uuid not null references public.plans(id) on delete restrict,
  issued_by        uuid not null references public.profiles(id) on delete restrict,
  status           public.invitation_status not null default 'pendiente',
  duration_days    integer,                               -- NULL = sin vencimiento
  max_redemptions  smallint not null default 1,
  redemption_count smallint not null default 0,
  expires_at       timestamptz,
  redeemed_by      uuid references public.profiles(id) on delete set null,
  redeemed_at      timestamptz,
  revoked_by       uuid references public.profiles(id) on delete set null,
  revoked_at       timestamptz,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint invitations_code_format   check (code ~ '^[A-Z0-9][A-Z0-9-]{5,31}$'),
  constraint invitations_email_format  check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint invitations_expiry_valid  check (expires_at is null or expires_at > created_at),
  constraint invitations_duration      check (duration_days is null or duration_days > 0),
  constraint invitations_max_valid     check (max_redemptions between 1 and 100),
  constraint invitations_count_valid   check (redemption_count between 0 and max_redemptions),
  constraint invitations_redeemed_meta check (status <> 'canjeada'
                                               or (redeemed_by is not null and redeemed_at is not null)),
  constraint invitations_revoked_meta  check (status <> 'revocada' or revoked_at is not null)
);

comment on table public.invitations is
  'Invitaciones de cliente existente. Se emiten desde el panel admin y se canjean por el RPC redeem_invitation().';

create table public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  plan_id                  uuid not null references public.plans(id) on delete restrict,
  plan_price_id            uuid references public.plan_prices(id) on delete set null,
  status                   public.subscription_status not null default 'activa',
  origin                   public.subscription_origin not null default 'pago',
  invitation_id            uuid references public.invitations(id) on delete set null,

  -- pasarela
  provider                 public.payment_provider,
  external_customer_id     text,
  external_subscription_id text,

  -- instantánea del precio contratado: si el precio sube mañana, el historial no miente
  amount_cents             bigint,
  currency                 char(3),
  billing_interval         public.billing_interval,
  auto_renew               boolean not null default true,

  started_at               timestamptz not null default now(),
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  ends_at                  timestamptz,                   -- NULL = sin vencimiento
  trial_ends_at            timestamptz,
  cancelled_at             timestamptz,
  cancelled_reason         text,
  created_by               uuid references public.profiles(id) on delete set null,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint subscriptions_dates_valid  check (ends_at is null or ends_at > started_at),
  constraint subscriptions_amount_valid check (amount_cents is null or amount_cents >= 0),
  constraint subscriptions_currency_fmt check (currency is null or currency ~ '^[A-Z]{3}$'),
  constraint subscriptions_cancelled    check (status <> 'cancelada' or cancelled_at is not null),
  constraint subscriptions_invitation   check (origin <> 'invitacion' or invitation_id is not null),
  constraint subscriptions_trial_valid  check (trial_ends_at is null or trial_ends_at > started_at)
);

-- Una sola membresía vigente por usuario. Es la garantía de que "premium" sea
-- un estado sin ambigüedad; si alguien con membresía activa canjea una
-- invitación, el RPC responde con un mensaje claro (no un error de índice).
create unique index subscriptions_one_active_per_user
  on public.subscriptions (user_id)
  where status in ('activa', 'en_prueba');

comment on table public.subscriptions is
  'Membresías. Solo puede haber una activa o en prueba por usuario (índice único parcial).';

create table public.payments (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid references public.subscriptions(id) on delete set null,
  user_id          uuid not null references public.profiles(id) on delete restrict,
  amount_cents     bigint not null,
  currency         char(3) not null,
  status           public.payment_status not null default 'pendiente',
  provider         public.payment_provider not null default 'otro',
  external_id      text,                                  -- id del cargo en la pasarela
  external_reference text,
  paid_at          timestamptz,
  period_start     timestamptz,
  period_end       timestamptz,
  failure_reason   text,
  refunded_at      timestamptz,
  invoice_url      text,
  receipt_url      text,
  raw_payload      jsonb,                                 -- se excluye de la auditoría (audit_redact)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint payments_unique_external  unique (provider, external_id),
  constraint payments_amount_valid     check (amount_cents >= 0),
  constraint payments_currency_fmt     check (currency ~ '^[A-Z]{3}$'),
  constraint payments_paid_meta        check (status <> 'pagado' or paid_at is not null),
  constraint payments_refunded_meta    check (status <> 'reembolsado' or refunded_at is not null),
  constraint payments_period_valid     check (period_end is null or period_start is null or period_end > period_start)
);

comment on table public.payments is
  'Historial de pagos. La restricción unique (provider, external_id) evita procesar dos veces el mismo webhook.';
