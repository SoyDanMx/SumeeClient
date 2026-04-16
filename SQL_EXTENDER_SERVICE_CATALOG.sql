-- =========================================================================
-- EXTENSIÓN DE service_catalog PARA VANGUARDIA TECNOLÓGICA
-- =========================================================================
-- Fecha: 2025-01-XX
-- Objetivo: Agregar campos necesarios para alineación con web y app cliente
-- =========================================================================

-- 1. AGREGAR COLUMNAS NUEVAS
-- =========================================================================

ALTER TABLE public.service_catalog
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'pro' CHECK (service_type IN ('express', 'pro')),
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS category_group TEXT CHECK (category_group IN ('mantenimiento', 'tecnologia', 'especializado', 'construccion')),
ADD COLUMN IF NOT EXISTS completed_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS badge_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. CREAR ÍNDICES PARA PERFORMANCE
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_service_catalog_popular 
    ON public.service_catalog(is_popular) 
    WHERE is_popular = true;

CREATE INDEX IF NOT EXISTS idx_service_catalog_category_group 
    ON public.service_catalog(category_group)
    WHERE category_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_catalog_type 
    ON public.service_catalog(service_type)
    WHERE service_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_catalog_display_order 
    ON public.service_catalog(display_order);

-- 3. MARCAR SERVICIOS POPULARES (Basado en web)
-- =========================================================================

-- Servicios populares según https://sumeeapp.com/servicios
UPDATE public.service_catalog
SET 
    is_popular = true,
    service_type = 'express',
    badge_tags = ARRAY['urgencias', 'popular'],
    completed_count = 500
WHERE discipline IN ('plomeria', 'electricidad')
AND is_active = true;

UPDATE public.service_catalog
SET 
    is_popular = true,
    service_type = 'pro',
    badge_tags = ARRAY['mantenimiento', 'popular'],
    completed_count = 500
WHERE discipline = 'aire-acondicionado'
AND is_active = true;

-- Cargadores Eléctricos y Paneles Solares (si existen)
UPDATE public.service_catalog
SET 
    is_popular = true,
    service_type = 'pro',
    badge_tags = ARRAY['especializado', 'popular'],
    completed_count = 500
WHERE (service_name ILIKE '%cargador%eléctrico%'
   OR service_name ILIKE '%panel%solar%')
AND is_active = true;

-- 4. ASIGNAR CATEGORY_GROUP
-- =========================================================================

-- Mantenimiento
UPDATE public.service_catalog
SET category_group = 'mantenimiento'
WHERE discipline IN ('carpinteria', 'pintura', 'limpieza', 'jardineria')
AND is_active = true;

-- Tecnología
UPDATE public.service_catalog
SET category_group = 'tecnologia'
WHERE discipline IN ('cctv', 'wifi')
AND is_active = true;

-- Especializado
UPDATE public.service_catalog
SET category_group = 'especializado'
WHERE discipline IN ('fumigacion')
AND is_active = true;

-- Construcción
UPDATE public.service_catalog
SET category_group = 'construccion'
WHERE discipline IN ('tablaroca', 'construccion')
AND is_active = true;

-- 5. ASIGNAR SERVICE_TYPE POR DISCIPLINA
-- =========================================================================

-- Express (Urgencias)
UPDATE public.service_catalog
SET service_type = 'express'
WHERE discipline IN ('plomeria', 'electricidad', 'cerrajeria')
AND service_type IS NULL
AND is_active = true;

-- Pro (Programados)
UPDATE public.service_catalog
SET service_type = 'pro'
WHERE service_type IS NULL
AND is_active = true;

-- 6. ASIGNAR BADGE_TAGS POR TIPO
-- =========================================================================

-- Urgencias
UPDATE public.service_catalog
SET badge_tags = ARRAY['urgencias']
WHERE service_type = 'express'
AND (badge_tags IS NULL OR array_length(badge_tags, 1) = 0)
AND is_active = true;

-- Mantenimiento
UPDATE public.service_catalog
SET badge_tags = ARRAY['mantenimiento']
WHERE category_group = 'mantenimiento'
AND (badge_tags IS NULL OR array_length(badge_tags, 1) = 0)
AND is_active = true;

-- Especializado
UPDATE public.service_catalog
SET badge_tags = ARRAY['especializado']
WHERE category_group = 'especializado'
AND (badge_tags IS NULL OR array_length(badge_tags, 1) = 0)
AND is_active = true;

-- 7. ASIGNAR DISPLAY_ORDER
-- =========================================================================

-- Ordenar por precio mínimo dentro de cada disciplina
WITH ordered_services AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY discipline ORDER BY min_price ASC) as rn
    FROM public.service_catalog
    WHERE is_active = true
)
UPDATE public.service_catalog sc
SET display_order = os.rn
FROM ordered_services os
WHERE sc.id = os.id;

-- 8. VERIFICACIÓN
-- =========================================================================

-- Verificar servicios populares
SELECT 
    service_name,
    discipline,
    service_type,
    is_popular,
    category_group,
    badge_tags,
    min_price,
    price_type
FROM public.service_catalog
WHERE is_popular = true
ORDER BY display_order;

-- Verificar servicios por grupo
SELECT 
    category_group,
    COUNT(*) as total_services
FROM public.service_catalog
WHERE category_group IS NOT NULL
AND is_active = true
GROUP BY category_group
ORDER BY category_group;

-- Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'service_catalog'
AND schemaname = 'public';

