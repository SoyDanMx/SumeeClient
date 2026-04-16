-- =========================================================================
-- CORREGIR USER_TYPE DE PROFESIONALES
-- =========================================================================
-- Problema: Todos los profesionales tienen user_type = 'client'
-- Esto hace que la política RLS los excluya
-- Solución: Cambiar user_type de 'client' a 'profesional' para profesionales
-- =========================================================================

-- =========================================================================
-- 1. VER CUÁNTOS PROFESIONALES NECESITAN CORRECCIÓN
-- =========================================================================
SELECT 
    COUNT(*) as profesionales_a_corregir
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type = 'client';

-- =========================================================================
-- 2. VER LISTA DE PROFESIONALES A CORREGIR
-- =========================================================================
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type = 'client'
ORDER BY full_name;

-- =========================================================================
-- 3. CORREGIR USER_TYPE DE PROFESIONALES
-- =========================================================================
-- Cambiar user_type de 'client' a 'profesional' para todos los profesionales
-- que tienen role = 'profesional' y profession no nulo
UPDATE profiles
SET user_type = 'profesional',
    updated_at = NOW()
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type = 'client';

-- =========================================================================
-- 4. VERIFICAR QUE SE CORRIGIÓ CORRECTAMENTE
-- =========================================================================
SELECT 
    COUNT(*) as profesionales_corregidos
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type = 'profesional';

-- =========================================================================
-- 5. VERIFICAR QUE AHORA CUMPLEN LOS CRITERIOS
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
-- 6. LISTAR PROFESIONALES QUE AHORA SON VISIBLES
-- =========================================================================
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession,
    calificacion_promedio
FROM profiles
WHERE (role = 'profesional' OR role = 'professional')
  AND profession IS NOT NULL
  AND profession != ''
  AND user_type != 'client'
  AND role != 'client'
ORDER BY calificacion_promedio DESC NULLS LAST
LIMIT 20;

-- =========================================================================
-- NOTAS IMPORTANTES:
-- =========================================================================
-- 1. Este script corrige el user_type de profesionales que tienen:
--    - role = 'profesional' o 'professional'
--    - profession no nulo y no vacío
--    - user_type = 'client' (incorrecto)
--
-- 2. Los cambia a user_type = 'profesional'
--
-- 3. Después de ejecutar, los profesionales deberían aparecer en:
--    - https://sumeeapp.com/tecnicos
--    - La app cliente
--
-- 4. Los clientes reales (role = 'client') NO se ven afectados
-- =========================================================================

