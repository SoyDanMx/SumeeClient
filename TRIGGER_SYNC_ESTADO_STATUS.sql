-- ============================================================================
-- TRIGGER: Sincronizar campo 'estado' (legacy) → 'status' (moderno)
-- ============================================================================
-- Este trigger asegura que cuando se inserta o actualiza un lead con 'estado',
-- automáticamente se sincroniza el campo 'status' para que ambas apps puedan
-- filtrar correctamente los leads.
-- ============================================================================

-- Función que sincroniza estado → status
CREATE OR REPLACE FUNCTION sync_estado_to_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo sincronizar si status es NULL pero estado tiene valor
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
        -- Por defecto, si no coincide, usar 'pending'
        NEW.status := 'pending';
    END CASE;
  END IF;
  
  -- Si status tiene valor pero estado es NULL, también sincronizar (opcional)
  -- Esto mantiene compatibilidad bidireccional
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

-- Crear trigger (eliminar si existe primero)
DROP TRIGGER IF EXISTS sync_estado_status_trigger ON public.leads;

CREATE TRIGGER sync_estado_status_trigger
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION sync_estado_to_status();

-- ============================================================================
-- VERIFICACIÓN: Probar el trigger
-- ============================================================================

-- Test 1: Insertar con estado='nuevo' (debe crear status='pending')
-- INSERT INTO leads (
--   cliente_id,
--   nombre_cliente,
--   whatsapp,
--   descripcion_proyecto,
--   servicio,
--   estado
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'Test Cliente',
--   '+525512345678',
--   'Test de sincronización',
--   'Electricidad',
--   'nuevo'
-- );
-- 
-- -- Verificar que status se sincronizó
-- SELECT id, estado, status FROM leads WHERE nombre_cliente = 'Test Cliente';

-- ============================================================================
-- MIGRACIÓN: Actualizar leads existentes sin status
-- ============================================================================

-- Actualizar todos los leads que tienen estado pero no status
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

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. Este trigger se ejecuta ANTES de INSERT o UPDATE
-- 2. Sincroniza automáticamente estado → status
-- 3. También sincroniza status → estado (bidireccional)
-- 4. Usa LOWER(TRIM()) para manejar mayúsculas/minúsculas y espacios
-- 5. Por defecto, si no coincide, usa 'pending' / 'Nuevo'
-- ============================================================================

