-- ============================================================================
-- FASE 1.2: CREAR TABLAS (SIN FUNCIÓN - PARA EVITAR ERRORES)
-- ============================================================================
-- Versión simplificada: Solo crea las tablas
-- La función find_similar_services se creará después
-- ============================================================================

-- ============================================================================
-- 2.1: Tabla service_embeddings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.service_catalog(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    discipline TEXT NOT NULL,
    embedding vector(384),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_id)
);

CREATE INDEX IF NOT EXISTS service_embeddings_embedding_idx 
ON public.service_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS service_embeddings_service_id_idx 
ON public.service_embeddings(service_id);

CREATE INDEX IF NOT EXISTS service_embeddings_discipline_idx 
ON public.service_embeddings(discipline);

CREATE OR REPLACE FUNCTION update_service_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_embeddings_updated_at
    BEFORE UPDATE ON public.service_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_service_embeddings_updated_at();

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

-- ============================================================================
-- 2.2: Tabla user_features
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_features (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS user_features_embedding_idx 
ON public.user_features 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

CREATE OR REPLACE FUNCTION update_user_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_features_updated_at
    BEFORE UPDATE ON public.user_features
    FOR EACH ROW
    EXECUTE FUNCTION update_user_features_updated_at();

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

-- ============================================================================
-- 2.3: Tabla ml_interactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ml_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    query_embedding vector(384),
    predicted_service_id UUID REFERENCES public.service_catalog(id),
    predicted_service_name TEXT,
    predicted_confidence NUMERIC(3, 2),
    actual_service_id UUID REFERENCES public.service_catalog(id),
    actual_service_name TEXT,
    conversion BOOLEAN DEFAULT false,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS ml_interactions_predicted_service_idx 
ON public.ml_interactions(predicted_service_id);

CREATE INDEX IF NOT EXISTS ml_interactions_actual_service_idx 
ON public.ml_interactions(actual_service_id);

CREATE INDEX IF NOT EXISTS ml_interactions_query_embedding_idx 
ON public.ml_interactions 
USING ivfflat (query_embedding vector_cosine_ops)
WITH (lists = 100);

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

-- ============================================================================
-- 2.4: Tabla ml_feedback
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ml_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID REFERENCES public.ml_interactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    was_correct BOOLEAN NOT NULL,
    feedback_text TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    correct_service_id UUID REFERENCES public.service_catalog(id),
    correct_service_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ml_feedback_interaction_id_idx 
ON public.ml_feedback(interaction_id);

CREATE INDEX IF NOT EXISTS ml_feedback_user_id_idx 
ON public.ml_feedback(user_id);

ALTER TABLE public.ml_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feedback"
    ON public.ml_feedback
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que todas las tablas fueron creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('service_embeddings', 'user_features', 'ml_interactions', 'ml_feedback')
ORDER BY table_name;

