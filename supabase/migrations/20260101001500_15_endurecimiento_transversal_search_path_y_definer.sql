-- Migración 16 — Endurecimiento transversal (search_path y definer)
-- Generado desde docs/04-modelo-de-datos.md (no editar a mano: se sobrescribe).
-- =============================================================================
-- 20260101121600_16_hardening.sql
-- =============================================================================

set search_path = public, extensions;

-- 1. Todas las funciones del esquema public fijan su search_path.
--    Se hace en bucle para que valga también para las que se añadan después
--    (mientras se acuerden de volver a correr algo equivalente en su migración).
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as firma
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
  loop
    execute format('alter function %s set search_path = public, extensions, pg_temp', f.firma);
  end loop;
end $$;

-- 2. Triggers que solo derivan valores: pasan a SECURITY DEFINER para no
--    depender de los privilegios de quien escribe.
alter function public.set_updated_at()          security definer;
alter function public.forbid_mutation()         security definer;
alter function public.profiles_set_segment()    security definer;
alter function public.contents_before_write()   security definer;
alter function public.content_bodies_before()   security definer;

-- 3. Lectores de cabeceras de la petición: los usan la auditoría y varios RPC.
alter function public.request_headers()         security definer;
alter function public.request_ip()              security definer;
alter function public.request_user_agent()      security definer;
alter function public.request_id()              security definer;

-- 4. Comprobación: ninguna función del esquema puede quedarse sin search_path.
--    select p.oid::regprocedure
--      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname = 'public' and p.proconfig is null;   -- esperado: 0 filas

-- =============================================================================
-- 20260101121500_15_storage.sql
-- Buckets + políticas sobre storage.objects (la RLS ya está activada por Supabase).
-- =============================================================================

set search_path = public, extensions;

-- Los límites van con cast explícito a bigint: `2048 * 1024 * 1024` se evalúa
-- como integer y desborda int4 (2147483647). Es un error que solo se ve al
-- ejecutar, no al leer.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',      'avatars',      true,   5::bigint * 1024 * 1024,     -- 5 MB
     array['image/jpeg','image/png','image/webp','image/avif']),
  ('covers',       'covers',       true,   8::bigint * 1024 * 1024,     -- 8 MB
     array['image/jpeg','image/png','image/webp','image/avif']),
  ('client-logos', 'client-logos', true,   2::bigint * 1024 * 1024,     -- 2 MB
     array['image/svg+xml','image/png','image/webp']),
  ('site-assets',  'site-assets',  true,   8::bigint * 1024 * 1024,     -- 8 MB
     array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml']),
  ('audio',        'audio',        false, 300::bigint * 1024 * 1024,    -- 300 MB
     array['audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/ogg']),
  ('videos',       'videos',       false, 2048::bigint * 1024 * 1024,   -- 2 GB
     array['video/mp4','video/webm']),
  ('documents',    'documents',    false,  50::bigint * 1024 * 1024,    -- 50 MB
     array['application/pdf'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Buckets públicos: lectura para todos.
-- (En un bucket público el archivo también se sirve por URL directa; por eso
-- NUNCA se sube aquí nada cuyo valor dependa de la membresía.)
-- ---------------------------------------------------------------------------
create policy public_buckets_read on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('avatars', 'covers', 'client-logos', 'site-assets'));

-- Escritura: cada quien en su carpeta ({auth.uid()}/...) o el staff donde sea.
create policy public_buckets_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars', 'covers', 'client-logos', 'site-assets')
    and (public.is_staff_editor() or (storage.foldername(name))[1] = auth.uid()::text)
  );

create policy public_buckets_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('avatars', 'covers', 'client-logos', 'site-assets')
    and (public.is_staff_editor() or (storage.foldername(name))[1] = auth.uid()::text)
  )
  with check (
    bucket_id in ('avatars', 'covers', 'client-logos', 'site-assets')
    and (public.is_staff_editor() or (storage.foldername(name))[1] = auth.uid()::text)
  );

create policy public_buckets_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars', 'covers', 'client-logos', 'site-assets')
    and (public.is_staff_editor() or (storage.foldername(name))[1] = auth.uid()::text)
  );

-- ---------------------------------------------------------------------------
-- Buckets privados: el permiso lo decide el CONTENIDO al que pertenece el
-- archivo. La ruta empieza por el id del contenido ({content_id}/archivo), y
-- can_read_storage_object() aplica exactamente la misma regla que el cuerpo:
-- público -> todos; free_registrado -> con sesión; premium -> membresía vigente.
-- ---------------------------------------------------------------------------
create policy private_buckets_read on storage.objects
  for select to authenticated
  using (
    bucket_id in ('audio', 'videos', 'documents')
    and public.can_read_storage_object(bucket_id, name)
  );

-- El CV de un consultor es parte de su perfil público, pero se guarda en un
-- bucket privado porque un CV trae datos de contacto personales.
-- [DECISIÓN §8: ¿lo puede descargar cualquier visitante o solo un miembro?]
create policy documents_cv_read on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and name like 'cv/%');

create policy private_buckets_insert on storage.objects
  for insert to authenticated
  with check (bucket_id in ('audio', 'videos', 'documents') and public.is_staff_editor());

create policy private_buckets_update on storage.objects
  for update to authenticated
  using (bucket_id in ('audio', 'videos', 'documents') and public.is_staff_editor())
  with check (bucket_id in ('audio', 'videos', 'documents') and public.is_staff_editor());

create policy private_buckets_delete on storage.objects
  for delete to authenticated
  using (bucket_id in ('audio', 'videos', 'documents') and public.is_staff_editor());

-- Ejecutar UNA vez, con la cuenta ya creada desde /registro.
update public.profiles set role = 'super_admin' where email = 'cuenta-admin@cedem.com.mx';
