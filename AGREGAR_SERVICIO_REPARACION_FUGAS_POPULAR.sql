-- =========================================================================
-- AGREGAR SERVICIO DE PLOMERÍA A PROYECTOS POPULARES
-- =========================================================================
-- Fecha: 2025-01-XX
-- Objetivo: Incluir "Reparación de fugas" en proyectos populares
-- Imagen: plomeria.jpg (se usa automáticamente por disciplina)
-- =========================================================================

-- =========================================================================
-- PASO 1: VERIFICAR SI EXISTE EL SERVICIO
-- =========================================================================

SELECT 
    id,
    service_name,
    discipline,
    price_type,
    is_popular,
    is_active,
    min_price,
    completed_count
FROM service_catalog
WHERE discipline = 'plomeria'
  AND (
    LOWER(service_name) LIKE '%fuga%'
    OR LOWER(service_name) LIKE '%reparación%'
    OR LOWER(service_name) LIKE '%reparacion%'
  )
ORDER BY service_name;

-- =========================================================================
-- PASO 2: ACTUALIZAR O CREAR "REPARACIÓN DE FUGAS"
-- =========================================================================

-- Primero intentar actualizar si existe
UPDATE service_catalog
SET 
    is_popular = true,
    price_type = 'fixed',
    is_active = true,
    discipline = 'plomeria',
    completed_count = COALESCE(completed_count, 800),
    display_order = COALESCE(display_order, 3)
WHERE discipline = 'plomeria'
  AND (
    LOWER(service_name) LIKE '%fuga%'
    OR LOWER(service_name) LIKE '%reparación de fuga%'
    OR LOWER(service_name) LIKE '%reparacion de fuga%'
    OR LOWER(service_name) = 'reparar fuga'
    OR LOWER(service_name) = 'reparación fuga'
    OR LOWER(service_name) = 'reparacion fuga'
  );

-- Si no existe, crear el servicio
INSERT INTO service_catalog (
    service_name,
    discipline,
    price_type,
    is_popular,
    is_active,
    min_price,
    max_price,
    unit,
    includes_materials,
    completed_count,
    display_order,
    service_type,
    description
)
SELECT 
    'Reparación de Fuga',
    'plomeria',
    'fixed',
    true,
    true,
    500.00,
    800.00,
    'servicio',
    false,
    800,
    3,
    'express',
    'Reparación profesional de fugas de agua. Incluye diagnóstico, reparación y prueba del sistema. Urgencias disponibles.'
WHERE NOT EXISTS (
    SELECT 1 FROM service_catalog
    WHERE discipline = 'plomeria'
      AND (
        LOWER(service_name) LIKE '%fuga%'
        OR LOWER(service_name) LIKE '%reparación de fuga%'
        OR LOWER(service_name) LIKE '%reparacion de fuga%'
        OR LOWER(service_name) = 'reparar fuga'
        OR LOWER(service_name) = 'reparación fuga'
        OR LOWER(service_name) = 'reparacion fuga'
      )
);

-- =========================================================================
-- PASO 3: VERIFICAR RESULTADO
-- =========================================================================

SELECT 
    '✅ SERVICIO DE PLOMERÍA EN PROYECTOS POPULARES' as info,
    id,
    service_name,
    discipline,
    price_type,
    is_popular,
    is_active,
    min_price,
    completed_count,
    display_order
FROM service_catalog
WHERE discipline = 'plomeria'
  AND is_popular = true
  AND price_type = 'fixed'
  AND is_active = true
  AND (
    LOWER(service_name) LIKE '%fuga%'
    OR LOWER(service_name) LIKE '%reparación de fuga%'
    OR LOWER(service_name) LIKE '%reparacion de fuga%'
  )
ORDER BY display_order ASC, completed_count DESC;

-- =========================================================================
-- NOTA: La imagen se carga automáticamente desde:
-- https://sumeeapp.com/images/services/plomeria.jpg
-- El componente PopularProjectCard mapea la disciplina 'plomeria' 
-- a la imagen correcta.
-- =========================================================================

