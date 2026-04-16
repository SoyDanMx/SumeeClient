-- ============================================================================
-- ACTUALIZAR SCHEMA CACHE DE SUPABASE PARA onboarding_completed
-- ============================================================================
-- Este comando fuerza a Supabase a recargar el schema cache
-- Necesario después de agregar la columna onboarding_completed
-- ============================================================================

-- Forzar actualización del schema cache
NOTIFY pgrst, 'reload schema';

-- Verificar que la columna existe
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'onboarding_completed';

-- ============================================================================
-- INSTRUCCIONES:
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. Espera 10-15 segundos después de ejecutar
-- 3. Reinicia la app (npx expo start --clear)
-- 4. Prueba el onboarding nuevamente
-- ============================================================================

