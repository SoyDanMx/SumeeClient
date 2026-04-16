-- ============================================================================
-- TRIGGER 1 - PASO 2: Crear el Trigger
-- ============================================================================
-- Copia y pega ESTE bloque DESPUÉS de ejecutar TRIGGER_1_FUNCION.sql
-- ============================================================================

DROP TRIGGER IF EXISTS sync_estado_status_trigger ON public.leads;

CREATE TRIGGER sync_estado_status_trigger
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION sync_estado_to_status();

