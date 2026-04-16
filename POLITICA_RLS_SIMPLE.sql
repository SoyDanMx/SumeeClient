-- =========================================================================
-- POLÍTICA RLS SIMPLE: Permitir lectura de todos los profiles
-- =========================================================================
-- ⚠️ SOLO USAR SI NECESITAS ACCESO PÚBLICO COMPLETO
-- Para producción, usa la política más restrictiva

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow read profiles" ON profiles;
DROP POLICY IF EXISTS "Public read profiles" ON profiles;

-- Crear política simple (permite leer todos los profiles)
CREATE POLICY "Public read profiles"
ON profiles FOR SELECT
TO public
USING (true);

-- Verificar
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

