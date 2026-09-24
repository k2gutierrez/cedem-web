-- Semilla del proyecto. Generado desde docs/04-modelo-de-datos.md.
-- Se aplica en local y en preview; en producción lo revisa CEDEM antes.

-- =============================================================================
-- web/supabase/seed.sql  (extracto ejecutable)
-- Se ejecuta SOLO en local (`supabase db reset`) y en el proyecto de preview.
-- No se corre en producción.
-- =============================================================================

begin;

-- 1. Países (base; el admin confirma cuáles tienen clientes) ------------------
insert into public.countries (code, iso3, name_es, name_en, region, sort_order) values
  ('MX', 'MEX', 'México',         'Mexico',        'Norteamérica',  10),
  ('US', 'USA', 'Estados Unidos', 'United States', 'Norteamérica',  20),
  ('ES', 'ESP', 'España',         'Spain',         'Europa',        30),
  ('GT', 'GTM', 'Guatemala',      'Guatemala',     'Latinoamérica', 40),
  ('CO', 'COL', 'Colombia',       'Colombia',      'Latinoamérica', 50),
  ('CL', 'CHL', 'Chile',          'Chile',         'Latinoamérica', 60),
  ('PE', 'PER', 'Perú',           'Peru',          'Latinoamérica', 70),
  ('AR', 'ARG', 'Argentina',      'Argentina',     'Latinoamérica', 80),
  ('CR', 'CRI', 'Costa Rica',     'Costa Rica',    'Latinoamérica', 90),
  ('PA', 'PAN', 'Panamá',         'Panama',        'Latinoamérica', 100)
on conflict (code) do nothing;

-- 2. Configuración del sitio --------------------------------------------------
-- Todo lo que el admin debe poder cambiar sin programadores.
insert into public.site_settings (key, value, value_type, group_name, label, is_public) values
  ('site.name',            to_jsonb('CEDEM'::text),                        'texto',    'general',   'Nombre del sitio',                    true),
  ('site.tagline',         to_jsonb('EL VALOR DE SER DUEÑO'::text),        'texto',    'general',   'Tagline oficial',                     true),
  ('site.claim',           to_jsonb('Mejorando la Dueñez en el mundo'::text), 'texto', 'general',   'Claim institucional',                 true),
  ('site.founded_year',    to_jsonb(1985),                                 'numero',   'general',   'Año de fundación',                    true),
  ('site.trademark_notice',to_jsonb('Dueñez® es marca registrada por Carlos A. Dumois Núñez.'::text),
                                                                           'texto',    'legal',     'Aviso de marca registrada',           true),
  ('contact.phone_mx',     to_jsonb('+52 33 2257 6343'::text),             'texto',    'contacto',  'Teléfono México',                     true),
  ('contact.whatsapp',     '["+52 33 2257 6343", "+52 33 3507 6686"]'::jsonb, 'json',  'contacto',  'Números de WhatsApp',                 true),
  ('contact.email_public', to_jsonb('circulo@cedem.com.mx'::text),         'texto',    'contacto',  'Correo público',                      true),
  -- [DECISIÓN] Las fuentes dan DOS direcciones distintas en Zapopan; se guarda
  -- la del footer del sitio y se confirma con CEDEM antes de publicar.
  ('contact.address_mx',   '{"street":"Av. San Francisco 3601","neighborhood":"Jardines de San Ignacio","city":"Zapopan","state":"Jalisco","zip":"45040","country":"MX"}'::jsonb,
                                                                           'json',     'contacto',  'Dirección México',                    true),
  ('contact.offices_intl', '[{"name":"BOC Business Owner Consulting INC","city":"Miami","state":"FL","zip":"33126","country":"US"},{"name":"BOC Business Owner Consulting INC","city":"Houston","state":"TX","zip":"77056","country":"US"}]'::jsonb,
                                                                           'json',     'contacto',  'Oficinas internacionales',            true),
  ('social.linkedin',      to_jsonb('https://www.linkedin.com/company/cedem-mx'::text), 'url', 'social', 'LinkedIn corporativo',             true),
  ('social.youtube',       to_jsonb('https://www.youtube.com/@cedemcentrodeduenez'::text), 'url', 'social', 'Canal de YouTube',               true),
  ('home.map_title',       to_jsonb('Empresas líderes acompañadas en'::text), 'texto', 'home',      'Título del mapa de clientes',         true),
  ('membership.preview_paragraphs', to_jsonb(1),                           'numero',   'membresia', 'Párrafos visibles sin membresía',     true),
  ('journey.estimated_minutes',     to_jsonb(5),                           'numero',   'camino',    'Duración estimada del Camino',        true),
  ('legal.privacy_version',to_jsonb('2026-09'::text),                      'texto',    'legal',     'Versión vigente del aviso de privacidad', true)
