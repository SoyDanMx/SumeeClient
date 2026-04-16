-- ============================================================================
-- FASE 1.2: CREAR SOLO TABLAS FALTANTES
-- ============================================================================
-- Este script crea solo las tablas que no existen
-- Útil si algunas tablas ya fueron creadas pero faltan otras
-- ============================================================================

-- ============================================================================
-- Verificar y crear service_embeddings si no existe
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'service_embeddings'
    ) THEN
        CREATE TABLE public.service_embeddings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            service_id UUID NOT NULL,
            service_name TEXT NOT NULL,
            discipline TEXT NOT NULL,
            embedding vector(384),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(service_id)
        );
        
        CREATE INDEX IF NOT EXISTS service_embeddings_service_id_idx 
        ON public.service_embeddings(service_id);
        
        CREATE INDEX IF NOT EXISTS service_embeddings_discipline_idx 
        ON public.service_embeddings(discipline);
        
        ALTER TABLE public.service_embeddings ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can read service embeddings"
            ON public.service_embeddings
            FOR SELECT
            USING (true);
        
        CREATE POLICY "Authenticated users can manage embeddings"
            ON public.service_embeddings
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
        
        RAISE NOTICE '✅ Tabla service_embeddings creada';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla service_embeddings ya existe';
    END IF;
END $$;

-- ============================================================================
-- Verificar y crear user_features si no existe
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_features'
    ) THEN
        CREATE TABLE public.user_features (
            user_id UUID PRIMARY KEY,
            embedding vector(384),
            preferred_services JSONB DEFAULT '[]'::jsonb,
            preferred_disciplines JSONB DEFAULT '[]'::jsonb,
            preferred_time_slots JSONB DEFAULT '[]'::jsonb,
            average_budget NUMERIC(10, 2),
            total_services_completed INTEGER DEFAULT 0,
            total_spent NUMERIC(10, 2) DEFAULT 0,
            location_cluster TEXT,
            most_common_lat NUMERIC(10, 7),
            most_common_lng NUMERIC(10, 7),
            user_segment TEXT,
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS user_features_segment_idx 
        ON public.user_features(user_segment);
        
        ALTER TABLE public.user_features ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can read own features"
            ON public.user_features
            FOR SELECT
            USING (auth.uid() = user_id);
        
        CREATE POLICY "System can read all features"
            ON public.user_features
            FOR SELECT
            TO authenticated
            USING (true);
        
        CREATE POLICY "Users can update own features"
            ON public.user_features
            FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        
        RAISE NOTICE '✅ Tabla user_features creada';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla user_features ya existe';
    END IF;
END $$;

-- ============================================================================
-- Verificar y crear ml_interactions si no existe
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_interactions'
    ) THEN
        CREATE TABLE public.ml_interactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
            query TEXT NOT NULL,
            query_embedding vector(384),
            predicted_service_id UUID,
            predicted_service_name TEXT,
            predicted_confidence NUMERIC(3, 2),
            actual_service_id UUID,
            actual_service_name TEXT,
            conversion BOOLEAN DEFAULT false,
            lead_id UUID,
            features JSONB,
            user_location_lat NUMERIC(10, 7),
            user_location_lng NUMERIC(10, 7),
            time_of_day INTEGER,
            day_of_week INTEGER,
            user_feedback TEXT,
            was_correct BOOLEAN,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS ml_interactions_user_id_idx 
        ON public.ml_interactions(user_id);
        
        CREATE INDEX IF NOT EXISTS ml_interactions_timestamp_idx 
        ON public.ml_interactions(timestamp DESC);
        
        CREATE INDEX IF NOT EXISTS ml_interactions_conversion_idx 
        ON public.ml_interactions(conversion);
        
        ALTER TABLE public.ml_interactions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can read own interactions"
            ON public.ml_interactions
            FOR SELECT
            USING (auth.uid() = user_id);
        
        CREATE POLICY "System can manage all interactions"
            ON public.ml_interactions
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
        
        RAISE NOTICE '✅ Tabla ml_interactions creada';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla ml_interactions ya existe';
    END IF;
END $$;

-- ============================================================================
-- Verificar y crear ml_feedback si no existe
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_feedback'
    ) THEN
        CREATE TABLE public.ml_feedback (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            interaction_id UUID,
            user_id UUID,
            was_correct BOOLEAN NOT NULL,
            feedback_text TEXT,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            correct_service_id UUID,
            correct_service_name TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS ml_feedback_interaction_id_idx 
        ON public.ml_feedback(interaction_id);
        
        ALTER TABLE public.ml_feedback ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can manage own feedback"
            ON public.ml_feedback
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        
        RAISE NOTICE '✅ Tabla ml_feedback creada';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla ml_feedback ya existe';
    END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT 
    'Tablas creadas:' as status,
    COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('service_embeddings', 'user_features', 'ml_interactions', 'ml_feedback');

SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = t.table_name
        ) THEN '✅ Existe'
        ELSE '❌ No existe'
    END as estado
FROM (VALUES 
    ('service_embeddings'),
    ('user_features'),
    ('ml_interactions'),
    ('ml_feedback')
) AS t(table_name);

