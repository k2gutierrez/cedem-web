-- Pruebas de la base. Generado desde docs/04-modelo-de-datos.md.
-- Requieren la extensión pgTAP. NO forman parte de las migraciones.

-- web/supabase/tests/01_premium_isolation.sql
-- La prueba más importante del proyecto: si esta falla, el muro de pago no existe.
begin;
select plan(4);

-- Fixtures (se crean como service_role, antes de cambiar de rol):
--   · un artículo premium publicado, con cuerpo de dos párrafos
--   · un miembro free y un miembro premium (handle_new_user crea sus perfiles)
--   · una suscripción activa solo para el premium

-- 1. Un miembro free NO obtiene ninguna fila del cuerpo
set local role authenticated;
set local request.jwt.claims = '{"sub":"<uuid-free>","role":"authenticated"}';
select is(
  (select count(*) from public.content_bodies where content_id = '<uuid-articulo>'),
  0::bigint,
  'un miembro free no lee el cuerpo premium ni consultando la tabla directamente'
);

-- 2. La vista le entrega exactamente el primer párrafo, marcado como truncado
select is(
  (select body_md from public.v_contents_for_viewer where id = '<uuid-articulo>'),
  '<primer-parrafo-esperado>',
  'la vista devuelve solo el primer párrafo para un miembro free'
);
select is(
  (select is_body_truncated from public.v_contents_for_viewer where id = '<uuid-articulo>'),
  true,
  'la bandera is_body_truncated avisa a la interfaz de que debe mostrar el muro'
);

-- 3. El miembro premium sí lee el cuerpo completo
set local request.jwt.claims = '{"sub":"<uuid-premium>","role":"authenticated"}';
select isnt(
  (select position('segundo párrafo' in body_md) from public.content_bodies
    where content_id = '<uuid-articulo>'),
  0,
  'un miembro premium lee el cuerpo completo'
);

select * from finish();
rollback;
