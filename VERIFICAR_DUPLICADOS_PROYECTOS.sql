-- =========================================================================
-- VERIFICAR DUPLICADOS EN PROYECTOS POPULARES
-- =========================================================================
-- Este script verifica si hay servicios duplicados que aparecen en "Proyectos Populares"

-- 1. Verificar servicios con precio fijo y populares
SELECT 
    id,
    service_name,
    discipline,
    price_type,
    is_popular,
    completed_count,
    display_order,
    min_price
FROM service_catalog
WHERE is_active = true
  AND price_type = 'fixed'
  AND is_popular = true
ORDER BY completed_count DESC NULLS LAST, display_order ASC NULLS LAST
LIMIT 20;

-- 2. Verificar si hay servicios con el mismo nombre (duplicados por nombre)
SELECT 
    service_name,
    COUNT(*) as cantidad,
    STRING_AGG(id::text, ', ') as ids,
    STRING_AGG(discipline, ', ') as disciplinas
FROM service_catalog
WHERE is_active = true
  AND price_type = 'fixed'
  AND is_popular = true
GROUP BY service_name
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- 3. Verificar si hay servicios duplicados por disciplina y nombre
SELECT 
    discipline,
    service_name,
    COUNT(*) as cantidad,
    STRING_AGG(id::text, ', ') as ids
FROM service_catalog
WHERE is_active = true
  AND price_type = 'fixed'
  AND is_popular = true
GROUP BY discipline, service_name
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- 4. Ver todos los servicios con precio fijo (sin filtro is_popular)
SELECT 
    id,
    service_name,
    discipline,
    price_type,
    is_popular,
    completed_count,
    min_price
FROM service_catalog
WHERE is_active = true
  AND price_type = 'fixed'
ORDER BY completed_count DESC NULLS LAST, min_price ASC
LIMIT 30;

