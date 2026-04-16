# 🤖 Propuesta de Vanguardia: Integración de IA en Búsqueda de Servicios

## 📊 Resumen Ejecutivo

Propuesta tecnológica de vanguardia para integrar **Inteligencia Artificial** en el sistema de búsqueda de SumeeClient, permitiendo que los clientes describan su problema en lenguaje natural y la IA los guíe automáticamente hacia el servicio correcto y la creación del lead adecuado.

---

## 🎯 Objetivos

1. **Experiencia Natural**: El cliente describe su problema como si hablara con un experto
2. **Detección Inteligente**: La IA identifica el servicio/disciplina más adecuado
3. **Guía Automática**: La IA pre-llena el formulario de solicitud con información relevante
4. **Reducción de Fricción**: Menos pasos, más precisión, mejor conversión
5. **Aprendizaje Continuo**: El sistema mejora con cada interacción

---

## 🔍 Análisis del Estado Actual

### **Sistema Actual:**
- ✅ Búsqueda básica por texto (`SearchService.search()`)
- ✅ Búsqueda en `service_catalog`, `profiles`, y `leads`
- ✅ Filtros simples con `ILIKE` (coincidencia parcial)
- ❌ No entiende lenguaje natural
- ❌ No sugiere servicios basado en descripción del problema
- ❌ No pre-llena formularios automáticamente

### **Limitaciones:**
1. El cliente debe saber el nombre exacto del servicio
2. No hay contexto sobre el problema real
3. No hay sugerencias inteligentes
4. El proceso de creación de lead es manual

---

## 🏗️ Arquitectura Propuesta

### **1. Stack Tecnológico**

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT APP (React Native)             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  AI Search Component (Nuevo)                     │   │
│  │  - Input de lenguaje natural                     │   │
│  │  - Sugerencias en tiempo real                    │   │
│  │  - Pre-llenado inteligente                       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTIONS (Backend)           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  AI Service Handler                              │   │
│  │  - Procesamiento de lenguaje natural             │   │
│  │  - Análisis semántico                            │   │
│  │  - Matching con servicios                        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              OPENAI API / EMBEDDINGS                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  GPT-4 / GPT-3.5 Turbo                          │   │
│  │  - Análisis de intención                         │   │
│  │  - Extracción de entidades                       │   │
│  │  - Generación de sugerencias                     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              SUPABASE DATABASE                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  - service_catalog (servicios disponibles)        │   │
│  │  - ai_search_history (aprendizaje)                │   │
│  │  - ai_suggestions_cache (optimización)            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### **2. Componentes Principales**

#### **A. AI Search Component (Frontend)**
```typescript
interface AISearchProps {
  onServiceDetected: (service: DetectedService) => void;
  onLeadPreFilled: (leadData: Partial<LeadData>) => void;
}

interface DetectedService {
  service_id: string;
  service_name: string;
  discipline: string;
  confidence: number; // 0-1
  reasoning: string; // Por qué se eligió este servicio
  suggested_price?: number;
  alternatives?: ServiceItem[]; // Servicios alternativos
}
```

#### **B. AI Service Handler (Backend - Supabase Edge Function)**
```typescript
// Supabase Edge Function: analyze-problem
export async function analyzeProblem(problemDescription: string) {
  // 1. Análisis con OpenAI
  // 2. Matching semántico con servicios
  // 3. Generación de sugerencias
  // 4. Pre-llenado de datos
}
```

#### **C. Embeddings para Matching Semántico**
- Generar embeddings de todos los servicios en `service_catalog`
- Almacenar en Supabase Vector Store (pgvector)
- Comparar embedding del problema del cliente con embeddings de servicios
- Encontrar el servicio más similar

---

## 🔄 Flujo de Usuario Propuesto

### **Flujo Actual (Sin IA):**
```
1. Cliente escribe "electricista"
2. Busca en BD con ILIKE
3. Muestra resultados genéricos
4. Cliente selecciona manualmente
5. Cliente llena formulario manualmente
```

