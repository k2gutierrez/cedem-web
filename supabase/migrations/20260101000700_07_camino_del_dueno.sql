-- Migración 7 — Camino del Dueño
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101120700_07_camino.sql
-- Aplicativo de autodiagnóstico. Todo se registra para que el agente de IA y el
-- staff puedan dar seguimiento: sesiones, respuestas, resultados, recomendaciones,
-- conversaciones y notas libres.
--
-- El contenido de los segmentos NO se inventa aquí: los 3 segmentos son los tres
-- verbos verificados de CEDEM (Generar / Multiplicar / Capturar) y sus 9
-- componentes. Las preguntas son datos semilla editables por el admin.
-- =============================================================================

set search_path = public, extensions;

create table public.journey_segments (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,                    -- 'generar' | 'multiplicar' | 'capturar'
  title          text not null,                           -- 'Generar valor'
  subtitle       text,
  cedem_concept  text,                                    -- 'Enfoque Competitivo'
  description_md text,
  color_hex      text,
  icon           text,
  sort_order     integer not null default 100,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint journey_segments_code_format check (code ~ '^[a-z0-9_-]+$'),
  constraint journey_segments_color       check (color_hex is null or color_hex ~* '^#[0-9a-f]{6}$')
);

comment on table public.journey_segments is
  'Segmentos del recorrido. Semilla verificada: Generar (Enfoque Competitivo), Multiplicar (Sinergia Organizacional), Capturar (Alineación Estratégica).';

create table public.journey_questions (
  id          uuid primary key default gen_random_uuid(),
  segment_id  uuid not null references public.journey_segments(id) on delete cascade,
  code        text not null,
  prompt      text not null,
  help_text   text,
  kind        public.question_kind not null default 'escala',
  options     jsonb not null default '[]'::jsonb,          -- [{"value":1,"label":"Nada"},...]
  dimension   text,                                        -- fertilidad | gobierno | alineacion | ...
  weight      numeric(5,2) not null default 1,
  is_required boolean not null default true,
  is_active   boolean not null default true,
  sort_order  integer not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint journey_questions_unique_code unique (segment_id, code),
  constraint journey_questions_options     check (jsonb_typeof(options) = 'array'),
  constraint journey_questions_weight      check (weight > 0),
  constraint journey_questions_choice_opts check (
    kind not in ('opcion_unica', 'opcion_multiple') or jsonb_array_length(options) > 0)
);

create table public.journey_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  status            public.journey_session_status not null default 'en_progreso',
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  last_activity_at  timestamptz not null default now(),
  current_segment_id uuid references public.journey_segments(id) on delete set null,
  answered_count    integer not null default 0,
  total_questions   integer,
  duration_seconds  integer,
  score_total       numeric(6,2),
  segment_scores    jsonb not null default '{}'::jsonb,
  profile_label     text,                                  -- etiqueta del motor determinista
  engine_version    text default 'v1',
  ai_summary_md     text,                                  -- resumen del agente (si la IA respondió)
  device            text,
  source            text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint journey_sessions_completed_meta check (completed_at is null or completed_at >= started_at),
  constraint journey_sessions_answered_valid check (answered_count >= 0),
  constraint journey_sessions_duration_valid check (duration_seconds is null or duration_seconds >= 0)
);

-- Reanudar, no reiniciar: una sola sesión abierta por usuario. Es lo que pide el
-- plan maestro ("el recorrido se puede reanudar") y evita sesiones huérfanas.
create unique index journey_sessions_one_open_per_user
  on public.journey_sessions (user_id)
  where status = 'en_progreso';

comment on table public.journey_sessions is
  'Sesiones del recorrido. Máximo una en progreso por usuario (índice único parcial).';

create table public.journey_answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.journey_sessions(id) on delete cascade,
  question_id   uuid not null references public.journey_questions(id) on delete restrict,
  segment_id    uuid references public.journey_segments(id) on delete set null,  -- desnormalizado para reportes
  value         jsonb not null,                            -- 3 | ["a","b"] | "texto libre"
  numeric_value numeric(6,2),                              -- normalizado 0-100 para puntuar
  answered_at   timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint journey_answers_unique unique (session_id, question_id),
  constraint journey_answers_numeric check (numeric_value is null or numeric_value between 0 and 100)
);

create table public.journey_results (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.journey_sessions(id) on delete cascade,
  dimension      text not null,                            -- fertilidad, gobierno, alineacion...
  segment_code   text,                                     -- generar | multiplicar | capturar
  score          numeric(5,2) not null,
  level          public.journey_level not null,
  diagnosis_md   text,
  priority       smallint not null default 100,
  is_primary     boolean not null default false,           -- el hallazgo principal del recorrido
  computed_at    timestamptz not null default now(),
  engine_version text not null default 'v1',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint journey_results_unique  unique (session_id, dimension),
  constraint journey_results_score   check (score between 0 and 100),
  constraint journey_results_dims    check (char_length(dimension) between 2 and 60)
);

comment on table public.journey_results is
  'Resultado calculado por dimensión. Lo escribe el motor de puntuación (servidor), nunca el navegador.';

create table public.journey_recommendations (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.journey_sessions(id) on delete cascade,
  content_id     uuid not null references public.contents(id) on delete cascade,
  rank           smallint not null default 1,
  match_score    numeric(5,2),
  reason_md      text,                                     -- por qué se recomienda (lo redacta la IA)
  source         public.recommendation_source not null default 'ia',
  model          text,
  prompt_version text,
  is_helpful     boolean,                                  -- feedback del usuario: alimenta el motor
  seen_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint journey_recommendations_unique unique (session_id, content_id),
  constraint journey_recommendations_rank   check (rank > 0),
  constraint journey_recommendations_score  check (match_score is null or match_score between 0 and 100)
);

create table public.ai_conversations (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references public.journey_sessions(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete set null,
  role          public.ai_role not null,
  content       text not null,
  turn          integer,
  model         text,
  tokens_in     integer,
  tokens_out    integer,
  latency_ms    integer,
  finish_reason text,
  metadata      jsonb not null default '{}'::jsonb,
  is_flagged    boolean not null default false,            -- revisión manual de una respuesta
  created_at    timestamptz not null default now(),
  constraint ai_conversations_content_len check (char_length(content) between 1 and 20000),
  constraint ai_conversations_tokens      check ((tokens_in is null or tokens_in >= 0)
                                             and (tokens_out is null or tokens_out >= 0)),
  constraint ai_conversations_turn        check (turn is null or turn >= 0)
);

comment on table public.ai_conversations is
  'Turnos de conversación con el agente. Append-only: sin policy de UPDATE ni DELETE. Ver retención en §8.';

create table public.journey_notes (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid references public.journey_sessions(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  is_private boolean not null default true,                -- true = solo el usuario
  is_pinned  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journey_notes_body_len check (char_length(body) between 1 and 4000)
);

comment on table public.journey_notes is
  'Comentarios libres del usuario para seguimiento. is_private = true limita la lectura al dueño.';
