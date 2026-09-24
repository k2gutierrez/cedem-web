-- Migración 2 — Funciones puras (sin dependencia de tablas)
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101120200_02_helpers.sql
-- Funciones que no dependen de ninguna tabla. Se crean antes que las tablas
-- porque éstas las usan en CHECK, en columnas y en triggers.
-- =============================================================================

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- first_paragraph(): el "primer párrafo" del markdown, que es lo único que un
-- visitante o un miembro free puede ver de un contenido premium.
-- Reglas: se corta por línea en blanco, se ignora el bloque si es un fence de
-- código (```), una imagen (![) o HTML (<), y se limpia el marcador de markdown
-- inicial (#, >, -, *, 1.).
-- Es IMMUTABLE: no depende de now() ni de la sesión, así que puede usarse en
-- índices y en columnas generadas si algún día hace falta.
-- ---------------------------------------------------------------------------
create or replace function public.first_paragraph(p_markdown text)
returns text
language sql
immutable
as $$
  with bloques as (
    select btrim(b) as bloque
    from regexp_split_to_table(coalesce(p_markdown, ''), E'\n[[:space:]]*\n') as b
  )
  select coalesce(
    (
      select nullif(
               btrim(regexp_replace(bloque,
                 '^(#{1,6}[[:space:]]+|>[[:space:]]?|[-*+][[:space:]]+|[0-9]+\.[[:space:]]+)',
                 '')),
               '')
      from bloques
      where bloque <> ''
        and bloque !~ '^(```|~~~)'
        and bloque !~ '^!\['
        and bloque !~ '^<'
      limit 1
    ),
    ''
  );
$$;

comment on function public.first_paragraph(text) is
  'Devuelve el primer párrafo visible de un markdown. Es el extracto que se sirve a visitantes y miembros free.';

-- ---------------------------------------------------------------------------
-- slugify(): genera el slug de una URL. `unaccent()` es STABLE (depende del
-- diccionario instalado), por eso esta función también lo es: se usa en un
-- trigger BEFORE INSERT, nunca en un índice.
--
-- `extensions.unaccent` va CALIFICADO a propósito: PostgreSQL puede "inline" el
-- cuerpo de una función SQL sencilla en la consulta que la llama, y entonces el
-- nombre se resuelve con el search_path del llamador. Si allí no está el esquema
-- `extensions`, la llamada revienta con "function unaccent(text) does not exist".
-- ---------------------------------------------------------------------------
create or replace function public.slugify(p_text text)
returns text
language sql
stable
set search_path = public, extensions
as $$
  select coalesce(
    nullif(
      trim(both '-' from
        regexp_replace(
          regexp_replace(lower(extensions.unaccent(coalesce(p_text, ''))), '[^a-z0-9]+', '-', 'g'),
          '-{2,}', '-', 'g')
      ),
      ''),
    'sin-titulo')
$$;

-- ---------------------------------------------------------------------------
-- segment_for_revenue(): traduce facturación anual a segmento comercial.
-- El umbral de 5 M USD vive en UN solo lugar (aquí) para que el día que cambie
-- no haya que buscar números mágicos en el código.
-- ---------------------------------------------------------------------------
create or replace function public.segment_for_revenue(p_annual_revenue_usd numeric)
returns public.client_segment
language sql
immutable
as $$
  select case
    when p_annual_revenue_usd is null then 'desconocido'::public.client_segment
    when p_annual_revenue_usd >= 5000000 then 'consulting'::public.client_segment
    else 'pce'::public.client_segment
  end;
$$;

comment on function public.segment_for_revenue(numeric) is
  'Consulting si la facturación anual >= 5,000,000 USD; PCE si es menor; desconocido si no se capturó.';

-- ---------------------------------------------------------------------------
-- audit_redact(): quita del registro de auditoría cualquier campo que no debe
-- quedar escrito en una tabla que nadie puede borrar.
-- ---------------------------------------------------------------------------
create or replace function public.audit_redact(p_data jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(p_data, '{}'::jsonb) - array[
    'password', 'password_hash', 'encrypted_password', 'token', 'access_token',
    'refresh_token', 'api_key', 'service_role_key', 'authorization', 'secret',
    'raw_payload', 'card_number', 'cvv'
  ];
$$;

-- ---------------------------------------------------------------------------
-- Banderas internas de sesión. Se usan para que los triggers sepan que están
-- dentro de una operación controlada (cambio de rol autorizado, escritura
-- derivada que no debe auditarse, purga de logs). `set_config(..., true)` es
-- local a la transacción: no hay riesgo de que se quede encendida.
-- ---------------------------------------------------------------------------
create or replace function public.flag_is_on(p_flag text)
returns boolean
language sql
stable
as $$
  select coalesce(current_setting(p_flag, true), 'off') = 'on';
$$;

create or replace function public.flag_set(p_flag text, p_value boolean)
returns void
language sql
volatile
as $$
  select set_config(p_flag, case when p_value then 'on' else 'off' end, true);
$$;
