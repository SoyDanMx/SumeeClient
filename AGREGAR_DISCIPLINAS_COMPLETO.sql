-- =========================================================================
-- AGREGAR TODAS LAS DISCIPLINAS FALTANTES A LA BASE DE DATOS
-- =========================================================================
-- Este script crea servicios para todas las disciplinas faltantes
-- Solo crea si la disciplina no existe ya
-- Ejecuta este script completo en Supabase SQL Editor

-- =========================================================================
-- PASO 1: VERIFICAR DISCIPLINAS ACTUALES
-- =========================================================================
SELECT 
    '📊 DISCIPLINAS ACTUALES' as info,
    discipline,
    COUNT(*) as servicios_count
FROM service_catalog 
WHERE is_active = true 
GROUP BY discipline
ORDER BY discipline;

-- =========================================================================
-- PASO 2: CREAR SERVICIOS PARA DISCIPLINAS FALTANTES
-- =========================================================================

-- 1. CCTV
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description,
    created_at,
    updated_at
)
SELECT 
    'Instalación de cámara de CCTV wifi',
    'cctv',
    800,
    'fixed',
    true,
    true,
    2000,
    'Instalación de cámara de seguridad wifi',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM service_catalog 
    WHERE discipline = 'cctv' AND is_active = true
);

-- 2. WiFi
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description,
    created_at,
    updated_at
)
SELECT 
    'Instalación de red WiFi',
    'wifi',
    600,
    'fixed',
    true,
    true,
    1500,
    'Instalación y configuración de red WiFi',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM service_catalog 
    WHERE discipline = 'wifi' AND is_active = true
);

-- 3. Tablaroca
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description,
    created_at,
    updated_at
)
SELECT 
    'Instalación de tablaroca',
    'tablaroca',
    500,
    'fixed',
    true,
    true,
    800,
    'Instalación de muros y techos de tablaroca',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM service_catalog 
    WHERE discipline = 'tablaroca' AND is_active = true
);

-- 4. Cargadores Eléctricos
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description,
    created_at,
    updated_at
)
SELECT 
    'Instalación de cargador eléctrico',
    'cargadores-electricos',
    1200,
    'fixed',
    true,
    true,
    500,
    'Instalación de cargador para vehículo eléctrico',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM service_catalog 
    WHERE discipline = 'cargadores-electricos' AND is_active = true
);

-- 5. Paneles Solares
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description,
    created_at,
    updated_at
)
SELECT 
    'Instalación de paneles solares',
    'paneles-solares',
    15000,
    'fixed',
    true,
    true,
    300,
    'Instalación de sistema de paneles solares',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM service_catalog 
    WHERE discipline = 'paneles-solares' AND is_active = true
);

-- 6. Pintura
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description,
    created_at,
    updated_at
)
SELECT 
    'Pintura de interiores',
    'pintura',
    400,
    'fixed',
    true,
    true,
    1200,
    'Pintura de habitaciones y espacios interiores',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM service_catalog 
    WHERE discipline = 'pintura' AND is_active = true
);

-- 7. Jardinería
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description,
    created_at,
    updated_at
)
SELECT 
    'Mantenimiento de jardín',
    'jardineria',
    300,
    'fixed',
    true,
    true,
    900,
    'Corte de césped y mantenimiento de jardín',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM service_catalog 
    WHERE discipline = 'jardineria' AND is_active = true
);

-- 8. Carpintería
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description,
    created_at,
    updated_at
)
SELECT 
    'Servicio de carpintería',
    'carpinteria',
    500,
    'fixed',
    true,
    true,
    600,
    'Trabajos de carpintería y muebles',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM service_catalog 
    WHERE discipline = 'carpinteria' AND is_active = true
);

-- 9. Arquitectos e Ingenieros
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description,
    created_at,
    updated_at
)
SELECT 
    'Consulta con arquitecto',
    'arquitectos-ingenieros',
    2000,
    'fixed',
    true,
    true,
    200,
    'Consulta y asesoría arquitectónica',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM service_catalog 
    WHERE discipline = 'arquitectos-ingenieros' AND is_active = true
);

-- 10. Fumigación
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description,
    created_at,
    updated_at
)
SELECT 
    'Servicio de fumigación',
    'fumigacion',
    400,
    'fixed',
    true,
    true,
    700,
    'Fumigación y control de plagas',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM service_catalog 
    WHERE discipline = 'fumigacion' AND is_active = true
);

-- =========================================================================
-- PASO 3: VERIFICAR RESULTADO FINAL
-- =========================================================================
SELECT 
    '✅ DISCIPLINAS DESPUÉS DE AGREGAR' as info,
    discipline,
    COUNT(*) as servicios_count,
    MIN(min_price) as precio_minimo,
    BOOL_OR(is_popular) as tiene_populares
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
    END;

-- =========================================================================
-- RESUMEN
-- =========================================================================
SELECT 
    '📊 RESUMEN FINAL' as info,
    COUNT(DISTINCT discipline) as total_disciplinas,
    COUNT(*) as total_servicios,
    COUNT(DISTINCT CASE WHEN is_popular = true THEN discipline END) as disciplinas_populares
FROM service_catalog
WHERE is_active = true;

