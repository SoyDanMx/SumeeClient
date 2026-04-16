-- =========================================================================
-- POLÍTICA RLS PARA PERMITIR LECTURA DE PROFILES (Solo Profesionales)
-- =========================================================================
-- Esta política permite que los usuarios lean profiles, pero solo profesionales
-- para la sección de "Profesionales Destacados"

-- 1. ELIMINAR POLÍTICA EXISTENTE (si existe)
-- =========================================================================
DROP POLICY IF EXISTS "Allow read profiles" ON profiles;
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow read professionals" ON profiles;

-- 2. CREAR POLÍTICA NUEVA (Permitir lectura de profesionales)
-- =========================================================================
CREATE POLICY "Allow read professionals"
ON profiles FOR SELECT
TO public
USING (
    -- Solo permitir lectura de profesionales
    (role = 'profesional' OR role = 'professional')
    AND profession IS NOT NULL
    AND profession != ''
    AND user_type != 'client'
    AND role != 'client'
);

-- 3. VERIFICAR QUE LA POLÍTICA SE CREÓ
-- =========================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. PROBAR LA QUERY (Opcional - para verificar)
-- =========================================================================
-- Esta query debería funcionar ahora:
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession
FROM profiles
WHERE role = 'profesional'
  AND profession IS NOT NULL
  AND user_type != 'client'
LIMIT 5;

