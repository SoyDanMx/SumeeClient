-- =========================================================================
-- AGREGAR SERVICIOS DE ELECTRICIDAD A PROYECTOS POPULARES
-- =========================================================================
-- Fecha: 2025-01-XX
-- Objetivo: Incluir "Instalar contactos" e "Instalar lámparas" en proyectos populares
-- Imagen: electricidad.jpg (se usa automáticamente por disciplina)
-- =========================================================================

-- =========================================================================
-- PASO 1: VERIFICAR SI EXISTEN LOS SERVICIOS
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
WHERE discipline = 'electricidad'
  AND (
    LOWER(service_name) LIKE '%contacto%' 
    OR LOWER(service_name) LIKE '%lámpara%'
    OR LOWER(service_name) LIKE '%lampara%'
  )
ORDER BY service_name;

-- =========================================================================
-- PASO 2: ACTUALIZAR O CREAR "INSTALAR CONTACTOS"
-- =========================================================================

-- Primero intentar actualizar si existe
UPDATE service_catalog
SET 
    is_popular = true,
    price_type = 'fixed',
    is_active = true,
    discipline = 'electricidad',
    completed_count = COALESCE(completed_count, 500),
    display_order = COALESCE(display_order, 1)
WHERE discipline = 'electricidad'
  AND (
    LOWER(service_name) LIKE '%contacto%'
    OR LOWER(service_name) = 'instalar contacto'
    OR LOWER(service_name) = 'instalación de contacto'
    OR LOWER(service_name) = 'instalacion de contacto'
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
    'Instalación de Contacto',
    'electricidad',
    'fixed',
    true,
    true,
    350.00,
    500.00,
    'contacto',
    false,
    500,
    1,
    'express',
    'Instalación profesional de contactos eléctricos. Incluye mano de obra y materiales básicos.'
WHERE NOT EXISTS (
    SELECT 1 FROM service_catalog
    WHERE discipline = 'electricidad'
      AND (
        LOWER(service_name) LIKE '%contacto%'
        OR LOWER(service_name) = 'instalar contacto'
        OR LOWER(service_name) = 'instalación de contacto'
        OR LOWER(service_name) = 'instalacion de contacto'
      )
);

-- =========================================================================
-- PASO 3: ACTUALIZAR O CREAR "INSTALAR LÁMPARAS"
-- =========================================================================

-- Primero intentar actualizar si existe
UPDATE service_catalog
SET 
    is_popular = true,
    price_type = 'fixed',
    is_active = true,
    discipline = 'electricidad',
    completed_count = COALESCE(completed_count, 600),
    display_order = COALESCE(display_order, 2)
WHERE discipline = 'electricidad'
  AND (
    LOWER(service_name) LIKE '%lámpara%'
    OR LOWER(service_name) LIKE '%lampara%'
    OR LOWER(service_name) = 'instalar lámpara'
    OR LOWER(service_name) = 'instalar lampara'
    OR LOWER(service_name) = 'instalación de lámpara'
    OR LOWER(service_name) = 'instalacion de lampara'
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
    'Instalación de Lámpara',
    'electricidad',
    'fixed',
    true,
    true,
    400.00,
    600.00,
    'lámpara',
    false,
    600,
    2,
    'express',
    'Instalación profesional de lámparas. Incluye mano de obra y materiales básicos.'
WHERE NOT EXISTS (
    SELECT 1 FROM service_catalog
    WHERE discipline = 'electricidad'
      AND (
        LOWER(service_name) LIKE '%lámpara%'
        OR LOWER(service_name) LIKE '%lampara%'
        OR LOWER(service_name) = 'instalar lámpara'
        OR LOWER(service_name) = 'instalar lampara'
        OR LOWER(service_name) = 'instalación de lámpara'
        OR LOWER(service_name) = 'instalacion de lampara'
      )
);

-- =========================================================================
-- PASO 4: VERIFICAR RESULTADO
-- =========================================================================

SELECT 
    '✅ SERVICIOS DE ELECTRICIDAD EN PROYECTOS POPULARES' as info,
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
WHERE discipline = 'electricidad'
  AND is_popular = true
  AND price_type = 'fixed'
  AND is_active = true
  AND (
    LOWER(service_name) LIKE '%contacto%'
    OR LOWER(service_name) LIKE '%lámpara%'
    OR LOWER(service_name) LIKE '%lampara%'
  )
ORDER BY display_order ASC, completed_count DESC;

-- =========================================================================
-- NOTA: La imagen se carga automáticamente desde:
-- https://sumeeapp.com/images/services/electricidad.jpg
-- El componente PopularProjectCard mapea la disciplina 'electricidad' 
-- a la imagen correcta.
-- =========================================================================

