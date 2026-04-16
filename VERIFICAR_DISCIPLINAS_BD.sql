-- =========================================================================
-- VERIFICAR DISCIPLINAS EN LA BASE DE DATOS
-- =========================================================================
-- Este script verifica qué disciplinas existen en service_catalog
-- y las compara con el orden esperado en la app

-- 1. Ver todas las disciplinas únicas
SELECT 
    discipline,
    COUNT(*) as servicio_count,
    MIN(min_price) as precio_minimo
FROM service_catalog
WHERE is_active = true
GROUP BY discipline
ORDER BY discipline;

-- 2. Verificar si existen las disciplinas esperadas
SELECT 
    CASE 
        WHEN discipline = 'electricidad' THEN '✅ Electricidad'
        WHEN discipline = 'plomeria' THEN '✅ Plomería'
        WHEN discipline = 'cctv' THEN '✅ CCTV'
        WHEN discipline = 'wifi' THEN '✅ WiFi'
        WHEN discipline = 'aire-acondicionado' THEN '✅ Climatización'
        WHEN discipline = 'armado' THEN '✅ Armado'
        WHEN discipline = 'montaje' THEN '✅ Montaje'
        WHEN discipline = 'tablaroca' THEN '✅ Tablaroca'
        WHEN discipline = 'cargadores-electricos' THEN '✅ Cargadores Eléctricos'
        WHEN discipline = 'paneles-solares' THEN '✅ Paneles Solares'
        WHEN discipline = 'limpieza' THEN '✅ Limpieza'
        WHEN discipline = 'pintura' THEN '✅ Pintura'
        WHEN discipline = 'jardineria' THEN '✅ Jardinería'
        WHEN discipline = 'carpinteria' THEN '✅ Carpintería'
        WHEN discipline = 'arquitectos-ingenieros' THEN '✅ Arquitectos e Ingenieros'
        WHEN discipline = 'fumigacion' THEN '✅ Fumigación'
        ELSE '⚠️ ' || discipline || ' (no está en el orden esperado)'
    END as estado,
    COUNT(*) as servicios
FROM service_catalog
WHERE is_active = true
GROUP BY discipline
ORDER BY 
    CASE discipline
        WHEN 'electricidad' THEN 1
        WHEN 'plomeria' THEN 2
        WHEN 'cctv' THEN 3
        WHEN 'wifi' THEN 4
        WHEN 'aire-acondicionado' THEN 5
        WHEN 'armado' THEN 6
        WHEN 'montaje' THEN 7
        WHEN 'tablaroca' THEN 8
        WHEN 'cargadores-electricos' THEN 9
        WHEN 'paneles-solares' THEN 10
        WHEN 'limpieza' THEN 11
        WHEN 'pintura' THEN 12
        WHEN 'jardineria' THEN 13
        WHEN 'carpinteria' THEN 14
        WHEN 'arquitectos-ingenieros' THEN 15
        WHEN 'fumigacion' THEN 16
        ELSE 99
    END,
    discipline;

-- 3. Verificar si hay disciplinas con nombres diferentes
-- (por ejemplo, "montaje-armado" en lugar de "montaje" y "armado")
SELECT 
    discipline,
    COUNT(*) as count
FROM service_catalog
WHERE is_active = true
AND discipline NOT IN (
    'electricidad', 'plomeria', 'cctv', 'wifi', 'aire-acondicionado',
    'armado', 'montaje', 'tablaroca', 'cargadores-electricos', 
    'paneles-solares', 'limpieza', 'pintura', 'jardineria', 
    'carpinteria', 'arquitectos-ingenieros', 'fumigacion',
    'cerrajeria', 'construccion', 'montaje-armado'
)
GROUP BY discipline
ORDER BY count DESC;

