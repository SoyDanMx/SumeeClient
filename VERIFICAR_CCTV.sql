-- =========================================================================
-- VERIFICAR POR QUÉ CCTV NO APARECE
-- =========================================================================

-- 1. Verificar si existe la disciplina 'cctv' en service_catalog
SELECT 
    discipline,
    COUNT(*) as servicio_count,
    MIN(min_price) as precio_minimo,
    BOOL_OR(is_active) as tiene_activos
FROM service_catalog
WHERE discipline ILIKE '%cctv%' OR discipline ILIKE '%camera%' OR discipline ILIKE '%video%'
GROUP BY discipline;

-- 2. Verificar todas las disciplinas únicas para ver cómo está escrito 'cctv'
SELECT DISTINCT discipline
FROM service_catalog
WHERE is_active = true
ORDER BY discipline;

-- 3. Verificar servicios de CCTV específicamente
SELECT 
    id,
    service_name,
    discipline,
    is_active,
    min_price
FROM service_catalog
WHERE (discipline ILIKE '%cctv%' OR discipline ILIKE '%camera%' OR discipline ILIKE '%video%')
AND is_active = true
LIMIT 10;

-- 4. Verificar si hay servicios con nombres relacionados a CCTV pero disciplina diferente
SELECT 
    id,
    service_name,
    discipline,
    is_active
FROM service_catalog
WHERE service_name ILIKE '%cctv%' 
   OR service_name ILIKE '%cámara%'
   OR service_name ILIKE '%camera%'
   OR service_name ILIKE '%video%'
   OR service_name ILIKE '%vigilancia%'
LIMIT 20;