### **Flujo Nuevo (Con IA):**
```
1. Cliente describe: "Tengo una fuga de agua en el baño, está goteando del techo"
   └─> IA analiza: Problema = "Fuga de agua", Ubicación = "Baño", Urgencia = "Alta"
   
2. IA detecta automáticamente:
   ✅ Servicio: "Reparación de fuga de agua"
   ✅ Disciplina: "plomeria"
   ✅ Confianza: 95%
   ✅ Precio sugerido: $500-800
   
3. IA pre-llena formulario:
   - Servicio: "Reparación de fuga de agua"
   - Descripción: "Fuga de agua en el baño, goteando del techo"
   - Urgencia: "Alta"
   - Ubicación: Pre-llenada si está disponible
   
4. Cliente revisa y confirma (o ajusta)
5. Lead creado automáticamente
```

---

## 🛠️ Implementación Técnica

### **FASE 1: Setup Inicial**

#### **1.1. Instalar Dependencias**
```bash
# En Supabase Edge Functions
npm install openai @supabase/supabase-js

# En Client App
npm install @supabase/functions-js
```

#### **1.2. Configurar OpenAI**
```typescript
// supabase/functions/analyze-problem/index.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});
```

#### **1.3. Crear Tabla de Historial de Búsquedas IA**
```sql
-- Tabla para aprendizaje y analytics
CREATE TABLE ai_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    problem_description TEXT NOT NULL,
    detected_service_id UUID REFERENCES service_catalog(id),
    detected_discipline TEXT,
    confidence_score NUMERIC(3,2),
    user_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para cache de embeddings
CREATE TABLE service_embeddings (
    service_id UUID PRIMARY KEY REFERENCES service_catalog(id),
    embedding vector(1536), -- OpenAI embedding dimension
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda vectorial
CREATE INDEX ON service_embeddings USING ivfflat (embedding vector_cosine_ops);
```

### **FASE 2: Edge Function - Análisis de Problema**

