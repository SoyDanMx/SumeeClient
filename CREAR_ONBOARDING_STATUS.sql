-- =========================================================================
-- CREAR SOLO LA COLUMNA FALTANTE: onboarding_status
-- =========================================================================
-- Basado en la estructura actual de profiles, solo falta esta columna
-- Las demás columnas ya existen

-- Verificar y crear onboarding_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'onboarding_status'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN onboarding_status TEXT 
        CHECK (onboarding_status IN ('approved', 'pending_review', 'rejected', 'waitlist_other_city'));
        
        RAISE NOTICE '✅ Columna onboarding_status creada exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ Columna onboarding_status ya existe';
    END IF;
END $$;

-- Verificar que se creó correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'onboarding_status';

