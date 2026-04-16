-- ============================================================================
-- FIX: Agregar columna actual_service_name si no existe
-- ============================================================================
-- Este script verifica y agrega la columna actual_service_name a ml_interactions
-- si no existe en la base de datos.

DO $$
BEGIN
    -- Verificar si la columna existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'actual_service_name'
    ) THEN
        -- Agregar la columna
        ALTER TABLE public.ml_interactions
        ADD COLUMN actual_service_name TEXT;
        
        RAISE NOTICE '✅ Columna actual_service_name agregada a ml_interactions';
    ELSE
        RAISE NOTICE 'ℹ️  Columna actual_service_name ya existe en ml_interactions';
    END IF;
END $$;

-- Verificar también predicted_service_name
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'predicted_service_name'
    ) THEN
        ALTER TABLE public.ml_interactions
        ADD COLUMN predicted_service_name TEXT;
        
        RAISE NOTICE '✅ Columna predicted_service_name agregada a ml_interactions';
    ELSE
        RAISE NOTICE 'ℹ️  Columna predicted_service_name ya existe en ml_interactions';
    END IF;
END $$;

-- Verificar todas las columnas necesarias
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ml_interactions'
AND column_name IN (
    'actual_service_name',
    'predicted_service_name',
    'actual_service_id',
    'predicted_service_id',
    'query',
    'query_embedding',
    'conversion',
    'features'
)
ORDER BY column_name;

