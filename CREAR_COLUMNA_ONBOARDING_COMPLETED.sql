-- ============================================================================
-- CREAR COLUMNA onboarding_completed EN profiles
-- ============================================================================
-- Esta columna indica si el usuario ha completado el onboarding
-- ============================================================================

-- Verificar si la columna existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'onboarding_completed'
    ) THEN
        -- Crear la columna
        ALTER TABLE profiles 
        ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
        
        RAISE NOTICE '✅ Columna onboarding_completed creada exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ Columna onboarding_completed ya existe';
    END IF;
END $$;

-- Verificar que se creó correctamente
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'onboarding_completed';