on conflict (key) do nothing;

-- 3. Etiquetas (vocabulario verificado de CEDEM) ------------------------------
insert into public.tags (slug, label, kind, sort_order) values
  ('duenez',                  'Dueñez',                  'eje',    10),
  ('duenez-compartida',       'Dueñez Compartida',       'eje',    20),
  ('generar-valor',           'Generar Valor',           'eje',    30),
  ('multiplicar-valor',       'Multiplicar Valor',       'eje',    40),
  ('capturar-valor',          'Capturar Valor',          'eje',    50),
  ('concentracion-estrategica','Concentración Estratégica','tema',  60),
  ('familia-empresaria',      'Familia Empresaria',      'tema',   70),
  ('formula-de-gobierno',     'Fórmula de Gobierno',     'tema',   80),
  ('querencia',               'Querencia',               'tema',   90),
  ('sucesion',                'Sucesión',                'tema',  100),
  ('finanzas-del-valor',      'Finanzas del Valor',      'tema',  110),
  ('liderazgo-de-duenez',     'Liderazgo de Dueñez',     'tema',  120),
  ('innovacion',              'Innovación',              'tema',  130),
  ('transformacion-digital',  'Transformación Digital',  'tema',  140),
  ('casos-de-exito',          'Casos de Éxito',          'formato', 150)
on conflict (slug) do nothing;

-- 4. Segmentos del Camino del Dueño (los 3 verbos, verificados) ---------------
insert into public.journey_segments (code, title, subtitle, cedem_concept, color_hex, sort_order) values
  ('generar',     'Generar valor',     'El cliente es la única fuente de generación de valor',
   'Enfoque Competitivo',      '#0071CE', 10),
  ('multiplicar', 'Multiplicar valor', 'No se multiplica el valor sin multiplicar el poder',
   'Sinergia Organizacional',  '#00A1E0', 20),
  ('capturar',    'Capturar valor',    'La clave no es estar alineado, sino estar alineándose',
   'Alineación Estratégica',   '#0F206C', 30)
on conflict (code) do nothing;

-- 5. Preguntas del Camino del Dueño — [EJEMPLO, VALIDAR CON CEDEM] -----------
-- La estructura es definitiva; el contenido de las preguntas se revisa con la firma.
insert into public.journey_questions (segment_id, code, prompt, kind, dimension, options, sort_order)
select s.id, v.code, v.prompt, v.kind::public.question_kind, v.dimension, v.options::jsonb, v.sort_order
from (values
  ('generar', 'g1', '¿Sabes con claridad cuál es tu mercado más fértil hoy?',
   'escala', 'fertilidad', '[{"value":1,"label":"Nada claro"},{"value":3,"label":"Parcialmente"},{"value":5,"label":"Con total claridad"}]', 10),
  ('generar', 'g2', '¿Tus clientes te eligen por algo que nadie más puede igualar?',
   'escala', 'diferenciacion', '[{"value":1,"label":"No"},{"value":3,"label":"Algo"},{"value":5,"label":"Sí, es evidente"}]', 20),
  ('multiplicar', 'm1', '¿Tu equipo comparte el proyecto con verdadera querencia?',
   'escala', 'querencia', '[{"value":1,"label":"No"},{"value":3,"label":"Algunos"},{"value":5,"label":"Todo el equipo"}]', 30),
  ('multiplicar', 'm2', '¿Tu fórmula de gobierno está escrita y se respeta?',
   'escala', 'gobierno', '[{"value":1,"label":"No existe"},{"value":3,"label":"Informal"},{"value":5,"label":"Escrita y vigente"}]', 40),
  ('capturar', 'c1', '¿Tus recursos están en tus mejores oportunidades?',
   'escala', 'alineacion-recursos', '[{"value":1,"label":"No"},{"value":3,"label":"En parte"},{"value":5,"label":"Siempre"}]', 50),
  ('capturar', 'c2', '¿Con qué información decides hoy tu estrategia?',
   'opcion_unica', 'alineacion-informacion',
   '[{"value":1,"label":"Intuición"},{"value":3,"label":"Reportes tardíos"},{"value":5,"label":"Tablero vivo"}]', 60)
) as v(segment_code, code, prompt, kind, dimension, options, sort_order)
join public.journey_segments s on s.code = v.segment_code
on conflict (segment_id, code) do nothing;

