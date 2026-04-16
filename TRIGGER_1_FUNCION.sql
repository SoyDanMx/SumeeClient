-- ============================================================================
-- TRIGGER 1 - PASO 1: Crear la Función
-- ============================================================================
-- Copia y pega ESTE bloque primero en el SQL Editor de Supabase
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_estado_to_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS NULL AND NEW.estado IS NOT NULL THEN
    CASE LOWER(TRIM(NEW.estado))
      WHEN 'nuevo' THEN 
        NEW.status := 'pending';
      WHEN 'asignado' THEN 
        NEW.status := 'accepted';
      WHEN 'en proceso' THEN 
        NEW.status := 'in_progress';
      WHEN 'en camino' THEN 
        NEW.status := 'en_camino';
      WHEN 'en sitio' THEN 
        NEW.status := 'en_sitio';
      WHEN 'completado' THEN 
        NEW.status := 'completed';
      WHEN 'cancelado' THEN 
        NEW.status := 'cancelled';
      ELSE 
        NEW.status := 'pending';
    END CASE;
  END IF;
  
  IF NEW.status IS NOT NULL AND (NEW.estado IS NULL OR NEW.estado = '') THEN
    CASE NEW.status
      WHEN 'pending' THEN 
        NEW.estado := 'Nuevo';
      WHEN 'accepted' THEN 
        NEW.estado := 'Asignado';
      WHEN 'in_progress' THEN 
        NEW.estado := 'En Proceso';
      WHEN 'en_camino' THEN 
        NEW.estado := 'En Camino';
      WHEN 'en_sitio' THEN 
        NEW.estado := 'En Sitio';
      WHEN 'completed' THEN 
        NEW.estado := 'Completado';
      WHEN 'cancelled' THEN 
        NEW.estado := 'Cancelado';
      ELSE 
        NEW.estado := 'Nuevo';
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

