-- ============================================================================
-- VERIFICACIÓN COMPLETA: Schema de ml_interactions
-- ============================================================================
-- Este script verifica todas las columnas necesarias y las agrega si faltan

-- 1. Verificar y agregar actual_service_name
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'actual_service_name'
    ) THEN
        ALTER TABLE public.ml_interactions ADD COLUMN actual_service_name TEXT;
        RAISE NOTICE '✅ actual_service_name agregada';
    END IF;
END $$;

-- 2. Verificar y agregar predicted_service_name
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'predicted_service_name'
    ) THEN
        ALTER TABLE public.ml_interactions ADD COLUMN predicted_service_name TEXT;
        RAISE NOTICE '✅ predicted_service_name agregada';
    END IF;
END $$;

-- 3. Verificar y agregar user_feedback
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'user_feedback'
    ) THEN
        ALTER TABLE public.ml_interactions ADD COLUMN user_feedback TEXT;
        RAISE NOTICE '✅ user_feedback agregada';
    END IF;
END $$;

-- 4. Verificar y agregar was_correct
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'was_correct'
    ) THEN
        ALTER TABLE public.ml_interactions ADD COLUMN was_correct BOOLEAN;
        RAISE NOTICE '✅ was_correct agregada';
    END IF;
END $$;

-- 5. Verificar y agregar time_of_day
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'time_of_day'
    ) THEN
        ALTER TABLE public.ml_interactions ADD COLUMN time_of_day INTEGER;
        RAISE NOTICE '✅ time_of_day agregada';
    END IF;
END $$;

-- 6. Verificar y agregar day_of_week
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'day_of_week'
    ) THEN
        ALTER TABLE public.ml_interactions ADD COLUMN day_of_week INTEGER;
        RAISE NOTICE '✅ day_of_week agregada';
    END IF;
END $$;

-- 7. Verificar y agregar user_location_lat
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'user_location_lat'
    ) THEN
        ALTER TABLE public.ml_interactions ADD COLUMN user_location_lat NUMERIC(10, 7);
        RAISE NOTICE '✅ user_location_lat agregada';
    END IF;
END $$;

-- 8. Verificar y agregar user_location_lng
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'user_location_lng'
    ) THEN
        ALTER TABLE public.ml_interactions ADD COLUMN user_location_lng NUMERIC(10, 7);
        RAISE NOTICE '✅ user_location_lng agregada';
    END IF;
END $$;

-- 9. Verificar y agregar features
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'features'
    ) THEN
        ALTER TABLE public.ml_interactions ADD COLUMN features JSONB;
        RAISE NOTICE '✅ features agregada';
    END IF;
END $$;

-- 10. Verificar y agregar query_embedding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'query_embedding'
    ) THEN
        ALTER TABLE public.ml_interactions ADD COLUMN query_embedding vector(384);
        RAISE NOTICE '✅ query_embedding agregada';
    END IF;
END $$;

-- ============================================================================
-- REPORTE FINAL: Mostrar todas las columnas de ml_interactions
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ml_interactions'
ORDER BY ordinal_position;

