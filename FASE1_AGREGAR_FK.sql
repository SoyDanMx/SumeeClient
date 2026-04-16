-- ============================================================================
-- FASE 1.2: AGREGAR FOREIGN KEYS (DESPUÉS DE CREAR TABLAS)
-- ============================================================================
-- Ejecutar DESPUÉS de FASE1_PASO2_SIN_FK.sql
-- Agrega las foreign keys de forma segura
-- ============================================================================

-- Verificar que TODAS las tablas existen
DO $$
DECLARE
    missing_tables TEXT[];
BEGIN
    missing_tables := ARRAY[]::TEXT[];
    
    -- Verificar cada tabla
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_embeddings') THEN
        missing_tables := array_append(missing_tables, 'service_embeddings');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_features') THEN
        missing_tables := array_append(missing_tables, 'user_features');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ml_interactions') THEN
        missing_tables := array_append(missing_tables, 'ml_interactions');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ml_feedback') THEN
        missing_tables := array_append(missing_tables, 'ml_feedback');
    END IF;
    
    -- Si faltan tablas, mostrar error informativo
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Las siguientes tablas no existen: %. Ejecuta primero FASE1_PASO2_SIN_FK.sql', array_to_string(missing_tables, ', ');
    END IF;
    
    RAISE NOTICE '✅ Todas las tablas existen. Procediendo a agregar foreign keys...';
END $$;

-- ============================================================================
-- Agregar Foreign Keys
-- ============================================================================

-- 1. service_embeddings.service_id -> service_catalog.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
        AND table_name = 'service_embeddings'
        AND constraint_name LIKE '%service_id%'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE public.service_embeddings
        ADD CONSTRAINT fk_service_embeddings_service_id
        FOREIGN KEY (service_id) 
        REFERENCES public.service_catalog(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key agregada: service_embeddings.service_id -> service_catalog.id';
    ELSE
        RAISE NOTICE 'Foreign key ya existe: service_embeddings.service_id';
    END IF;
END $$;

-- 2. user_features.user_id -> auth.users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
        AND table_name = 'user_features'
        AND constraint_name LIKE '%user_id%'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE public.user_features
        ADD CONSTRAINT fk_user_features_user_id
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key agregada: user_features.user_id -> auth.users.id';
    ELSE
        RAISE NOTICE 'Foreign key ya existe: user_features.user_id';
    END IF;
END $$;

-- 3. ml_interactions.user_id -> auth.users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
        AND table_name = 'ml_interactions'
        AND constraint_name LIKE '%user_id%'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE public.ml_interactions
        ADD CONSTRAINT fk_ml_interactions_user_id
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key agregada: ml_interactions.user_id -> auth.users.id';
    END IF;
END $$;

-- 4. ml_interactions.predicted_service_id -> service_catalog.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
        AND table_name = 'ml_interactions'
        AND constraint_name LIKE '%predicted_service%'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE public.ml_interactions
        ADD CONSTRAINT fk_ml_interactions_predicted_service
        FOREIGN KEY (predicted_service_id) 
        REFERENCES public.service_catalog(id);
        
        RAISE NOTICE 'Foreign key agregada: ml_interactions.predicted_service_id -> service_catalog.id';
    END IF;
END $$;

-- 5. ml_interactions.actual_service_id -> service_catalog.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
        AND table_name = 'ml_interactions'
        AND constraint_name LIKE '%actual_service%'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE public.ml_interactions
        ADD CONSTRAINT fk_ml_interactions_actual_service
        FOREIGN KEY (actual_service_id) 
        REFERENCES public.service_catalog(id);
        
        RAISE NOTICE 'Foreign key agregada: ml_interactions.actual_service_id -> service_catalog.id';
    END IF;
END $$;

-- 6. ml_interactions.lead_id -> leads.id (si la tabla leads existe Y la columna existe)
DO $$
BEGIN
    -- Verificar que tanto la tabla leads como la columna lead_id existen
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leads'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'ml_interactions'
        AND column_name = 'lead_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public'
            AND table_name = 'ml_interactions'
            AND constraint_name LIKE '%lead_id%'
            AND constraint_type = 'FOREIGN KEY'
        ) THEN
            ALTER TABLE public.ml_interactions
            ADD CONSTRAINT fk_ml_interactions_lead_id
            FOREIGN KEY (lead_id) 
            REFERENCES public.leads(id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'Foreign key agregada: ml_interactions.lead_id -> leads.id';
        ELSE
            RAISE NOTICE 'Foreign key ya existe: ml_interactions.lead_id';
        END IF;
    ELSE
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'ml_interactions'
            AND column_name = 'lead_id'
        ) THEN
            RAISE NOTICE 'Columna lead_id no existe en ml_interactions, omitiendo foreign key';
        ELSE
            RAISE NOTICE 'Tabla leads no existe, omitiendo foreign key para lead_id';
        END IF;
    END IF;
