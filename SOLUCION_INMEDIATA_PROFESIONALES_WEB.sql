-- =========================================================================
-- SOLUCIÓN INMEDIATA: Restaurar Profesionales en la Web
-- =========================================================================
-- Problema: "0 profesionales encontrados" en https://sumeeapp.com/tecnicos
-- Causa: Política RLS bloqueando lectura pública
-- Solución: Asegurar política pública correcta
-- =========================================================================

-- =========================================================================
-- PASO 1: ELIMINAR POLÍTICA EXISTENTE (si está mal configurada)
-- =========================================================================
DROP POLICY IF EXISTS "Allow read professionals" ON profiles;

-- =========================================================================
-- PASO 2: CREAR POLÍTICA PÚBLICA CORRECTA
-- =========================================================================
-- CRÍTICO: Debe ser TO public para que funcione sin autenticación
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
-- PASO 3: VERIFICAR QUE SE CREÓ CORRECTAMENTE
-- =========================================================================
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'Allow read professionals';

-- =========================================================================
-- PASO 4: PROBAR QUERY (debe devolver profesionales)
-- =========================================================================
SELECT 
    user_id,
    full_name,
    profession,
    calificacion_promedio,
    avatar_url,
    areas_servicio
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type != 'client'
  AND role != 'client'
ORDER BY calificacion_promedio DESC NULLS LAST
LIMIT 10;

-- =========================================================================
-- PASO 5: CONTAR PROFESIONALES DISPONIBLES
-- =========================================================================
SELECT COUNT(*) as total_profesionales
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type != 'client'
  AND role != 'client';

-- =========================================================================
-- VERIFICACIÓN FINAL
-- =========================================================================
-- Después de ejecutar este script:
-- 1. La query del PASO 4 debe devolver profesionales
-- 2. El conteo del PASO 5 debe ser > 0
-- 3. Recargar https://sumeeapp.com/tecnicos
-- 4. Los profesionales deberían aparecer
-- =========================================================================

