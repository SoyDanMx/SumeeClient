# 🚀 Fase 1: Fundación ML - Guía de Implementación Paso a Paso

## 📋 Objetivo de la Fase 1

Configurar la infraestructura base para Machine Learning:
- ✅ Configurar pgvector en Supabase
- ✅ Crear tablas de embeddings y features
- ✅ Implementar generación de embeddings
- ✅ Data collection pipeline básico

**Tiempo estimado:** 2 semanas  
**Prerequisitos:** Triggers ya copiados a Supabase ✅

---

## 📝 Paso 1: Configurar pgvector en Supabase

### **1.1 Habilitar Extensión pgvector**

**En Supabase SQL Editor, ejecutar:**

```sql
-- ============================================================================
-- FASE 1.1: Habilitar pgvector en Supabase
-- ============================================================================

-- Verificar si pgvector está disponible
SELECT * FROM pg_available_extensions WHERE name = 'vector';

-- Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Verificar instalación
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
```

**✅ Verificación:**
- Deberías ver `vector` en la lista de extensiones
- Versión debería ser `0.5.0` o superior

---

## 📝 Paso 2: Crear Tablas de Embeddings y Features

### **2.1 Tabla: `service_embeddings`**

**Almacena embeddings vectoriales de servicios para búsqueda semántica:**

```sql
-- ============================================================================
-- FASE 1.2.1: Crear tabla service_embeddings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.service_catalog(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    discipline TEXT NOT NULL,
    embedding vector(384),  -- Dimensiones del modelo all-MiniLM-L6-v2
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(service_id)
);

-- Índice para búsqueda rápida con pgvector (IVFFlat)
CREATE INDEX IF NOT EXISTS service_embeddings_embedding_idx 
ON public.service_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índices adicionales para búsquedas comunes
CREATE INDEX IF NOT EXISTS service_embeddings_service_id_idx 
ON public.service_embeddings(service_id);

CREATE INDEX IF NOT EXISTS service_embeddings_discipline_idx 
ON public.service_embeddings(discipline);

-- Trigger para actualizar updated_at
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

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.service_embeddings ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer embeddings (para búsqueda)
CREATE POLICY "Anyone can read service embeddings"
    ON public.service_embeddings
    FOR SELECT
    USING (true);

-- Política: Solo autenticados pueden insertar/actualizar
CREATE POLICY "Authenticated users can manage embeddings"
    ON public.service_embeddings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE public.service_embeddings IS 'Embeddings vectoriales de servicios para búsqueda semántica';
COMMENT ON COLUMN public.service_embeddings.embedding IS 'Vector de 384 dimensiones generado con sentence-transformers';
```

### **2.2 Tabla: `user_features`**

**Almacena features y embeddings de usuarios para personalización:**

```sql
-- ============================================================================
-- FASE 1.2.2: Crear tabla user_features
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_features (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Embedding del usuario (basado en historial)
    embedding vector(384),
    
    -- Features categóricas
    preferred_services JSONB DEFAULT '[]'::jsonb,  -- IDs de servicios frecuentes
    preferred_disciplines JSONB DEFAULT '[]'::jsonb,  -- Disciplinas preferidas
    preferred_time_slots JSONB DEFAULT '[]'::jsonb,  -- Horarios preferidos [0-23]
    
    -- Features numéricas
    average_budget NUMERIC(10, 2),
    total_services_completed INTEGER DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0,
    
    -- Features de ubicación
    location_cluster TEXT,  -- Cluster de ubicación (ej: "zona_norte", "centro")
    most_common_lat NUMERIC(10, 7),
    most_common_lng NUMERIC(10, 7),
    
    -- Segmentación
    user_segment TEXT,  -- 'premium', 'standard', 'budget', 'new'
    
    -- Metadata
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS user_features_segment_idx 
ON public.user_features(user_segment);

CREATE INDEX IF NOT EXISTS user_features_embedding_idx 
ON public.user_features 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

-- Trigger para actualizar last_updated
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

-- Habilitar RLS
ALTER TABLE public.user_features ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios solo pueden leer sus propios features
CREATE POLICY "Users can read own features"
    ON public.user_features
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Sistema puede leer todos (para ML)
CREATE POLICY "System can read all features"
    ON public.user_features
    FOR SELECT
    TO authenticated
    USING (true);

-- Política: Usuarios pueden actualizar sus features
CREATE POLICY "Users can update own features"
    ON public.user_features
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE public.user_features IS 'Features y embeddings de usuarios para personalización ML';
COMMENT ON COLUMN public.user_features.embedding IS 'Vector de 384 dimensiones basado en historial del usuario';
```

