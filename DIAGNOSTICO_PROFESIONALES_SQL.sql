-- =========================================================================
-- DIAGNÓSTICO: Profesionales Destacados No Aparecen
-- =========================================================================
-- Este script verifica los datos y políticas RLS para diagnosticar el problema
-- =========================================================================

-- =========================================================================
-- 1. VERIFICAR PROFESIONALES EN LA BD
-- =========================================================================
-- Contar profesionales que cumplen los criterios
SELECT 
    COUNT(*) as total_profesionales,
    COUNT(CASE WHEN role = 'profesional' THEN 1 END) as con_role_profesional,
    COUNT(CASE WHEN profession IS NOT NULL AND profession != '' THEN 1 END) as con_profession,
    COUNT(CASE WHEN user_type != 'client' THEN 1 END) as no_clientes
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type != 'client'
  AND role != 'client';

-- =========================================================================
-- 2. LISTAR PROFESIONALES QUE DEBERÍAN APARECER
-- =========================================================================
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession,
    calificacion_promedio,
    ubicacion_lat,
    ubicacion_lng,
    areas_servicio,
    whatsapp,
    avatar_url
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type != 'client'
  AND role != 'client'
ORDER BY calificacion_promedio DESC NULLS LAST
LIMIT 10;

-- =========================================================================
-- 3. VERIFICAR POLÍTICA RLS "Allow read professionals"
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
-- 4. PROBAR LA POLÍTICA RLS (simular query como la app)
-- =========================================================================
-- Esta query debería funcionar si la política RLS está correcta
-- Ejecutar como usuario anónimo (public)
SET ROLE anon;
SELECT 
    user_id,
    full_name,
    profession,
    calificacion_promedio
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type != 'client'
  AND role != 'client'
LIMIT 5;
RESET ROLE;

-- =========================================================================
-- 5. VERIFICAR SI HAY CLIENTES MEZCLADOS
-- =========================================================================
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession
FROM profiles
WHERE role = 'profesional'
  AND user_type = 'client'; -- Estos no deberían aparecer

-- =========================================================================
-- 6. VERIFICAR PROFESIONALES SIN PROFESSION
-- =========================================================================
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND (profession IS NULL OR profession = '');

-- =========================================================================
-- RESULTADOS ESPERADOS:
-- =========================================================================
-- 1. Debe haber al menos 1 profesional que cumpla los criterios
-- 2. La política RLS debe existir y ser pública (roles: {public})
-- 3. La query de prueba debe devolver resultados
-- 4. No debe haber clientes con role = 'profesional'
-- =========================================================================

