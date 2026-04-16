-- ============================================================================
-- ACTUALIZAR SCHEMA CACHE DE SUPABASE
-- ============================================================================
-- Este comando fuerza a Supabase a recargar el schema cache
-- Necesario después de agregar columnas nuevas

NOTIFY pgrst, 'reload schema';

-- Espera unos segundos después de ejecutar esto
-- Luego reinicia la app

