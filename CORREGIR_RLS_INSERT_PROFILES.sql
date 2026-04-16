-- ============================================================================
-- CORREGIR RLS PARA INSERT EN PROFILES
-- ============================================================================
-- Este script crea la política RLS necesaria para permitir que los usuarios
-- autenticados creen su propio perfil en la tabla profiles
-- ============================================================================

-- 1. VERIFICAR Y CREAR POLÍTICA DE INSERT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can insert their own profile'
    ) THEN
        RAISE NOTICE 'Creando política RLS para INSERT...';
        
        CREATE POLICY "Users can insert their own profile"
        ON public.profiles
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
        
        RAISE NOTICE '✅ Política RLS de INSERT creada exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ Política RLS de INSERT ya existe';
    END IF;
END $$;

-- 2. VERIFICAR QUE RLS ESTÉ HABILITADO
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

-- 3. VERIFICAR TODAS LAS POLÍTICAS EXISTENTES
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- 4. MENSAJE FINAL
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Verificación completada';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Políticas RLS en profiles:';
    RAISE NOTICE '  • INSERT: Usuarios autenticados pueden crear su propio perfil';
    RAISE NOTICE '  • SELECT: Usuarios autenticados pueden ver su propio perfil';
    RAISE NOTICE '  • UPDATE: Usuarios autenticados pueden actualizar su propio perfil';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Si aún hay problemas, verifica:';
    RAISE NOTICE '  1. Que el usuario esté autenticado (auth.uid() no es null)';
    RAISE NOTICE '  2. Que user_id en el INSERT coincida con auth.uid()';
    RAISE NOTICE '  3. Que todas las columnas requeridas estén presentes';
    RAISE NOTICE '';
END $$;

