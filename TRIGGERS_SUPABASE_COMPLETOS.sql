-- ============================================================================
-- TRIGGERS PARA SUPABASE - ALINEACIÓN BACKEND
-- ============================================================================
-- Copia y pega cada bloque SQL en el SQL Editor de Supabase
-- Ejecuta cada bloque por separado
-- ============================================================================

-- ============================================================================
-- TRIGGER 1: Sincronizar estado → status
-- ============================================================================
-- Este trigger asegura que cuando se inserta o actualiza un lead con 'estado',
-- automáticamente se sincroniza el campo 'status' para que ambas apps puedan
-- filtrar correctamente los leads.
-- ============================================================================

-- Paso 1: Crear la función
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

-- Paso 2: Eliminar trigger si existe (para evitar errores)
DROP TRIGGER IF EXISTS sync_estado_status_trigger ON public.leads;

-- Paso 3: Crear el trigger
CREATE TRIGGER sync_estado_status_trigger
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION sync_estado_to_status();

-- ============================================================================
-- MIGRACIÓN: Actualizar leads existentes sin status
-- ============================================================================
-- Ejecuta este bloque DESPUÉS de crear el trigger para actualizar datos existentes
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

-- ============================================================================
-- VERIFICACIÓN: Consultas para verificar que funciona
-- ============================================================================
-- Ejecuta estas consultas para verificar que el trigger funciona correctamente
-- ============================================================================

-- Ver leads con estado y status sincronizados
SELECT 
  id,
  estado,
  status,
  nombre_cliente,
  updated_at
FROM public.leads
WHERE estado IS NOT NULL OR status IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- Verificar que no hay leads sin status cuando tienen estado
SELECT 
  COUNT(*) as leads_sin_status
FROM public.leads
WHERE estado IS NOT NULL AND status IS NULL;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Ejecuta cada bloque SQL por separado en el SQL Editor de Supabase
-- 2. El orden es importante: primero la función, luego el trigger, luego la migración
-- 3. El trigger se ejecuta AUTOMÁTICAMENTE en cada INSERT o UPDATE
-- 4. Si necesitas desactivar el trigger temporalmente:
--    DROP TRIGGER sync_estado_status_trigger ON public.leads;
-- 5. Para reactivarlo:
--    CREATE TRIGGER sync_estado_status_trigger...
-- ============================================================================

