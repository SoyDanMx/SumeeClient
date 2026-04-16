-- ============================================================================
-- FIX: Recargar Schema Cache para service_embeddings
-- ============================================================================
-- El error "Could not find the 'discipline' column" es un problema de cache
-- ============================================================================

-- 1. Verificar que la columna discipline existe
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'service_embeddings'
ORDER BY ordinal_position;

-- 2. Si la columna NO existe, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'service_embeddings' 
          AND column_name = 'discipline'
    ) THEN
        ALTER TABLE public.service_embeddings 
        ADD COLUMN discipline TEXT;
        
        RAISE NOTICE '✅ Columna discipline agregada a service_embeddings';
    ELSE
        RAISE NOTICE '✅ Columna discipline ya existe';
    END IF;
END $$;

-- 3. Recargar el schema cache de Supabase
NOTIFY pgrst, 'reload schema';

-- 4. Verificar estructura final
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'service_embeddings'
ORDER BY ordinal_position;

