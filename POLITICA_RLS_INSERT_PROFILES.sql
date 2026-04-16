-- =========================================================================
-- POLÍTICA RLS PARA INSERT EN PROFILES
-- =========================================================================
-- Problema: Los usuarios no pueden crear su propio perfil
-- Error: "new row violates row-level security policy"
-- 
-- Solución: Crear política que permita INSERT cuando user_id = auth.uid()
-- =========================================================================

-- 1. ELIMINAR POLÍTICAS DE INSERT EXISTENTES (si hay conflictos)
-- =========================================================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

-- 2. CREAR POLÍTICA PARA INSERT
-- =========================================================================
-- Permite que un usuario autenticado cree su propio perfil
-- Solo si el user_id coincide con el usuario autenticado (auth.uid())
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
);

-- 3. VERIFICAR POLÍTICAS DE INSERT
-- =========================================================================
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    roles
FROM pg_policies
WHERE tablename = 'profiles'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- =========================================================================
-- NOTAS:
-- =========================================================================
-- 1. Esta política permite que usuarios autenticados creen su perfil
-- 2. Solo pueden crear perfil con su propio user_id (auth.uid())
-- 3. No pueden crear perfiles para otros usuarios
-- =========================================================================

