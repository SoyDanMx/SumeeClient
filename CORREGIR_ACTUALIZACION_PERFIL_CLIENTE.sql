-- ============================================================================
-- CORREGIR ACTUALIZACIÓN DE PERFIL DE CLIENTE
-- ============================================================================
-- Este script verifica y corrige las políticas RLS para permitir que los
-- clientes actualicen su propio perfil (foto y datos personales)
-- ============================================================================

-- 1. VERIFICAR SI EXISTE LA POLÍTICA DE UPDATE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        RAISE NOTICE 'Creando política RLS para UPDATE...';
        
        CREATE POLICY "Users can update their own profile"
        ON public.profiles
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
        
        RAISE NOTICE '✅ Política RLS de UPDATE creada exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ Política RLS de UPDATE ya existe';
    END IF;
END $$;

-- 2. VERIFICAR SI EXISTE LA POLÍTICA DE SELECT (para que el usuario pueda ver su perfil)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        RAISE NOTICE 'Creando política RLS para SELECT...';
        
        CREATE POLICY "Users can view their own profile"
        ON public.profiles
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
        
        RAISE NOTICE '✅ Política RLS de SELECT creada exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ Política RLS de SELECT ya existe';
    END IF;
END $$;

-- 3. VERIFICAR QUE RLS ESTÉ HABILITADO
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado en profiles';
    ELSE
        RAISE NOTICE 'ℹ️ RLS ya está habilitado en profiles';
    END IF;
END $$;

-- 4. VERIFICAR COLUMNAS NECESARIAS PARA ACTUALIZACIÓN
DO $$
BEGIN
    -- Verificar avatar_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '✅ Columna avatar_url creada';
    ELSE
        RAISE NOTICE 'ℹ️ Columna avatar_url ya existe';
    END IF;

    -- Verificar full_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
        RAISE NOTICE '✅ Columna full_name creada';
    ELSE
        RAISE NOTICE 'ℹ️ Columna full_name ya existe';
    END IF;

    -- Verificar phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
        RAISE NOTICE '✅ Columna phone creada';
    ELSE
        RAISE NOTICE 'ℹ️ Columna phone ya existe';
    END IF;

    -- Verificar whatsapp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'whatsapp'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN whatsapp TEXT;
        RAISE NOTICE '✅ Columna whatsapp creada';
    ELSE
        RAISE NOTICE 'ℹ️ Columna whatsapp ya existe';
    END IF;

    -- Verificar city
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN city TEXT;
        RAISE NOTICE '✅ Columna city creada';
    ELSE
        RAISE NOTICE 'ℹ️ Columna city ya existe';
    END IF;

    -- Verificar state
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'state'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN state TEXT;
        RAISE NOTICE '✅ Columna state creada';
    ELSE
        RAISE NOTICE 'ℹ️ Columna state ya existe';
    END IF;

    -- Verificar updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Columna updated_at creada';
    ELSE
        RAISE NOTICE 'ℹ️ Columna updated_at ya existe';
    END IF;
END $$;

-- 5. VERIFICAR POLÍTICAS EXISTENTES (para debugging)
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- 6. MENSAJE FINAL
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Verificación completada';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Resumen:';
    RAISE NOTICE '  • Políticas RLS verificadas/creadas';
    RAISE NOTICE '  • Columnas necesarias verificadas/creadas';
    RAISE NOTICE '  • RLS habilitado en profiles';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Si aún hay problemas, verifica:';
    RAISE NOTICE '  1. Que el usuario esté autenticado (auth.uid() no es null)';
    RAISE NOTICE '  2. Que user_id en profiles coincida con auth.uid()';
    RAISE NOTICE '  3. Que el bucket de Storage tenga permisos correctos';
    RAISE NOTICE '';
END $$;

