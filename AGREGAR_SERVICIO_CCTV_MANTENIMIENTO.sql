-- =====================================================
-- AGREGAR SERVICIO: Mantenimiento a Sistema de CCTV con 4 canales
-- =====================================================
-- Descripción: Mantenimiento a Sistema de CCTV con 4 canales (únicamente mano de obra)
-- Precio: $1500 MXN
-- Disciplina: cctv
-- =====================================================

-- Verificar si el servicio ya existe
DO $$
BEGIN
    -- Verificar si ya existe un servicio con este nombre exacto O nombres similares
    IF NOT EXISTS (
        SELECT 1 FROM service_catalog 
        WHERE discipline = 'cctv'
        AND is_active = true
        AND (
            service_name = 'Mantenimiento a Sistema de CCTV con 4 canales (únicamente mano de obra)'
            OR service_name LIKE '%Mantenimiento%Sistema%CCTV%'
            OR service_name LIKE '%Mantenimiento%CCTV%4 canales%'
            OR service_name LIKE '%Mantenimiento%CCTV%4 canales%'
            OR service_name LIKE '%Mantenimiento%4 canales%'
        )
    ) THEN
        -- Insertar el nuevo servicio
        INSERT INTO service_catalog (
            service_name,
            discipline,
            min_price,
            price_type,
            is_active,
            is_popular,
            completed_count,
            description,
            includes_materials,
            created_at,
            updated_at
        ) VALUES (
            'Mantenimiento a Sistema de CCTV con 4 canales (únicamente mano de obra)',
            'cctv',
            1500,  -- Precio: $1500 MXN
            'fixed',  -- Precio fijo
            true,  -- Activo
            false,  -- No popular por defecto
            0,  -- Contador de completados inicializado en 0
            'Mantenimiento profesional a sistema de CCTV con 4 canales. Incluye limpieza de cámaras, verificación de conexiones, actualización de firmware, revisión de grabaciones y ajustes de configuración. Únicamente mano de obra, sin materiales.',
            false,  -- NO incluye materiales (únicamente mano de obra)
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Servicio CCTV "Mantenimiento a Sistema de CCTV con 4 canales" creado exitosamente';
    ELSE
        -- Si existe con otro nombre, actualizarlo al nombre estándar
        UPDATE service_catalog
        SET 
            service_name = 'Mantenimiento a Sistema de CCTV con 4 canales (únicamente mano de obra)',
            min_price = 1500,
            price_type = 'fixed',
            includes_materials = false,
            description = 'Mantenimiento profesional a sistema de CCTV con 4 canales. Incluye limpieza de cámaras, verificación de conexiones, actualización de firmware, revisión de grabaciones y ajustes de configuración. Únicamente mano de obra, sin materiales.',
            updated_at = NOW()
        WHERE discipline = 'cctv'
        AND is_active = true
        AND (
            service_name LIKE '%Mantenimiento%Sistema%CCTV%'
            OR service_name LIKE '%Mantenimiento%CCTV%4 canales%'
            OR service_name LIKE '%Mantenimiento%CCTV%4 canales%'
            OR service_name LIKE '%Mantenimiento%4 canales%'
        )
        AND service_name != 'Mantenimiento a Sistema de CCTV con 4 canales (únicamente mano de obra)';
        
        IF FOUND THEN
            RAISE NOTICE '✅ Servicio CCTV "Mantenimiento a Sistema de CCTV con 4 canales" actualizado al nombre estándar';
        ELSE
            RAISE NOTICE '⚠️ El servicio "Mantenimiento a Sistema de CCTV con 4 canales" ya existe, omitiendo...';
        END IF;
    END IF;
END $$;

-- Verificar que se creó correctamente
SELECT 
    id,
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    is_popular,
    includes_materials,
    description
FROM service_catalog
WHERE discipline = 'cctv'
AND is_active = true
ORDER BY min_price ASC;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Deberías ver 4 servicios de CCTV (ordenados por precio):
-- 1. Visita Técnica de Levantamiento en Sitio (para proyectos personalizados de más de 4 cámaras) - $600
-- 2. Instalación de cámara de CCTV wifi - $800
-- 3. Mantenimiento a Sistema de CCTV con 4 canales (únicamente mano de obra) - $1500
-- 4. Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales) - $2000
-- =====================================================
