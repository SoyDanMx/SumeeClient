-- =====================================================
-- AGREGAR SERVICIO: Visita Técnica de Levantamiento en Sitio
-- =====================================================
-- Descripción: Visita Técnica de Levantamiento en Sitio (para proyectos personalizados de más de 4 cámaras)
-- Precio: $600 MXN
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
            service_name = 'Visita Técnica de Levantamiento en Sitio (para proyectos personalizados de más de 4 cámaras)'
            OR service_name LIKE '%Visita Técnica%'
            OR service_name LIKE '%Visita Tecnica%'
            OR service_name LIKE '%Levantamiento en Sitio%'
            OR service_name LIKE '%Levantamiento%'
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
            'Visita Técnica de Levantamiento en Sitio (para proyectos personalizados de más de 4 cámaras)',
            'cctv',
            600,  -- Precio: $600 MXN
            'fixed',  -- Precio fijo
            true,  -- Activo
            false,  -- No popular por defecto
            0,  -- Contador de completados inicializado en 0
            'Visita técnica profesional para levantamiento en sitio. Incluye evaluación del espacio, mediciones, planificación del proyecto y recomendaciones técnicas. Ideal para proyectos personalizados de más de 4 cámaras de seguridad CCTV.',
            false,  -- NO incluye materiales (solo servicio de visita técnica)
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Servicio CCTV "Visita Técnica de Levantamiento" creado exitosamente';
    ELSE
        -- Si existe con otro nombre, actualizarlo al nombre estándar
        UPDATE service_catalog
        SET 
            service_name = 'Visita Técnica de Levantamiento en Sitio (para proyectos personalizados de más de 4 cámaras)',
            min_price = 600,
            price_type = 'fixed',
            includes_materials = false,
            description = 'Visita técnica profesional para levantamiento en sitio. Incluye evaluación del espacio, mediciones, planificación del proyecto y recomendaciones técnicas. Ideal para proyectos personalizados de más de 4 cámaras de seguridad CCTV.',
            updated_at = NOW()
        WHERE discipline = 'cctv'
        AND is_active = true
        AND (
            service_name LIKE '%Visita Técnica%'
            OR service_name LIKE '%Visita Tecnica%'
            OR service_name LIKE '%Levantamiento en Sitio%'
            OR service_name LIKE '%Levantamiento%'
        )
        AND service_name != 'Visita Técnica de Levantamiento en Sitio (para proyectos personalizados de más de 4 cámaras)';
        
        IF FOUND THEN
            RAISE NOTICE '✅ Servicio CCTV "Visita Técnica de Levantamiento" actualizado al nombre estándar';
        ELSE
            RAISE NOTICE '⚠️ El servicio "Visita Técnica de Levantamiento" ya existe, omitiendo...';
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
-- Deberías ver 3 servicios de CCTV (ordenados por precio):
-- 1. Visita Técnica de Levantamiento en Sitio (para proyectos personalizados de más de 4 cámaras) - $600
-- 2. Instalación de cámara de CCTV wifi - $800
-- 3. Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales) - $2000
-- =====================================================