END $$;

-- 7. ml_feedback.interaction_id -> ml_interactions.id
DO $$
BEGIN
    -- Verificar que la tabla existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_feedback'
    ) THEN
        -- Verificar que la columna existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'ml_feedback'
            AND column_name = 'interaction_id'
        ) THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_schema = 'public'
                AND table_name = 'ml_feedback'
                AND constraint_name LIKE '%interaction_id%'
                AND constraint_type = 'FOREIGN KEY'
            ) THEN
                ALTER TABLE public.ml_feedback
                ADD CONSTRAINT fk_ml_feedback_interaction_id
                FOREIGN KEY (interaction_id) 
                REFERENCES public.ml_interactions(id) 
                ON DELETE CASCADE;
                
                RAISE NOTICE 'Foreign key agregada: ml_feedback.interaction_id -> ml_interactions.id';
            ELSE
                RAISE NOTICE 'Foreign key ya existe: ml_feedback.interaction_id';
            END IF;
        ELSE
            RAISE NOTICE 'Columna interaction_id no existe en ml_feedback, omitiendo foreign key';
        END IF;
    ELSE
        RAISE NOTICE 'Tabla ml_feedback no existe, omitiendo foreign key';
    END IF;
END $$;

-- 8. ml_feedback.user_id -> auth.users.id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_feedback'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'ml_feedback'
        AND column_name = 'user_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public'
            AND table_name = 'ml_feedback'
            AND constraint_name LIKE '%user_id%'
            AND constraint_type = 'FOREIGN KEY'
        ) THEN
            ALTER TABLE public.ml_feedback
            ADD CONSTRAINT fk_ml_feedback_user_id
            FOREIGN KEY (user_id) 
            REFERENCES auth.users(id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'Foreign key agregada: ml_feedback.user_id -> auth.users.id';
        ELSE
            RAISE NOTICE 'Foreign key ya existe: ml_feedback.user_id';
        END IF;
    ELSE
        RAISE NOTICE 'Tabla ml_feedback o columna user_id no existe, omitiendo foreign key';
    END IF;
END $$;

-- 9. ml_feedback.correct_service_id -> service_catalog.id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_feedback'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'ml_feedback'
        AND column_name = 'correct_service_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public'
            AND table_name = 'ml_feedback'
            AND constraint_name LIKE '%correct_service%'
            AND constraint_type = 'FOREIGN KEY'
        ) THEN
            ALTER TABLE public.ml_feedback
            ADD CONSTRAINT fk_ml_feedback_correct_service
            FOREIGN KEY (correct_service_id) 
            REFERENCES public.service_catalog(id);
            
            RAISE NOTICE 'Foreign key agregada: ml_feedback.correct_service_id -> service_catalog.id';
        ELSE
            RAISE NOTICE 'Foreign key ya existe: ml_feedback.correct_service_id';
        END IF;
    ELSE
        RAISE NOTICE 'Tabla ml_feedback o columna correct_service_id no existe, omitiendo foreign key';
    END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('service_embeddings', 'user_features', 'ml_interactions', 'ml_feedback')
ORDER BY tc.table_name, tc.constraint_name;

