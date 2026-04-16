-- =========================================================================
-- CREAR COLUMNAS FALTANTES EN PROFILES
-- =========================================================================
-- Ejecuta este script ANTES de ejecutar los triggers
-- Crea las columnas que pueden no existir en la tabla profiles

-- Verificar y crear certificaciones_urls (array de textos)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'certificaciones_urls'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN certificaciones_urls TEXT[];
        
        RAISE NOTICE 'Columna certificaciones_urls creada';
    ELSE
        RAISE NOTICE 'Columna certificaciones_urls ya existe';
    END IF;
END $$;

-- Verificar y crear antecedentes_no_penales_url
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'antecedentes_no_penales_url'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN antecedentes_no_penales_url TEXT;
        
        RAISE NOTICE 'Columna antecedentes_no_penales_url creada';
    ELSE
        RAISE NOTICE 'Columna antecedentes_no_penales_url ya existe';
    END IF;
END $$;

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
        
        RAISE NOTICE 'Columna onboarding_status creada';
    ELSE
        RAISE NOTICE 'Columna onboarding_status ya existe';
    END IF;
END $$;

-- Verificar y crear updated_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Columna updated_at creada';
    ELSE
        RAISE NOTICE 'Columna updated_at ya existe';
    END IF;
END $$;

-- Verificar que calificacion_promedio existe (puede tener otro nombre)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'calificacion_promedio'
    ) THEN
        -- Intentar crear como NUMERIC
        BEGIN
            ALTER TABLE public.profiles 
            ADD COLUMN calificacion_promedio NUMERIC(3,2) DEFAULT 0.00;
            
            RAISE NOTICE 'Columna calificacion_promedio creada';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error creando calificacion_promedio: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Columna calificacion_promedio ya existe';
    END IF;
END $$;

-- Verificar que profession existe (puede tener otro nombre)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'profession'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN profession TEXT;
        
        RAISE NOTICE 'Columna profession creada';
    ELSE
        RAISE NOTICE 'Columna profession ya existe';
    END IF;
END $$;

-- Verificar que avatar_url existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN avatar_url TEXT;
        
        RAISE NOTICE 'Columna avatar_url creada';
    ELSE
        RAISE NOTICE 'Columna avatar_url ya existe';
    END IF;
END $$;

-- Verificar que full_name existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN full_name TEXT;
        
        RAISE NOTICE 'Columna full_name creada';
    ELSE
        RAISE NOTICE 'Columna full_name ya existe';
    END IF;
END $$;

-- Mostrar resumen de columnas
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
      'avatar_url',
      'full_name',
      'profession',
      'certificaciones_urls',
      'antecedentes_no_penales_url',
      'onboarding_status',
      'calificacion_promedio',
      'updated_at'
  )
ORDER BY column_name;

