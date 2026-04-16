-- ============================================================================
-- FASE 1.2: AGREGAR ÍNDICES PGVECTOR (DESPUÉS DE CREAR TABLAS)
-- ============================================================================
-- Ejecutar DESPUÉS de FASE1_PASO2_ULTRA_SIMPLE.sql
-- ============================================================================

-- Verificar que las tablas existen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'service_embeddings'
    ) THEN
        RAISE EXCEPTION 'La tabla service_embeddings no existe. Ejecuta primero FASE1_PASO2_ULTRA_SIMPLE.sql';
    END IF;
END $$;

-- Índice pgvector para service_embeddings
CREATE INDEX IF NOT EXISTS service_embeddings_embedding_idx 
ON public.service_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índice pgvector para user_features
CREATE INDEX IF NOT EXISTS user_features_embedding_idx 
ON public.user_features 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

-- Índice pgvector para ml_interactions
CREATE INDEX IF NOT EXISTS ml_interactions_query_embedding_idx 
ON public.ml_interactions 
USING ivfflat (query_embedding vector_cosine_ops)
WITH (lists = 100);

-- Índices adicionales para ml_interactions
CREATE INDEX IF NOT EXISTS ml_interactions_predicted_service_idx 
ON public.ml_interactions(predicted_service_id);

CREATE INDEX IF NOT EXISTS ml_interactions_actual_service_idx 
ON public.ml_interactions(actual_service_id);

-- Verificar índices creados
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('service_embeddings', 'user_features', 'ml_interactions')
AND indexname LIKE '%embedding%'
ORDER BY tablename, indexname;

