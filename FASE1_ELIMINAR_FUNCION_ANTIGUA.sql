-- ============================================================================
-- ELIMINAR FUNCIÓN find_similar_services ANTIGUA (si existe)
-- ============================================================================
-- Ejecutar esto ANTES de crear la nueva función
-- ============================================================================

-- Eliminar todas las versiones de la función (con diferentes firmas)
DROP FUNCTION IF EXISTS find_similar_services(vector, INTEGER, TEXT);
DROP FUNCTION IF EXISTS find_similar_services(vector, INTEGER);
DROP FUNCTION IF EXISTS find_similar_services(vector);

-- Verificar que fue eliminada
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'find_similar_services';

-- Si no retorna filas, la función fue eliminada correctamente

