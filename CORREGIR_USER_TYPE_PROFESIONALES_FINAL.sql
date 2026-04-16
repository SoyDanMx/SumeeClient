-- =========================================================================
-- CORREGIR USER_TYPE DE PROFESIONALES - SOLUCIÓN DEFINITIVA
-- =========================================================================
-- Problema: Profesionales tienen role = 'profesional' pero user_type = 'client'
-- Esto hace que la política RLS los excluya (user_type != 'client')
-- Solución: Cambiar user_type de 'client' a 'profesional' para profesionales
-- =========================================================================

-- =========================================================================
-- PASO 1: VER CUÁNTOS PROFESIONALES NECESITAN CORRECCIÓN
-- =========================================================================
SELECT 
    COUNT(*) as profesionales_a_corregir
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type = 'client';

-- =========================================================================
-- PASO 2: VER LISTA DE PROFESIONALES A CORREGIR (ANTES)
-- =========================================================================
SELECT 
    user_id,
    full_name,
    role,
    user_type as user_type_antes,
    profession
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type = 'client'
ORDER BY full_name
LIMIT 20;

-- =========================================================================
-- PASO 3: CORREGIR USER_TYPE DE PROFESIONALES
-- =========================================================================
-- IMPORTANTE: Solo actualiza profesionales que tienen:
--   - role = 'profesional' o 'professional'
--   - profession no nulo y no vacío
--   - user_type = 'client' (incorrecto)
--
-- Los cambia a user_type = 'profesional'
UPDATE profiles
SET 
    user_type = 'profesional',
    updated_at = NOW()
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type = 'client';

-- =========================================================================
-- PASO 4: VERIFICAR QUE SE CORRIGIÓ CORRECTAMENTE
-- =========================================================================
SELECT 
    COUNT(*) as profesionales_corregidos,
    COUNT(CASE WHEN user_type = 'profesional' THEN 1 END) as con_user_type_profesional,
    COUNT(CASE WHEN user_type = 'client' THEN 1 END) as aun_con_user_type_client
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != '';

-- =========================================================================
-- PASO 5: VER LISTA DE PROFESIONALES DESPUÉS DE LA CORRECCIÓN
-- =========================================================================
SELECT 
    user_id,
    full_name,
    role,
    user_type as user_type_despues,
    profession,
    calificacion_promedio
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type = 'profesional'
ORDER BY calificacion_promedio DESC NULLS LAST
LIMIT 20;

-- =========================================================================
-- PASO 6: VERIFICAR QUE AHORA CUMPLEN LOS CRITERIOS DE VISIBILIDAD
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
-- PASO 7: VERIFICAR QUE LOS CLIENTES REALES NO SE AFECTARON
-- =========================================================================
SELECT 
    COUNT(*) as clientes_reales,
    COUNT(CASE WHEN role = 'client' AND user_type = 'client' THEN 1 END) as clientes_correctos
FROM profiles
WHERE role = 'client';

-- =========================================================================
-- RESUMEN FINAL
-- =========================================================================
-- Después de ejecutar este script:
-- 1. Los profesionales con role = 'profesional' tendrán user_type = 'profesional'
-- 2. Los clientes reales (role = 'client') NO se ven afectados
-- 3. Los profesionales deberían aparecer en:
--    - https://sumeeapp.com/tecnicos
--    - La app cliente
-- 4. El PASO 6 debe mostrar total_profesionales_visibles > 0
-- =========================================================================

