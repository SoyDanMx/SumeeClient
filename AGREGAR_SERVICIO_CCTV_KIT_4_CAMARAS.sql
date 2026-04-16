-- =====================================================
-- AGREGAR SERVICIO: Instalación de Kit de 4 Cámaras de CCTV
-- =====================================================
-- Descripción: Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales)
-- Precio: $2000 MXN
-- Disciplina: cctv
-- =====================================================

-- Verificar si el servicio ya existe
DO $$
BEGIN
    -- Verificar si ya existe un servicio con este nombre exacto O nombres similares
    -- (alineado con Sumeeapp-B que usa "Instalar Kit de 4 Cámaras")
    IF NOT EXISTS (
        SELECT 1 FROM service_catalog 
        WHERE discipline = 'cctv'
        AND is_active = true
        AND (
            service_name = 'Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales)'
            OR service_name = 'Instalar Kit de 4 Cámaras'
            OR service_name LIKE '%Kit de 4 Cámaras%'
            OR service_name LIKE '%4 cámaras%'
            OR service_name LIKE '%4 camaras%'
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
            'Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales)',
            'cctv',
            2000,  -- Precio: $2000 MXN
            'fixed',  -- Precio fijo
            true,  -- Activo
            false,  -- No popular por defecto (puedes cambiarlo a true si quieres)
            0,  -- Contador de completados inicializado en 0
            'Instalación profesional de kit de 4 cámaras de seguridad CCTV. Incluye mano de obra únicamente, sin materiales.',
            false,  -- NO incluye materiales (únicamente mano de obra)
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Servicio CCTV "Kit de 4 Cámaras" creado exitosamente';
    ELSE
        -- Si existe con otro nombre, actualizarlo al nombre estándar
        UPDATE service_catalog
        SET 
            service_name = 'Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales)',
            min_price = 2000,
            price_type = 'fixed',
            includes_materials = false,
            description = 'Instalación profesional de kit de 4 cámaras de seguridad CCTV. Incluye mano de obra únicamente, sin materiales.',
            updated_at = NOW()
        WHERE discipline = 'cctv'
        AND is_active = true
        AND (
            service_name = 'Instalar Kit de 4 Cámaras'
            OR service_name LIKE '%Kit de 4 Cámaras%'
            OR service_name LIKE '%4 cámaras%'
            OR service_name LIKE '%4 camaras%'
        )
        AND service_name != 'Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales)';
        
        IF FOUND THEN
            RAISE NOTICE '✅ Servicio CCTV "Kit de 4 Cámaras" actualizado al nombre estándar';
        ELSE
            RAISE NOTICE '⚠️ El servicio "Kit de 4 Cámaras de CCTV" ya existe, omitiendo...';
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
ORDER BY created_at DESC;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Deberías ver 2 servicios de CCTV:
-- 1. Instalación de cámara de CCTV wifi - $800
-- 2. Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales) - $2000
-- =====================================================