```typescript
// supabase/functions/analyze-problem/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://deno.land/x/openai@v4.0.0/mod.ts';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

serve(async (req) => {
  try {
    const { problemDescription, userId } = await req.json();
    
    // 1. Análisis con GPT-4
    const analysis = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente experto en servicios del hogar. Analiza el problema del cliente y determina:
1. Tipo de servicio necesario (disciplina)
2. Urgencia (baja, media, alta)
3. Detalles relevantes
4. Precio estimado si es posible

Responde en JSON:
{
  "discipline": "plomeria|electricidad|...",
  "service_name": "Nombre específico del servicio",
  "urgency": "baja|media|alta",
  "details": "Detalles extraídos",
  "estimated_price_range": {"min": 500, "max": 800},
  "reasoning": "Por qué este servicio"
}`
        },
        {
          role: 'user',
          content: problemDescription
        }
      ],
      response_format: { type: 'json_object' }
    });

    const aiAnalysis = JSON.parse(analysis.choices[0].message.content);
    
    // 2. Buscar servicio más similar en BD
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: services } = await supabase
      .from('service_catalog')
      .select('*')
      .eq('discipline', aiAnalysis.discipline)
      .eq('is_active', true)
      .ilike('service_name', `%${aiAnalysis.service_name}%`)
      .limit(5);
    
    // 3. Generar embedding del problema
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: problemDescription
    });
    
    const problemEmbedding = embeddingResponse.data[0].embedding;
    
    // 4. Buscar servicios similares usando embeddings (si están disponibles)
    // ... (implementación de búsqueda vectorial)
    
    // 5. Retornar resultado
    return new Response(
      JSON.stringify({
        detected_service: services?.[0] || null,
        alternatives: services?.slice(1) || [],
        ai_analysis: aiAnalysis,
        confidence: 0.95,
        pre_filled_data: {
          servicio: aiAnalysis.service_name,
          descripcion: problemDescription,
          urgencia: aiAnalysis.urgency,
          precio_estimado: aiAnalysis.estimated_price_range
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
```

### **FASE 3: Componente Frontend - AI Search**

```typescript
// components/AISearchBar.tsx
import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

interface AISearchBarProps {
  onServiceDetected: (result: AISearchResult) => void;
  placeholder?: string;
}

interface AISearchResult {
  detected_service: ServiceItem;
  alternatives: ServiceItem[];
  confidence: number;
  pre_filled_data: Partial<LeadData>;
  reasoning: string;
}

export function AISearchBar({ onServiceDetected, placeholder }: AISearchBarProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const analyzeProblem = useCallback(async (problemDescription: string) => {
    if (!problemDescription.trim() || problemDescription.length < 10) {
      return;
    }

    setAnalyzing(true);
    try {
      // Llamar a Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-problem', {
        body: { 
          problemDescription,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;

      if (data?.detected_service) {
        onServiceDetected(data);
      }
    } catch (error) {
      console.error('[AISearch] Error:', error);
    } finally {
      setAnalyzing(false);
    }
  }, [onServiceDetected]);

  // Debounce para análisis automático
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 20) {
        analyzeProblem(query);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [query, analyzeProblem]);

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons 
          name={analyzing ? 'sparkles' : 'search'} 
          size={20} 
          color={analyzing ? theme.primary : theme.textSecondary} 
        />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder || "Describe tu problema... Ej: 'Tengo una fuga de agua en el baño'"}
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={setQuery}
          multiline
          maxLength={500}
        />
        {analyzing && (
          <ActivityIndicator size="small" color={theme.primary} />
        )}
        {query.length > 0 && !analyzing && (
          <TouchableOpacity onPress={() => analyzeProblem(query)}>
            <Ionicons name="send" size={20} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Sugerencias en tiempo real */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.suggestionTag, { backgroundColor: theme.surface }]}
              onPress={() => setQuery(suggestion)}
            >
              <Text variant="caption">{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
```

### **FASE 4: Integración con Formulario de Lead**

```typescript
// app/request-service/ai-guided.tsx
export default function AIGuidedServiceRequest() {
  const [aiResult, setAIResult] = useState<AISearchResult | null>(null);
  const [formData, setFormData] = useState<LeadData>({});

  const handleAIDetection = (result: AISearchResult) => {
    setAIResult(result);
    // Pre-llenar formulario con datos de IA
    setFormData({
      servicio: result.detected_service.service_name,
      disciplina: result.detected_service.discipline,
      descripcion: result.pre_filled_data.descripcion,
      urgencia: result.pre_filled_data.urgencia,
      precio_estimado: result.pre_filled_data.precio_estimado,
    });
  };

  return (
    <View>
      {/* AI Search Bar */}
      <AISearchBar onServiceDetected={handleAIDetection} />
      
      {/* Resultado de IA */}
      {aiResult && (
        <AISuggestionCard
          service={aiResult.detected_service}
          confidence={aiResult.confidence}
          reasoning={aiResult.reasoning}
          alternatives={aiResult.alternatives}
          onConfirm={() => router.push('/request-service/confirm')}
          onEdit={() => {/* Permitir editar */}}
        />
      )}
      
      {/* Formulario pre-llenado */}
      <ServiceRequestForm initialData={formData} />
    </View>
  );
}
```

---

## 🎨 Experiencia de Usuario (UX)

### **Pantalla de Búsqueda con IA:**

```
┌─────────────────────────────────────────┐
│  ← Buscar                                │
├─────────────────────────────────────────┤
│  🤖 Describe tu problema...             │
│  ┌───────────────────────────────────┐  │
│  │ Tengo una fuga de agua en el      │  │
│  │ baño, está goteando del techo     │  │
│  │                                   │  │
│  │                    [✨ Analizar] │  │
│  └───────────────────────────────────┘  │
│                                         │
│  💡 Sugerencias:                        │
│  • "Reparar fuga de agua"              │
│  • "Instalar lámpara"                   │
│  • "Pintar habitación"                  │
└─────────────────────────────────────────┘
```

### **Resultado de IA:**

```
┌─────────────────────────────────────────┐
│  ✅ Servicio Detectado                  │
│                                         │
│  🔧 Reparación de fuga de agua         │
│  📍 Plomería                            │
│  💰 $500 - $800                         │
│  🎯 Confianza: 95%                      │
│                                         │
│  💬 "Detecté que necesitas un plomero  │
│      para reparar una fuga de agua en   │
│      el baño. Basado en tu descripción, │
│      este servicio es el más adecuado." │
│                                         │
│  [✅ Confirmar y Continuar]             │
│  [✏️ Editar Detalles]                   │
│                                         │
│  🔄 Alternativas:                        │
│  • Reparación de tubería                │
│  • Mantenimiento de plomería            │
└─────────────────────────────────────────┘
```

---

## 📊 Métricas de Éxito

1. **Tasa de Conversión**: % de búsquedas que resultan en leads creados
2. **Precisión de IA**: % de servicios detectados correctamente
3. **Tiempo de Proceso**: Reducción del tiempo para crear un lead
4. **Satisfacción del Usuario**: Feedback sobre la experiencia
5. **Aprendizaje**: Mejora continua basada en confirmaciones del usuario

---

## 🚀 Roadmap de Implementación

### **Sprint 1 (Semana 1-2): Setup y MVP**
- ✅ Configurar OpenAI API
- ✅ Crear Edge Function básica
- ✅ Implementar componente AISearchBar
- ✅ Integración básica con formulario

### **Sprint 2 (Semana 3-4): Mejoras y Optimización**
- ✅ Implementar embeddings y búsqueda vectorial
- ✅ Cache de resultados
- ✅ Historial de búsquedas
- ✅ Analytics y métricas

### **Sprint 3 (Semana 5-6): Refinamiento**
- ✅ Mejora de prompts de IA
- ✅ Aprendizaje continuo
- ✅ Sugerencias personalizadas
- ✅ Testing y optimización

---

## 💰 Consideraciones de Costo

### **OpenAI API:**
- GPT-4 Turbo: ~$0.01 por búsqueda (promedio)
- Embeddings: ~$0.0001 por servicio
- Estimado: $50-100/mes para 5,000 búsquedas

### **Supabase:**
- Edge Functions: Incluido en plan
- Vector Store: Incluido con pgvector
- Storage: Mínimo

---

## 🔒 Seguridad y Privacidad

1. **Datos del Cliente**: No se comparten con OpenAI más allá de la descripción del problema
2. **API Keys**: Almacenadas en variables de entorno de Supabase
3. **Historial**: Opcional, el usuario puede desactivarlo
4. **Cumplimiento**: GDPR compliant

---

## 🎯 Ventajas Competitivas

1. **Primera en el mercado**: Pocas apps de servicios tienen IA integrada
2. **Experiencia superior**: Reducción de fricción en el proceso
3. **Precisión mejorada**: Menos leads incorrectos
4. **Escalabilidad**: Funciona con cualquier cantidad de servicios
5. **Aprendizaje continuo**: Mejora con el tiempo

---

## 📝 Próximos Pasos

1. **Aprobar propuesta**
2. **Configurar OpenAI API Key**
3. **Crear Edge Function en Supabase**
4. **Implementar componente AISearchBar**
5. **Testing con usuarios beta**
6. **Lanzamiento gradual**

---

## 🤝 Conclusión

Esta propuesta transforma la búsqueda de servicios de un proceso manual y genérico a una experiencia inteligente y guiada por IA, mejorando significativamente la experiencia del usuario y aumentando la conversión de leads.

**¿Listo para implementar?** 🚀

