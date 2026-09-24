-- Migración 18 — La ruta del archivo deja de ser pública
--
-- POR QUÉ EXISTE ESTA MIGRACIÓN
--
-- La vista `v_contents_for_viewer` documenta, desde el primer día, que la ruta
-- del archivo de un documento NO se expone: «se descarga por RPC con URL
-- firmada». La intención estaba escrita; la tabla no la cumplía.
--
-- La policy `documents_select` usa `can_view_content()`, que es la regla de la
-- FICHA (tarjeta, título, resumen, extracto): devuelve verdadero para cualquier
-- contenido en vivo, porque el visitante tiene que poder ver el anzuelo. Eso es
-- correcto para `pages` o `rights_notice`, pero no para `file_path`, que es la
-- ubicación del PDF dentro del bucket privado.
--
-- El síntoma apareció al probar la biblioteca de miembros:
--
--     select count(*) from public.documents;   -- como rol anon: 12 filas
--
-- Con la ruta en la mano, un visitante no puede descargar nada —el bucket es
-- privado, `can_read_storage_object()` le dice que no y firmar una URL exige la
-- llave de servicio—, pero reparte información interna y deja la protección
-- dependiendo de un solo candado. Dos candados es mejor que uno.
--
-- CÓMO SE ARREGLA
--
-- Con privilegios por COLUMNA, que es el mecanismo que ya usa este esquema para
-- la misma frontera (ver migración 14: `profiles.role` no se concede nunca).
-- No se puede conceder la tabla y revocar la columna: un privilegio de tabla
-- implica todas sus columnas. Hay que conceder columna a columna.
--
-- `file_path` queda fuera de la lista. Lo siguen leyendo:
--   · `get_download_path()`, que es SECURITY DEFINER: corre como el dueño de la
--     tabla, así que el privilegio no lo limita, y sigue siendo el ÚNICO camino
--     para obtener la ruta (y deja registro en `access_logs`).
--   · `service_role`, que conserva ALL (migración 17) para firmar la URL.

revoke select on public.documents from anon, authenticated;

grant select (
  content_id,
  file_mime,
  file_size_bytes,
  pages,
  author_label,
  rights_notice,
  is_downloadable,
  created_at,
  updated_at
) on public.documents to anon, authenticated;

-- La policy de fila sigue siendo la misma: la ficha se ve, el archivo no.

-- Comprobación (se deja como consulta, no como bloque ejecutable: una consulta
-- dentro de la migración ve la tabla transitoria del CLI y aborta la aplicación).
--
--   select has_column_privilege('anon', 'public.documents', 'file_path', 'SELECT');  -- false
--   select has_column_privilege('anon', 'public.documents', 'pages',     'SELECT');  -- true
--   select has_column_privilege('authenticated', 'public.documents', 'file_path', 'SELECT'); -- false
--
-- Y la prueba completa, con el muro incluido:
--
--   python3 scripts/probar-documentos.py
