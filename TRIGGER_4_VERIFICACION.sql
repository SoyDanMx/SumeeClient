-- ============================================================================
-- TRIGGER 1 - PASO 4: Verificación (Opcional)
-- ============================================================================
-- Copia y pega ESTE bloque para verificar que el trigger funciona correctamente
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