### **2.3 Tabla: `ml_interactions`**

**Tracking de interacciones para entrenamiento del modelo:**

```sql
-- ============================================================================
-- FASE 1.2.3: Crear tabla ml_interactions (Data Collection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ml_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Usuario
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Query del usuario
    query TEXT NOT NULL,
    query_embedding vector(384),  -- Embedding del query
    
    -- Predicción del modelo
    predicted_service_id UUID REFERENCES public.service_catalog(id),
    predicted_service_name TEXT,
    predicted_confidence NUMERIC(3, 2),  -- 0.00 a 1.00
    
    -- Resultado real
    actual_service_id UUID REFERENCES public.service_catalog(id),
    actual_service_name TEXT,
    
    -- Conversión
    conversion BOOLEAN DEFAULT false,  -- ¿Se convirtió en lead?
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    
    -- Features usadas para predicción
    features JSONB,  -- Todas las features usadas
    
    -- Contexto
    user_location_lat NUMERIC(10, 7),
    user_location_lng NUMERIC(10, 7),
    time_of_day INTEGER,  -- 0-23
    day_of_week INTEGER,  -- 0-6 (0 = domingo)
    
    -- Feedback del usuario (opcional)
    user_feedback TEXT,
    was_correct BOOLEAN,
    
    -- Metadata
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para análisis y queries
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

-- Índice para búsqueda semántica de queries
CREATE INDEX IF NOT EXISTS ml_interactions_query_embedding_idx 
ON public.ml_interactions 
USING ivfflat (query_embedding vector_cosine_ops)
WITH (lists = 100);

-- Habilitar RLS
ALTER TABLE public.ml_interactions ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden leer sus propias interacciones
CREATE POLICY "Users can read own interactions"
    ON public.ml_interactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Sistema puede insertar/leer todas (para ML)
CREATE POLICY "System can manage all interactions"
    ON public.ml_interactions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE public.ml_interactions IS 'Tracking de interacciones para entrenamiento de modelos ML';
COMMENT ON COLUMN public.ml_interactions.query_embedding IS 'Embedding del query del usuario';
COMMENT ON COLUMN public.ml_interactions.features IS 'JSON con todas las features usadas para la predicción';
```

### **2.4 Tabla: `ml_feedback`**

**Feedback explícito del usuario sobre predicciones:**

```sql
-- ============================================================================
-- FASE 1.2.4: Crear tabla ml_feedback
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ml_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID REFERENCES public.ml_interactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Feedback
    was_correct BOOLEAN NOT NULL,
    feedback_text TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    -- Servicio correcto (si la predicción fue incorrecta)
    correct_service_id UUID REFERENCES public.service_catalog(id),
    correct_service_name TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS ml_feedback_interaction_id_idx 
ON public.ml_feedback(interaction_id);

CREATE INDEX IF NOT EXISTS ml_feedback_user_id_idx 
ON public.ml_feedback(user_id);

-- Habilitar RLS
ALTER TABLE public.ml_feedback ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden leer/insertar su propio feedback
CREATE POLICY "Users can manage own feedback"
    ON public.ml_feedback
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### **2.5 Función: Búsqueda Semántica de Servicios**

```sql
-- ============================================================================
-- FASE 1.2.5: Función para búsqueda semántica
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
        1 - (se.embedding <=> query_embedding) AS similarity,
        sc.min_price
    FROM public.service_embeddings se
    JOIN public.service_catalog sc ON sc.id = se.service_id
    WHERE 
        (discipline_filter IS NULL OR se.discipline = discipline_filter)
        AND sc.is_active = true
    ORDER BY se.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Comentario
COMMENT ON FUNCTION find_similar_services IS 'Busca servicios similares usando embeddings vectoriales';
```

---

## 📝 Paso 3: Implementar Generación de Embeddings

### **3.1 Crear Supabase Edge Function para Embeddings**

**Archivo:** `supabase/functions/generate-embedding/index.ts`

```typescript
// supabase/functions/generate-embedding/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Modelo: all-MiniLM-L6-v2 (multilingual, 384 dimensions)
// Usamos Hugging Face Inference API (gratis hasta cierto límite)
const HF_API_URL = 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';
const HF_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY') || '';

interface EmbeddingRequest {
    text: string;
    type?: 'service' | 'query' | 'user';
}

