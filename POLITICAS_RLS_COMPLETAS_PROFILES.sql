-- =========================================================================
-- POLÍTICAS RLS COMPLETAS PARA PROFILES
-- =========================================================================
-- Este script crea todas las políticas RLS necesarias para que la app funcione
-- Incluye: SELECT, INSERT, UPDATE para usuarios autenticados
-- =========================================================================

-- =========================================================================
-- 1. POLÍTICA DE SELECT (Leer propio perfil)
-- =========================================================================
-- Permite que usuarios autenticados lean su propio perfil
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =========================================================================
-- 2. POLÍTICA DE INSERT (Crear propio perfil) ✅ YA CREADA
-- =========================================================================
-- Verificar si ya existe, si no, crearla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile"
        ON profiles FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- =========================================================================
-- 3. POLÍTICA DE UPDATE (Actualizar propio perfil)
-- =========================================================================
-- Permite que usuarios autenticados actualicen su propio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- 4. VERIFICAR TODAS LAS POLÍTICAS
-- =========================================================================
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    roles
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- =========================================================================
-- NOTAS:
-- =========================================================================
-- 1. SELECT: Usuarios pueden leer su propio perfil
-- 2. INSERT: Usuarios pueden crear su propio perfil
-- 3. UPDATE: Usuarios pueden actualizar su propio perfil
-- 4. La política "Allow read professionals" (SELECT pública) debe mantenerse
--    para que los profesionales aparezcan en la app
-- =========================================================================

