-- =========================================================================
-- DIAGNÓSTICO: ¿Por qué no hay profesionales visibles?
-- =========================================================================
-- Resultado: total_profesionales_visibles = 0
-- Necesitamos verificar qué está pasando con los datos
-- =========================================================================

-- =========================================================================
-- 1. CONTAR TODOS LOS PROFILES EN LA BD
-- =========================================================================
SELECT COUNT(*) as total_profiles FROM profiles;

-- =========================================================================
-- 2. VER TODOS LOS PROFILES CON SUS ROLES Y TIPOS
-- =========================================================================
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession,
    CASE 
        WHEN profession IS NULL THEN 'NULL'
        WHEN profession = '' THEN 'VACÍO'
        ELSE profession
    END as profession_status
FROM profiles
ORDER BY role, user_type, full_name;

-- =========================================================================
-- 3. CONTAR POR ROLE
-- =========================================================================
SELECT 
    role,
    COUNT(*) as cantidad
FROM profiles
GROUP BY role
ORDER BY cantidad DESC;

-- =========================================================================
-- 4. CONTAR POR USER_TYPE
-- =========================================================================
SELECT 
    user_type,
    COUNT(*) as cantidad
FROM profiles
GROUP BY user_type
ORDER BY cantidad DESC;

-- =========================================================================
-- 5. VER PROFILES CON ROLE = 'profesional' (sin otros filtros)
-- =========================================================================
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession,
    calificacion_promedio
FROM profiles
WHERE role = 'profesional' OR role = 'professional'
ORDER BY full_name;

-- =========================================================================
-- 6. VER PROFILES CON PROFESSION NO NULO
-- =========================================================================
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession
FROM profiles
WHERE profession IS NOT NULL 
  AND profession != ''
ORDER BY profession, full_name;

-- =========================================================================
-- 7. VER PROFILES QUE SON CLIENTES (para excluirlos)
-- =========================================================================
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession
FROM profiles
WHERE user_type = 'client' OR role = 'client'
ORDER BY full_name;

-- =========================================================================
-- 8. ANÁLISIS COMPLETO: Por qué no cumplen los criterios
-- =========================================================================
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession,
    CASE 
        WHEN (role != 'profesional' AND role != 'professional') THEN '❌ Role incorrecto'
        WHEN profession IS NULL THEN '❌ Profession NULL'
        WHEN profession = '' THEN '❌ Profession vacío'
        WHEN user_type = 'client' THEN '❌ Es cliente'
        WHEN role = 'client' THEN '❌ Role es client'
        ELSE '✅ Cumple criterios'
    END as motivo_exclusion
FROM profiles
ORDER BY motivo_exclusion, full_name;

-- =========================================================================
-- 9. SOLUCIÓN: Si hay profesionales pero con datos incorrectos
-- =========================================================================
-- Si encuentras profesionales con:
-- - role = NULL o diferente a 'profesional'
-- - profession = NULL o vacío
-- - user_type = 'client'
--
-- Necesitarás corregir los datos. Ejemplo:
--
-- UPDATE profiles
-- SET role = 'profesional',
--     user_type = 'profesional',
--     profession = 'Electricista'  -- o la profesión correcta
-- WHERE user_id = 'xxx';
-- =========================================================================