serve(async (req) => {
    try {
        const { text, type = 'query' }: EmbeddingRequest = await req.json();

        if (!text || text.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: 'Text is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Generar embedding usando Hugging Face
        const response = await fetch(HF_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(HF_API_KEY && { 'Authorization': `Bearer ${HF_API_KEY}` }),
            },
            body: JSON.stringify({
                inputs: text,
                options: {
                    wait_for_model: true,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[generate-embedding] HF API error:', error);
            throw new Error(`HF API error: ${response.status}`);
        }

        const embedding = await response.json();

        // Verificar que el embedding tiene 384 dimensiones
        if (!Array.isArray(embedding) || embedding.length !== 384) {
            throw new Error(`Invalid embedding dimensions: ${embedding.length}`);
        }

        return new Response(
            JSON.stringify({
                embedding,
                dimensions: embedding.length,
                text: text.substring(0, 100), // Primeros 100 caracteres
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('[generate-embedding] Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
```

### **3.2 Crear Servicio TypeScript para Embeddings**

**Archivo:** `SumeeClient/services/ml/embeddings.ts`

```typescript
// services/ml/embeddings.ts
import { supabase } from '@/lib/supabase';

const EMBEDDING_API_URL = process.env.EXPO_PUBLIC_SUPABASE_URL 
    ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-embedding`
    : 'https://sumeeapp.com/api/generate-embedding';

export interface EmbeddingResult {
    embedding: number[];
    dimensions: number;
    text: string;
}

export class EmbeddingService {
    /**
     * Generar embedding para un texto
     */
    static async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await fetch(EMBEDDING_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ text: text.trim() }),
            });

            if (!response.ok) {
                throw new Error(`Embedding API error: ${response.status}`);
            }

            const result: EmbeddingResult = await response.json();
            
            if (!result.embedding || result.embedding.length !== 384) {
                throw new Error(`Invalid embedding dimensions: ${result.embedding?.length}`);
            }

            return result.embedding;
        } catch (error) {
            console.error('[EmbeddingService] Error generating embedding:', error);
            throw error;
        }
    }

    /**
     * Generar y guardar embedding para un servicio
     */
    static async generateAndSaveServiceEmbedding(
        serviceId: string,
        serviceName: string,
        discipline: string
    ): Promise<void> {
        try {
            // Generar embedding del nombre y descripción del servicio
            const text = `${serviceName} ${discipline}`;
            const embedding = await this.generateEmbedding(text);

            // Guardar en Supabase
            const { error } = await supabase
                .from('service_embeddings')
                .upsert({
                    service_id: serviceId,
                    service_name: serviceName,
                    discipline,
                    embedding: `[${embedding.join(',')}]`, // Formato para pgvector
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'service_id',
                });

            if (error) {
                throw error;
            }

            console.log(`[EmbeddingService] Embedding saved for service: ${serviceName}`);
        } catch (error) {
            console.error('[EmbeddingService] Error saving service embedding:', error);
            throw error;
        }
    }

    /**
     * Buscar servicios similares usando embeddings
     */
    static async findSimilarServices(
        query: string,
        limit: number = 10,
        discipline?: string
    ): Promise<Array<{
        service_id: string;
        service_name: string;
        discipline: string;
        similarity: number;
        min_price: number;
    }>> {
        try {
            // Generar embedding del query
            const queryEmbedding = await this.generateEmbedding(query);

            // Llamar a función SQL de búsqueda semántica
            const { data, error } = await supabase.rpc('find_similar_services', {
                query_embedding: `[${queryEmbedding.join(',')}]`,
                limit_count: limit,
                discipline_filter: discipline || null,
            });

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('[EmbeddingService] Error finding similar services:', error);
            throw error;
        }
    }
}
```

---

## 📝 Paso 4: Data Collection Pipeline Básico

### **4.1 Servicio de Tracking de Interacciones**

**Archivo:** `SumeeClient/services/ml/tracking.ts`

```typescript
// services/ml/tracking.ts
import { supabase } from '@/lib/supabase';
import { EmbeddingService } from './embeddings';

export interface MLInteraction {
    query: string;
    predicted_service_id?: string;
    predicted_service_name?: string;
    predicted_confidence?: number;
    actual_service_id?: string;
    actual_service_name?: string;
    conversion?: boolean;
    lead_id?: string;
    features?: Record<string, any>;
    user_location?: { lat: number; lng: number };
    user_feedback?: string;
    was_correct?: boolean;
}

export class MLTrackingService {
    /**
     * Trackear una interacción (query del usuario)
     */
    static async trackInteraction(interaction: MLInteraction): Promise<string | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || null;

            // Generar embedding del query
            let queryEmbedding: number[] | null = null;
            try {
                queryEmbedding = await EmbeddingService.generateEmbedding(interaction.query);
            } catch (error) {
                console.warn('[MLTracking] Failed to generate query embedding:', error);
            }

            // Obtener contexto temporal
            const now = new Date();
            const timeOfDay = now.getHours();
            const dayOfWeek = now.getDay();

            // Insertar interacción
            const { data, error } = await supabase
                .from('ml_interactions')
                .insert({
                    user_id: userId,
                    query: interaction.query,
                    query_embedding: queryEmbedding ? `[${queryEmbedding.join(',')}]` : null,
                    predicted_service_id: interaction.predicted_service_id || null,
                    predicted_service_name: interaction.predicted_service_name || null,
                    predicted_confidence: interaction.predicted_confidence || null,
                    actual_service_id: interaction.actual_service_id || null,
                    actual_service_name: interaction.actual_service_name || null,
                    conversion: interaction.conversion || false,
                    lead_id: interaction.lead_id || null,
                    features: interaction.features || {},
                    user_location_lat: interaction.user_location?.lat || null,
                    user_location_lng: interaction.user_location?.lng || null,
                    time_of_day: timeOfDay,
                    day_of_week: dayOfWeek,
                })
                .select('id')
                .single();

            if (error) {
                throw error;
            }

            console.log('[MLTracking] Interaction tracked:', data.id);
            return data.id;
        } catch (error) {
            console.error('[MLTracking] Error tracking interaction:', error);
            return null;
        }
    }

    /**
     * Actualizar interacción con resultado real (cuando usuario selecciona servicio)
     */
    static async updateInteractionWithResult(
        interactionId: string,
        actualServiceId: string,
        actualServiceName: string,
        leadId?: string
    ): Promise<void> {
        try {
            const { error } = await supabase
                .from('ml_interactions')
                .update({
                    actual_service_id: actualServiceId,
                    actual_service_name: actualServiceName,
                    conversion: true,
                    lead_id: leadId || null,
                })
                .eq('id', interactionId);

            if (error) {
                throw error;
            }

            console.log('[MLTracking] Interaction updated with result');
        } catch (error) {
            console.error('[MLTracking] Error updating interaction:', error);
        }
    }

    /**
     * Trackear feedback del usuario
     */
    static async trackFeedback(
        interactionId: string,
        wasCorrect: boolean,
        feedbackText?: string,
        rating?: number,
        correctServiceId?: string,
        correctServiceName?: string
    ): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || null;

            const { error } = await supabase
                .from('ml_feedback')
                .insert({
                    interaction_id: interactionId,
                    user_id: userId,
                    was_correct: wasCorrect,
                    feedback_text: feedbackText || null,
                    rating: rating || null,
                    correct_service_id: correctServiceId || null,
                    correct_service_name: correctServiceName || null,
                });

            if (error) {
                throw error;
            }

            // También actualizar la interacción original
            await supabase
                .from('ml_interactions')
                .update({
                    was_correct: wasCorrect,
                    user_feedback: feedbackText || null,
                })
                .eq('id', interactionId);

            console.log('[MLTracking] Feedback tracked');
        } catch (error) {
            console.error('[MLTracking] Error tracking feedback:', error);
        }
    }
}
```

### **4.2 Integrar Tracking en AISearchBar**

**Modificar:** `SumeeClient/components/AISearchBar.tsx`

```typescript
// Agregar al inicio del archivo
import { MLTrackingService } from '@/services/ml/tracking';

// Dentro de analyzeProblem, después de obtener resultado:
const analyzeProblem = useCallback(async (problemDescription: string) => {
    // ... código existente ...
    
    try {
        const result = await AISearchService.analyzeProblem(problemDescription);
        setAiResult(result);
        
        // 🆕 TRACKING: Guardar interacción
        if (result.detected_service) {
            const interactionId = await MLTrackingService.trackInteraction({
                query: problemDescription,
                predicted_service_id: result.detected_service.id,
                predicted_service_name: result.detected_service.service_name,
                predicted_confidence: result.confidence,
                features: {
                    query_length: problemDescription.length,
                    has_urgency_keywords: problemDescription.toLowerCase().includes('urgente'),
                    // ... más features
                },
            });
            
            // Guardar interactionId para actualizar después
            setCurrentInteractionId(interactionId);
        }
        
        if (result.detected_service && onServiceDetected) {
            onServiceDetected(result);
        }
    } catch (error) {
        // ... manejo de errores ...
    }
}, [onServiceDetected, minLength]);

// Cuando usuario navega al servicio (actualizar con resultado real):
useEffect(() => {
    if (aiResult?.detected_service && currentInteractionId) {
        // Cuando usuario confirma el servicio
        MLTrackingService.updateInteractionWithResult(
            currentInteractionId,
            aiResult.detected_service.id,
            aiResult.detected_service.service_name
        );
    }
}, [aiResult, currentInteractionId]);
```

---

## 📝 Paso 5: Script de Población Inicial

### **5.1 Generar Embeddings para Todos los Servicios Existentes**

**Archivo:** `scripts/generate-initial-embeddings.ts`

```typescript
// scripts/generate-initial-embeddings.ts
import { createClient } from '@supabase/supabase-js';
import { EmbeddingService } from '../services/ml/embeddings';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateInitialEmbeddings() {
    console.log('🚀 Iniciando generación de embeddings para servicios...');

    // 1. Obtener todos los servicios activos
    const { data: services, error } = await supabase
        .from('service_catalog')
        .select('id, service_name, discipline')
        .eq('is_active', true);

    if (error) {
        console.error('Error obteniendo servicios:', error);
        return;
    }

    console.log(`📊 Encontrados ${services.length} servicios`);

    // 2. Generar embeddings para cada servicio
    let success = 0;
    let failed = 0;

    for (const service of services) {
        try {
            console.log(`⏳ Generando embedding para: ${service.service_name}`);
            
            await EmbeddingService.generateAndSaveServiceEmbedding(
                service.id,
                service.service_name,
                service.discipline
            );
            
            success++;
            console.log(`✅ Embedding generado: ${service.service_name}`);
            
            // Pequeña pausa para no sobrecargar la API
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`❌ Error con ${service.service_name}:`, error);
            failed++;
        }
    }

    console.log('\n📊 Resumen:');
    console.log(`✅ Exitosos: ${success}`);
    console.log(`❌ Fallidos: ${failed}`);
    console.log(`📦 Total: ${services.length}`);
}

// Ejecutar
generateInitialEmbeddings().catch(console.error);
```

---

## ✅ Checklist de Verificación

### **Paso 1: pgvector**
- [ ] Extensión `vector` habilitada en Supabase
- [ ] Verificación: `SELECT extname FROM pg_extension WHERE extname = 'vector';`

### **Paso 2: Tablas**
- [ ] `service_embeddings` creada
- [ ] `user_features` creada
- [ ] `ml_interactions` creada
- [ ] `ml_feedback` creada
- [ ] Función `find_similar_services` creada
- [ ] Índices creados correctamente
- [ ] RLS policies configuradas

### **Paso 3: Embeddings**
- [ ] Edge Function `generate-embedding` creada
- [ ] Servicio `EmbeddingService` implementado
- [ ] Prueba: Generar embedding de prueba

### **Paso 4: Tracking**
- [ ] Servicio `MLTrackingService` implementado
- [ ] Integrado en `AISearchBar`
- [ ] Prueba: Trackear interacción de prueba

### **Paso 5: Población Inicial**
- [ ] Script de generación de embeddings ejecutado
- [ ] Embeddings generados para todos los servicios
- [ ] Verificación: `SELECT COUNT(*) FROM service_embeddings;`

---

## 🧪 Pruebas

### **Test 1: Generar Embedding**
```typescript
const embedding = await EmbeddingService.generateEmbedding("necesito instalar una lámpara");
console.log('Embedding:', embedding.length); // Debería ser 384
```

### **Test 2: Buscar Servicios Similares**
```typescript
const results = await EmbeddingService.findSimilarServices("lámpara", 5);
console.log('Servicios similares:', results);
```

### **Test 3: Trackear Interacción**
```typescript
const id = await MLTrackingService.trackInteraction({
    query: "necesito instalar una lámpara",
    predicted_service_id: "xxx",
    predicted_service_name: "Instalación de Lámpara",
    predicted_confidence: 0.95,
});
console.log('Interaction ID:', id);
```

---

## 📊 Verificación Final

**Ejecutar en Supabase SQL Editor:**

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('service_embeddings', 'user_features', 'ml_interactions', 'ml_feedback');

-- Verificar embeddings generados
SELECT COUNT(*) as total_embeddings FROM service_embeddings;

-- Verificar función
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'find_similar_services';

-- Verificar índices
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('service_embeddings', 'user_features', 'ml_interactions');
```

---

## 🚀 Próximos Pasos (Fase 2)

Una vez completada la Fase 1:
1. ✅ Infraestructura lista
2. ✅ Data collection funcionando
3. ✅ Embeddings generados
4. → **Fase 2**: Entrenar modelo de clasificación

---

**¿Listo para comenzar? Empieza con el Paso 1 y verifica cada paso antes de continuar.**

