-- =========================================================================
-- AGREGAR DISCIPLINAS FALTANTES A LA BASE DE DATOS
-- =========================================================================
-- Este script verifica qué disciplinas faltan y sugiere cómo agregarlas
-- Las disciplinas se agregan automáticamente cuando se crean servicios

-- 1. VERIFICAR DISCIPLINAS ACTUALES
SELECT DISTINCT discipline
FROM service_catalog
WHERE is_active = true
ORDER BY discipline;

-- 2. DISCIPLINAS QUE FALTAN (según el orden esperado):
--    - cctv
--    - wifi
--    - tablaroca
--    - cargadores-electricos
--    - paneles-solares
--    - pintura
--    - jardineria
--    - carpinteria
--    - arquitectos-ingenieros
--    - fumigacion

-- 3. PARA AGREGAR UNA DISCIPLINA:
--    Simplemente crea un servicio en service_catalog con esa disciplina
--    Ejemplo para CCTV:

-- INSERT INTO service_catalog (
--     service_name,
--     discipline,
--     min_price,
--     price_type,
--     is_active,
--     is_popular
-- ) VALUES (
--     'Instalación de cámara de CCTV wifi',
--     'cctv',
--     800,
--     'fixed',
--     true,
--     true
-- );

-- 4. O ACTUALIZAR SERVICIOS EXISTENTES:
--    Si ya tienes servicios de CCTV pero con otra disciplina, actualízala:

-- UPDATE service_catalog
-- SET discipline = 'cctv'
-- WHERE service_name ILIKE '%cctv%'
--    OR service_name ILIKE '%cámara%'
--    OR service_name ILIKE '%camera%'
--    OR service_name ILIKE '%video%'
--    OR service_name ILIKE '%vigilancia%';

-- 5. VERIFICAR DESPUÉS DE AGREGAR:
SELECT 
    discipline,
    COUNT(*) as servicios,
    MIN(min_price) as precio_minimo
FROM service_catalog
WHERE is_active = true
GROUP BY discipline
ORDER BY discipline;

