-- =========================================================================
-- CREAR SERVICIOS PARA DISCIPLINAS FALTANTES
-- =========================================================================
-- Este script crea servicios de ejemplo para las disciplinas que faltan
-- Solo crea servicios si la disciplina no existe ya en la BD
-- Puedes modificar los precios y nombres según tus necesidades

-- Verificar qué disciplinas ya existen
SELECT DISTINCT discipline 
FROM service_catalog 
WHERE is_active = true 
ORDER BY discipline;

-- =========================================================================
-- CREAR SERVICIOS (solo si la disciplina no existe)
-- =========================================================================

-- 1. CCTV
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM service_catalog 
        WHERE discipline = 'cctv' AND is_active = true
    ) THEN
        INSERT INTO service_catalog (
            service_name,
            discipline,
            min_price,
            price_type,
            is_active,
            is_popular,
            completed_count,
            description
        ) VALUES (
            'Instalación de cámara de CCTV wifi',
            'cctv',
            800,
            'fixed',
            true,
            true,
            2000,
            'Instalación de cámara de seguridad wifi'
        );
        RAISE NOTICE '✅ Servicio CCTV creado';
    ELSE
        RAISE NOTICE '⚠️ CCTV ya existe, omitiendo...';
    END IF;
END $$;

-- 2. WiFi
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description
) VALUES (
    'Instalación de red WiFi',
    'wifi',
    600,
    'fixed',
    true,
    true,
    1500,
    'Instalación y configuración de red WiFi'
) ON CONFLICT DO NOTHING;

-- 3. Tablaroca
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description
) VALUES (
    'Instalación de tablaroca',
    'tablaroca',
    500,
    'fixed',
    true,
    true,
    800,
    'Instalación de muros y techos de tablaroca'
) ON CONFLICT DO NOTHING;

-- 4. Cargadores Eléctricos
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description
) VALUES (
    'Instalación de cargador eléctrico',
    'cargadores-electricos',
    1200,
    'fixed',
    true,
    true,
    500,
    'Instalación de cargador para vehículo eléctrico'
) ON CONFLICT DO NOTHING;

-- 5. Paneles Solares
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description
) VALUES (
    'Instalación de paneles solares',
    'paneles-solares',
    15000,
    'fixed',
    true,
    true,
    300,
    'Instalación de sistema de paneles solares'
) ON CONFLICT DO NOTHING;

-- 6. Pintura
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description
) VALUES (
    'Pintura de interiores',
    'pintura',
    400,
    'fixed',
    true,
    true,
    1200,
    'Pintura de habitaciones y espacios interiores'
) ON CONFLICT DO NOTHING;

-- 7. Jardinería
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description
) VALUES (
    'Mantenimiento de jardín',
    'jardineria',
    300,
    'fixed',
    true,
    true,
    900,
    'Corte de césped y mantenimiento de jardín'
) ON CONFLICT DO NOTHING;

-- 8. Carpintería
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description
) VALUES (
    'Servicio de carpintería',
    'carpinteria',
    500,
    'fixed',
    true,
    true,
    600,
    'Trabajos de carpintería y muebles'
) ON CONFLICT DO NOTHING;

-- 9. Arquitectos e Ingenieros
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description
) VALUES (
    'Consulta con arquitecto',
    'arquitectos-ingenieros',
    2000,
    'fixed',
    true,
    true,
    200,
    'Consulta y asesoría arquitectónica'
) ON CONFLICT DO NOTHING;

-- 10. Fumigación
INSERT INTO service_catalog (
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    completed_count,
    description
) VALUES (
    'Servicio de fumigación',
    'fumigacion',
    400,
    'fixed',
    true,
    true,
    700,
    'Fumigación y control de plagas'
) ON CONFLICT DO NOTHING;

-- VERIFICAR RESULTADO
SELECT 
    discipline,
    COUNT(*) as servicios,
    MIN(min_price) as precio_minimo
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

