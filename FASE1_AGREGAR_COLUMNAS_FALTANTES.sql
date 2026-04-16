-- ============================================================================
-- AGREGAR COLUMNAS FALTANTES A ml_interactions
-- ============================================================================
-- El código de tracking.ts usa estas columnas que pueden faltar:
-- - lead_id
-- - predicted_confidence

-- 1. Verificar y agregar lead_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'lead_id'
    ) THEN
        ALTER TABLE public.ml_interactions ADD COLUMN lead_id UUID;
        RAISE NOTICE '✅ lead_id agregada';
    ELSE
        RAISE NOTICE 'ℹ️  lead_id ya existe';
    END IF;
END $$;

-- 2. Verificar y agregar predicted_confidence
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'predicted_confidence'
    ) THEN
        ALTER TABLE public.ml_interactions ADD COLUMN predicted_confidence NUMERIC(3, 2);
        RAISE NOTICE '✅ predicted_confidence agregada';
    ELSE
        RAISE NOTICE 'ℹ️  predicted_confidence ya existe';
    END IF;
END $$;

-- 3. Verificar y agregar created_at (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.ml_interactions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ created_at agregada';
    ELSE
        RAISE NOTICE 'ℹ️  created_at ya existe';
    END IF;
END $$;

-- ============================================================================
-- REPORTE FINAL: Verificar todas las columnas
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

