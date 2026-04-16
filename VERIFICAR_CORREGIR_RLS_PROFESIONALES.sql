-- =========================================================================
-- VERIFICAR Y CORREGIR POLÍTICA RLS PARA PROFESIONALES
-- =========================================================================
-- Este script verifica y corrige la política RLS que permite leer profesionales
-- =========================================================================

-- =========================================================================
-- 1. VERIFICAR POLÍTICA ACTUAL
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
-- 2. ELIMINAR POLÍTICA SI EXISTE (para recrearla correctamente)
-- =========================================================================
DROP POLICY IF EXISTS "Allow read professionals" ON profiles;

-- =========================================================================
-- 3. CREAR POLÍTICA CORRECTA
-- =========================================================================
-- Esta política permite que CUALQUIERA (público) pueda leer profesionales
-- que cumplan los criterios: role = 'profesional', profession no nulo, no clientes
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
-- 5. PROBAR LA POLÍTICA (simular como usuario anónimo)
-- =========================================================================
-- Esta query debería funcionar ahora
SELECT 
    user_id,
    full_name,
    profession,
    calificacion_promedio,
    role,
    user_type
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type != 'client'
  AND role != 'client'
LIMIT 5;

-- =========================================================================
-- NOTAS:
-- =========================================================================
-- 1. La política es PÚBLICA (roles: {public}) para que funcione sin autenticación
-- 2. Solo permite leer profesionales que cumplan los criterios
-- 3. Excluye explícitamente clientes
-- 4. Esta política NO interfiere con otras políticas (SELECT, INSERT, UPDATE, DELETE)
-- =========================================================================

