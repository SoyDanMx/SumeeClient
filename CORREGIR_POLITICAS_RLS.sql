-- =========================================================================
-- CORREGIR POLÍTICAS RLS: Eliminar políticas permisivas conflictivas
-- =========================================================================
-- Problema: Hay múltiples políticas que permiten leer TODO (qual: true)
-- Esto hace que la política restrictiva no funcione correctamente
-- 
-- Solución: Eliminar las políticas permisivas y dejar solo la restrictiva

-- 1. ELIMINAR POLÍTICAS PERMISIVAS (que permiten leer todo)
-- =========================================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Profiles visibles" ON profiles;
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow read profiles" ON profiles;

-- 2. MANTENER SOLO LA POLÍTICA RESTRICTIVA
-- =========================================================================
-- La política "Allow read professionals" ya existe y es la correcta
-- No necesitamos crearla de nuevo, solo verificar que esté activa

-- 3. VERIFICAR POLÍTICAS ACTUALES
-- =========================================================================
SELECT 
    policyname,
    cmd,
    qual,
    roles
FROM pg_policies
WHERE tablename = 'profiles'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- 4. RESULTADO ESPERADO
-- =========================================================================
-- Después de ejecutar, solo deberías ver:
-- - "Allow read professionals" (restrictiva - solo profesionales)
-- 
-- Las políticas de UPDATE y DELETE se mantienen intactas

