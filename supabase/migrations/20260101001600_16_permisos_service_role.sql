-- Migración 17 — Permisos del rol de servicio
--
-- POR QUÉ EXISTE ESTA MIGRACIÓN
--
-- La migración 14 aplica "deny by default": revoca los privilegios que Supabase
-- concede por defecto y los otorga uno por uno a `anon` y a `authenticated`.
-- Eso es correcto para el tráfico de usuarios, pero deja fuera a `service_role`,
-- que es el rol con el que el servidor ejecuta las tareas que no van en nombre
-- de nadie: crear la cuenta de un dueño que dejó su correo, guardar un
-- diagnóstico anónimo, tareas programadas.
--
-- El síntoma apareció al ejecutar, no al leer el esquema: guardar el Camino del
-- Dueño fallaba con
--
--     permission denied for table journey_sessions (SQLSTATE 42501)
--
-- aunque el cliente usara la llave de servicio. La llave era correcta; lo que
-- faltaba era el GRANT.
--
-- Criterio: `service_role` es el rol de confianza del servidor. Mantiene
-- BYPASSRLS y se le conceden los privilegios de tabla, secuencia y función.
-- No se concede nada nuevo a `anon` ni a `authenticated`.

grant usage on schema public to service_role;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Para que las tablas y funciones que se creen en el futuro también queden
-- cubiertas sin tener que acordarse de volver a otorgar.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;

-- Storage: el servidor sube y borra archivos en nombre de la plataforma.
grant all privileges on all tables in schema storage to service_role;
grant all privileges on all sequences in schema storage to service_role;
grant execute on all functions in schema storage to service_role;

-- Comprobación (se deja como consulta, no como bloque ejecutable).
--
-- Se intentó primero con un bloque `do $$ … $$` que lanzaba una excepción si
-- alguna tabla quedaba sin permiso, pero el CLI de Supabase crea y destruye una
-- vista `public.schema_migrations` durante la aplicación: la comprobación la
-- encontraba, intentaba consultar sus privilegios y abortaba la migración con
-- un error que no tenía nada que ver con los permisos.
--
-- Para verificar a mano, esta consulta debe devolver cero filas:
--
--   select t.tablename
--     from pg_catalog.pg_tables t
--    where t.schemaname = 'public'
--      and not pg_catalog.has_table_privilege(
--            'service_role', pg_catalog.format('public.%I', t.tablename), 'SELECT');
