-- =========================================================================
-- RESTAURAR VISIBILIDAD DE PROFESIONALES EN LA WEB
-- =========================================================================
-- Problema: Los profesionales no aparecen en https://sumeeapp.com/tecnicos
-- Causa: Política RLS puede estar bloqueando lectura pública
-- Solución: Asegurar que la política pública permita leer profesionales
-- =========================================================================

-- =========================================================================
-- 1. VERIFICAR POLÍTICAS ACTUALES DE SELECT
-- =========================================================================
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    roles
FROM pg_policies
WHERE tablename = 'profiles'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- =========================================================================
-- 2. VERIFICAR SI EXISTE LA POLÍTICA PÚBLICA PARA PROFESIONALES
-- =========================================================================
SELECT 
    policyname,
    cmd,
    qual,
    roles
FROM pg_policies
WHERE tablename = 'profiles'
  AND cmd = 'SELECT'
  AND policyname = 'Allow read professionals';

-- =========================================================================
-- 3. RECREAR POLÍTICA PÚBLICA PARA PROFESIONALES
-- =========================================================================
-- Esta política permite que CUALQUIERA (público) pueda leer profesionales
-- Es necesaria para que la web funcione sin autenticación

-- Eliminar política existente si hay problemas
DROP POLICY IF EXISTS "Allow read professionals" ON profiles;

-- Crear política pública que permita leer profesionales
CREATE POLICY "Allow read professionals"
ON profiles FOR SELECT
TO public
USING (
    (role = 'profesional' OR role = 'professional')
    AND profession IS NOT NULL
    AND profession != ''
    AND user_type != 'client'
    AND role != 'client'
);

-- =========================================================================
-- 4. VERIFICAR QUE SE CREÓ CORRECTAMENTE
-- =========================================================================
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    roles
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'Allow read professionals';

-- =========================================================================
-- 5. PROBAR LA QUERY COMO USUARIO PÚBLICO (sin autenticación)
-- =========================================================================
-- Esta query debería funcionar ahora y devolver profesionales
SELECT 
    user_id,
    full_name,
    profession,
    calificacion_promedio,
    avatar_url,
    areas_servicio,
    ubicacion_lat,
    ubicacion_lng,
    whatsapp,
    role,
    user_type
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type != 'client'
  AND role != 'client'
ORDER BY calificacion_promedio DESC NULLS LAST
LIMIT 20;

-- =========================================================================
-- 6. CONTAR PROFESIONALES DISPONIBLES
-- =========================================================================
SELECT 
    COUNT(*) as total_profesionales_visibles
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type != 'client'
  AND role != 'client';

-- =========================================================================
-- NOTAS IMPORTANTES:
-- =========================================================================
-- 1. La política debe ser PÚBLICA (roles: {public}) para que la web funcione
-- 2. Esta política NO interfiere con otras políticas (INSERT, UPDATE, DELETE)
-- 3. Solo permite leer profesionales que cumplan los criterios
-- 4. Excluye explícitamente clientes
-- 5. Si después de ejecutar esto aún no aparecen, verificar:
--    - Que existan profesionales en la BD con role = 'profesional'
--    - Que tengan profession no nulo
--    - Que NO sean user_type = 'client'
-- =========================================================================