-- 6. Planes — [EJEMPLO · NO PUBLICAR] ----------------------------------------
-- Precios y periodicidad SIN DEFINIR (decisión comercial pendiente). Se insertan
-- apagados y ocultos para no inventar una oferta ni mostrarla en el sitio.
insert into public.plans (code, name, description, tier, is_public, is_active, requires_invitation, sort_order, features) values
  ('premium-mensual-ejemplo', 'Membresía CEDEM 2.0 (EJEMPLO)', 'Plan de referencia: contenido premium y Camino del Dueño.',
   'premium', false, false, false, 10, '["Biblioteca completa","Camino del Dueño","Eventos"]'::jsonb),
  ('invitacion-cliente-ejemplo', 'Acceso por invitación (EJEMPLO)', 'Plan que se otorga a clientes actuales de la firma mediante código.',
   'premium', false, false, true, 20, '["Biblioteca completa","Camino del Dueño","Acompañamiento del consultor"]'::jsonb)
on conflict (code) do nothing;

-- 7. Clientes y testimonios verificados — SIN AUTORIZACIÓN DE MARCA -----------
-- brand_authorized = false e is_active = false: NO se muestran hasta que CEDEM
-- confirme por escrito el uso de cada marca (punto abierto del documento 00).
insert into public.clients (slug, name, country_code, city, sector, brand_authorized, is_active, sort_order) values
  ('grupo-coppel',    'Grupo Coppel',    'MX', 'Culiacán',  'Retail',            false, false, 10),
  ('grupo-caffenio',  'Grupo Caffenio',  'MX', 'Hermosillo','Alimentos',         false, false, 20),
  ('grupo-dportenis', 'Grupo D''portenis','MX','Guadalajara','Calzado',          false, false, 30),
  ('ifa-celtics',     'IFA Celtics',     'MX', 'Guadalajara','Laboratorios',     false, false, 40)
on conflict (slug) do nothing;

insert into public.testimonials (client_id, person_name, person_role, person_company, quote, authorized, is_published, sort_order)
select c.id, v.person_name, v.person_role, v.person_company, v.quote, false, false, v.sort_order
from (values
  ('grupo-coppel', 'Agustín Coppel Luken', 'Presidente del Consejo', 'Grupo Coppel',
   'CEDEM es la integración de una escuela de formación de Dueños con una firma de consultoría especializada en Gestión de Valor, que ha contribuido al crecimiento de nuestro Grupo Empresarial y al fortalecimiento del patrimonio familiar.', 10),
  ('grupo-caffenio', 'José Antonio Díaz Quintanar', 'Presidente del Consejo', 'Grupo Caffenio',
   'En CEDEM han ayudado a nuestra Empresa Familiar a transformarse en Familia Empresaria, compartiendo la Dueñez y priorizando la Creación de Valor.', 20)
) as v(client_slug, person_name, person_role, person_company, quote, sort_order)
join public.clients c on c.slug = v.client_slug
where not exists (select 1 from public.testimonials t where t.person_name = v.person_name);

-- 8. Redirecciones base del sitio anterior ------------------------------------
insert into public.redirects (from_path, to_path, status_code, note) values
  ('/quienes-somos/', '/nosotros', 301, 'Página equivalente'),
  ('/articulos2/',    '/recursos/articulos', 301, 'Listado de artículos'),
  ('/webinars/',      '/recursos/videos', 301, 'Serie de webinars'),
  ('/eventos/',       '/recursos/eventos', 301, 'Listado de eventos'),
  ('/consulting/',    '/consulting', 301, 'Servicio Consulting'),
  ('/decv/',          '/metodologia', 301, 'Diagnóstico de estrategia de valor'),
  ('/elementor/',     '/', 410, 'Página basura del sitio actual: se elimina')
on conflict (from_path) do nothing;

commit;
