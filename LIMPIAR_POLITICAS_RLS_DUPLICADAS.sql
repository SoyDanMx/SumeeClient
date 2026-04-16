-- =========================================================================
-- LIMPIAR POLÍTICAS RLS DUPLICADAS EN PROFILES
-- =========================================================================
-- Problema: Hay múltiples políticas de UPDATE que pueden causar conflictos
-- Solución: Eliminar duplicadas y dejar solo las correctas
-- =========================================================================

-- =========================================================================
-- 1. ELIMINAR POLÍTICAS DUPLICADAS DE UPDATE
-- =========================================================================
-- Eliminar políticas antiguas o duplicadas
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Profiles update self" ON profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON profiles;

-- Mantener solo esta política de UPDATE (la más completa)
-- Si no existe, crearla
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- 2. VERIFICAR POLÍTICAS FINALES
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
-- RESULTADO ESPERADO:
-- =========================================================================
-- SELECT:
--   - "Allow read professionals" (pública, para profesionales)
--   - "Users can view their own profile" (autenticados, propio)
--
-- INSERT:
--   - "Users can insert their own profile" (autenticados, propio)
--
-- UPDATE:
--   - "Users can update their own profile" (autenticados, propio)
--
-- DELETE:
--   - "Users can delete their own profile." (autenticados, propio)
-- =========================================================================

