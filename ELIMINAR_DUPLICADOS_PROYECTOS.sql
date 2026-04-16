-- =========================================================================
-- ELIMINAR DUPLICADOS DE PROYECTOS POPULARES
-- =========================================================================
-- Este script elimina servicios duplicados manteniendo solo el primero
-- (el que tiene mayor completed_count o el más antiguo)

-- =========================================================================
-- PASO 1: VERIFICAR DUPLICADOS ANTES DE ELIMINAR
-- =========================================================================
SELECT 
    service_name,
    discipline,
    COUNT(*) as cantidad,
    STRING_AGG(id::text, ', ' ORDER BY completed_count DESC NULLS LAST, created_at ASC) as ids,
    STRING_AGG(completed_count::text, ', ') as completed_counts
FROM service_catalog
WHERE is_active = true
  AND price_type = 'fixed'
  AND is_popular = true
GROUP BY service_name, discipline
HAVING COUNT(*) > 1
ORDER BY cantidad DESC, service_name;

-- =========================================================================
-- PASO 2: ELIMINAR DUPLICADOS
-- =========================================================================
-- Mantener solo el primero (mayor completed_count, o más antiguo si igual)
-- Eliminar los demás

DELETE FROM service_catalog
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY LOWER(TRIM(service_name)), LOWER(TRIM(discipline))
                ORDER BY 
                    completed_count DESC NULLS LAST,
                    created_at ASC
            ) as rn
        FROM service_catalog
        WHERE is_active = true
          AND price_type = 'fixed'
          AND is_popular = true
    ) ranked
    WHERE rn > 1
);

-- =========================================================================
-- PASO 3: VERIFICAR RESULTADO DESPUÉS DE ELIMINAR
-- =========================================================================
SELECT 
    '✅ RESULTADO DESPUÉS DE ELIMINAR DUPLICADOS' as info,
    COUNT(*) as total_servicios,
    COUNT(DISTINCT service_name || '|' || discipline) as servicios_unicos
FROM service_catalog
WHERE is_active = true
  AND price_type = 'fixed'
  AND is_popular = true;

-- Verificar que no queden duplicados
SELECT 
    service_name,
    discipline,
    COUNT(*) as cantidad
FROM service_catalog
WHERE is_active = true
  AND price_type = 'fixed'
  AND is_popular = true
GROUP BY service_name, discipline
HAVING COUNT(*) > 1;

-- Si esta query no devuelve filas, significa que no hay duplicados ✅

-- =========================================================================
-- PASO 4: LISTAR SERVICIOS FINALES (ORDENADOS)
-- =========================================================================
SELECT 
    id,
    service_name,
    discipline,
    price_type,
    is_popular,
    completed_count,
    min_price,
    created_at
FROM service_catalog
WHERE is_active = true
  AND price_type = 'fixed'
  AND is_popular = true
ORDER BY completed_count DESC NULLS LAST, display_order ASC NULLS LAST, created_at ASC
LIMIT 20;

