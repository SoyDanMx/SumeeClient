-- ============================================================================
-- FASE 1.2.5: CREAR FUNCIÓN find_similar_services (POR SEPARADO)
-- ============================================================================
-- Ejecutar DESPUÉS de crear las tablas
-- ============================================================================

-- Primero, verificar que service_embeddings existe y tiene la columna discipline
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'service_embeddings' 
        AND column_name = 'discipline'
    ) THEN
        RAISE EXCEPTION 'La tabla service_embeddings no existe o no tiene la columna discipline. Ejecuta primero FASE1_PASO2_SIN_FUNCION.sql';
    END IF;
END $$;

-- Crear función (versión robusta que no depende de service_catalog.discipline)
CREATE OR REPLACE FUNCTION find_similar_services(
    query_embedding vector(384),
    limit_count INTEGER DEFAULT 10,
    discipline_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    service_id UUID,
    service_name TEXT,
    discipline TEXT,
    similarity FLOAT,
    min_price NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.service_id,
        se.service_name,
        se.discipline,  -- ✅ Usar se.discipline (de service_embeddings)
        1 - (se.embedding <=> query_embedding) AS similarity,
        COALESCE(sc.min_price, 0)::NUMERIC AS min_price
    FROM public.service_embeddings se
    LEFT JOIN public.service_catalog sc ON sc.id = se.service_id
    WHERE 
        (discipline_filter IS NULL OR se.discipline = discipline_filter)
        AND (sc.is_active = true OR sc.is_active IS NULL)
    ORDER BY se.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Verificar que la función fue creada
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'find_similar_services';

