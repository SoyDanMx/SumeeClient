-- ============================================================================
-- FASE 1.3: CREAR FUNCIÓN find_similar_services PARA BÚSQUEDA SEMÁNTICA
-- ============================================================================
-- Esta función usa pgvector para buscar servicios similares usando embeddings
-- ============================================================================

-- IMPORTANTE: Eliminar función antigua si existe (puede tener firma diferente)
DROP FUNCTION IF EXISTS find_similar_services(vector, INTEGER, TEXT);
DROP FUNCTION IF EXISTS find_similar_services(vector, INTEGER);
DROP FUNCTION IF EXISTS find_similar_services(vector);

-- Verificar que la tabla service_embeddings existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'service_embeddings'
    ) THEN
        RAISE EXCEPTION 'La tabla service_embeddings no existe. Ejecuta primero los scripts de creación de tablas.';
    END IF;
END $$;

-- ============================================================================
-- FUNCIÓN: find_similar_services
-- ============================================================================
-- Parámetros:
--   - query_embedding: vector(384) - Embedding del query del usuario
--   - limit_count: INTEGER - Número máximo de resultados (default: 10)
--   - discipline_filter: TEXT - Filtrar por disciplina específica (opcional)
--
-- Retorna:
--   - service_id: UUID - ID del servicio
--   - service_name: TEXT - Nombre del servicio
--   - discipline: TEXT - Disciplina del servicio
--   - similarity: FLOAT - Similitud coseno (0.0 a 1.0, mayor = más similar)
--   - min_price: NUMERIC - Precio mínimo del servicio
-- ============================================================================

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
        se.discipline,
        -- Convertir distancia coseno a similitud (1 - distancia)
        -- <=> es el operador de distancia coseno en pgvector
        -- Menor distancia = mayor similitud
        1 - (se.embedding <=> query_embedding)::FLOAT AS similarity,
        -- Obtener precio mínimo del servicio (si existe)
        COALESCE(sc.min_price, 0)::NUMERIC AS min_price
    FROM public.service_embeddings se
    LEFT JOIN public.service_catalog sc ON sc.id = se.service_id
    WHERE 
        -- Filtrar por disciplina si se especifica
        (discipline_filter IS NULL OR se.discipline = discipline_filter)
        -- Solo servicios activos (o NULL si no existe en service_catalog)
        AND (sc.is_active = true OR sc.is_active IS NULL)
    -- Ordenar por distancia coseno (menor = más similar)
    ORDER BY se.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON FUNCTION find_similar_services IS 
'Busca servicios similares usando embeddings vectoriales y similitud coseno. 
Retorna los servicios más similares al query_embedding proporcionado.

Parámetros:
- query_embedding (vector(384)): Vector de embedding de 384 dimensiones generado del query del usuario
- limit_count (INTEGER, default: 10): Número máximo de resultados a retornar
- discipline_filter (TEXT, opcional): Filtrar resultados por disciplina específica (NULL = sin filtro)

Retorna:
- service_id: UUID del servicio
- service_name: Nombre del servicio
- discipline: Disciplina del servicio
- similarity: Similitud coseno (0.0 a 1.0, mayor = más similar)
- min_price: Precio mínimo del servicio';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que la función fue creada
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'find_similar_services';

-- ============================================================================
-- ÍNDICE PGVECTOR (si no existe)
-- ============================================================================
-- Este índice acelera las búsquedas de similitud
-- IMPORTANTE: Crear después de tener datos en la tabla

-- Verificar si el índice existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'service_embeddings' 
        AND indexname = 'service_embeddings_embedding_idx'
    ) THEN
        -- Crear índice IVFFlat para búsqueda rápida
        -- lists = 100 es un buen valor para ~57 servicios
        -- Ajustar según el número de registros
        CREATE INDEX service_embeddings_embedding_idx 
        ON public.service_embeddings 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
        
        RAISE NOTICE '✅ Índice pgvector creado para service_embeddings';
    ELSE
        RAISE NOTICE '✅ Índice pgvector ya existe';
    END IF;
END $$;

-- ============================================================================
-- EJEMPLO DE USO
-- ============================================================================
-- NOTA: Este ejemplo es solo para referencia, no se ejecuta
-- 
-- 1. Generar embedding del query:
--    SELECT * FROM generate_embedding('necesito instalar una lámpara');
--
-- 2. Buscar servicios similares:
--    SELECT * FROM find_similar_services(
--        '[0.1, 0.2, ...]'::vector(384),  -- embedding del query
--        10,                              -- límite de resultados
--        NULL                             -- sin filtro de disciplina
--    );
--
-- 3. Buscar solo en una disciplina:
--    SELECT * FROM find_similar_services(
--        '[0.1, 0.2, ...]'::vector(384),
--        5,
--        'electricidad'                   -- solo electricidad
--    );
-- ============================================================================

