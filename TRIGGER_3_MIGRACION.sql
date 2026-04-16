-- ============================================================================
-- TRIGGER 1 - PASO 3: Migrar Datos Existentes
-- ============================================================================
-- Copia y pega ESTE bloque DESPUÉS de ejecutar TRIGGER_2_CREAR_TRIGGER.sql
-- Esto actualiza los leads existentes que tienen estado pero no status
-- ============================================================================

UPDATE public.leads
SET status = CASE LOWER(TRIM(estado))
  WHEN 'nuevo' THEN 'pending'
  WHEN 'asignado' THEN 'accepted'
  WHEN 'en proceso' THEN 'in_progress'
  WHEN 'en camino' THEN 'en_camino'
  WHEN 'en sitio' THEN 'en_sitio'
  WHEN 'completado' THEN 'completed'
  WHEN 'cancelado' THEN 'cancelled'
  ELSE 'pending'
END
WHERE status IS NULL AND estado IS NOT NULL;

