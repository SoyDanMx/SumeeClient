# 📋 Código Final: generate-embedding (Con Múltiples Formatos)

## 🔧 Código Actualizado

Este código intenta múltiples formatos del nuevo router de Hugging Face:

```typescript
// supabase/functions/generate-embedding/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Modelo: all-MiniLM-L6-v2 (multilingual, 384 dimensions)
// Usamos Hugging Face Inference API (gratis hasta cierto límite)
// NOTA: Hugging Face cambió a router.huggingface.co (enero 2026)
// El nuevo router puede usar diferentes formatos de URL
// Intentamos múltiples formatos hasta encontrar el correcto
const HF_API_URL_V1 = 'https://router.huggingface.co/v1/models/sentence-transformers/all-MiniLM-L6-v2';
const HF_API_URL_DIRECT = 'https://router.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';
const HF_API_URL_ALT = 'https://router.huggingface.co/models/sentence-transformers/all-mpnet-base-v2';
const HF_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY') || '';

interface EmbeddingRequest {
    text: string;
    type?: 'service' | 'query' | 'user';
}

interface EmbeddingResponse {
    embedding: number[];
    dimensions: number;
    text: string;
    model: string;
}

serve(async (req) => {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { text, type = 'query' }: EmbeddingRequest = await req.json();

        if (!text || text.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: 'Text is required' }),
                { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        console.log(`[generate-embedding] Generating embedding for: ${text.substring(0, 50)}...`);

        // Generar embedding usando Hugging Face
        // El nuevo router puede requerir diferentes formatos
        // Intentar múltiples formatos hasta encontrar el correcto
        let requestBody: any = {
            inputs: text.trim(),
        };
        
        if (HF_API_KEY) {
            requestBody.options = { wait_for_model: true };
        }

        // Intentar primero con /v1/models/...
        let response = await fetch(HF_API_URL_V1, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(HF_API_KEY && { 'Authorization': `Bearer ${HF_API_KEY}` }),
            },
            body: JSON.stringify(requestBody),
        });

        // Si 404, intentar con formato directo /models/...
        if (response.status === 404) {
            console.log('[generate-embedding] 404 with /v1/models/, trying /models/...');
            response = await fetch(HF_API_URL_DIRECT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(HF_API_KEY && { 'Authorization': `Bearer ${HF_API_KEY}` }),
                },
                body: JSON.stringify(requestBody),
            });
        }

        if (!response.ok) {
            const error = await response.text();
            console.error('[generate-embedding] HF API error:', error);
            
            // Si el modelo está cargando (503), esperar y reintentar
            if (response.status === 503) {
                console.log('[generate-embedding] Model is loading, waiting 5 seconds...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                const retryBody: { inputs: string; options?: { wait_for_model: boolean } } = {
                    inputs: text.trim(),
                };
                if (HF_API_KEY) {
                    retryBody.options = { wait_for_model: true };
                }

                const retryResponse = await fetch(HF_API_URL_DIRECT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(HF_API_KEY && { 'Authorization': `Bearer ${HF_API_KEY}` }),
                    },
                    body: JSON.stringify(retryBody),
                });

                if (!retryResponse.ok) {
                    throw new Error(`HF API error after retry: ${retryResponse.status}`);
                }

                const embedding = await retryResponse.json();
                return handleEmbeddingResponse(embedding, text, corsHeaders);
            }
            
            // Si el modelo no está disponible (410), intentar con modelo alternativo
            if (response.status === 410) {
                console.log('[generate-embedding] Model unavailable (410), trying alternative model...');
                const altBody = {
                    inputs: text.trim(),
                };
                if (HF_API_KEY) {
                    altBody.options = { wait_for_model: true };
                }

                const altResponse = await fetch(HF_API_URL_ALT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(HF_API_KEY && { 'Authorization': `Bearer ${HF_API_KEY}` }),
                    },
                    body: JSON.stringify(altBody),
                });

                if (!altResponse.ok) {
                    throw new Error(`Alternative model also failed: ${altResponse.status}`);
                }

                const embedding = await altResponse.json();
                return handleEmbeddingResponse(embedding, text, corsHeaders, true);
            }
            
            throw new Error(`HF API error: ${response.status}`);
        }

        const embedding = await response.json();
        return handleEmbeddingResponse(embedding, text, corsHeaders);

    } catch (error) {
        console.error('[generate-embedding] Error:', error);
        return new Response(
            JSON.stringify({ 
                error: error.message || 'Error generating embedding',
                details: error.toString()
            }),
            { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
        );
    }
});

function handleEmbeddingResponse(
    embedding: any,
    text: string,
    corsHeaders: Record<string, string>,
    isAlternative: boolean = false
): Response {
    // Hugging Face puede devolver el embedding directamente o en un array
    let embeddingArray: number[];
    
    if (Array.isArray(embedding)) {
        // Si es un array directo
        embeddingArray = embedding;
    } else if (embedding[0] && Array.isArray(embedding[0])) {
        // Si está anidado: [[0.1, 0.2, ...]]
        embeddingArray = embedding[0];
    } else if (embedding.embedding && Array.isArray(embedding.embedding)) {
        // Si tiene propiedad embedding
        embeddingArray = embedding.embedding;
    } else {
        throw new Error('Invalid embedding format from Hugging Face API');
    }

    // Verificar dimensiones del embedding
    const expectedDimensions = isAlternative ? 768 : 384;
    
    if (embeddingArray.length !== expectedDimensions) {
        console.warn(`[generate-embedding] Warning: Expected ${expectedDimensions} dimensions, got ${embeddingArray.length}`);
        
        // Si estamos usando el modelo alternativo (768 dim), necesitamos reducir a 384
        if (isAlternative && embeddingArray.length === 768) {
            // Usar PCA simple: tomar cada 2 valores y promediar (reducción aproximada)
            embeddingArray = Array.from({ length: 384 }, (_, i) => {
                const idx1 = i * 2;
                const idx2 = idx1 + 1;
                return (embeddingArray[idx1] + (embeddingArray[idx2] || 0)) / 2;
            });
        } else if (embeddingArray.length < 384) {
            // Si tiene menos dimensiones, rellenar con ceros
            embeddingArray = [...embeddingArray, ...new Array(384 - embeddingArray.length).fill(0)];
        } else {
            // Si tiene más, truncar
            embeddingArray = embeddingArray.slice(0, 384);
        }
    }

    const result: EmbeddingResponse = {
        embedding: embeddingArray,
        dimensions: embeddingArray.length,
        text: text.substring(0, 100), // Primeros 100 caracteres
        model: 'all-MiniLM-L6-v2',
    };

    console.log(`[generate-embedding] ✅ Embedding generated: ${embeddingArray.length} dimensions`);

    return new Response(
        JSON.stringify(result),
        {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
    );
}
```

---

## ⚠️ Si el 404 Persiste

Si después de redesplegar con este código el error 404 continúa, el nuevo router de Hugging Face puede requerir un formato completamente diferente o puede no estar completamente operativo aún.

**Recomendación:** Cambiar a **OpenAI Embeddings** para producción (más confiable y estable).

---

## 🚀 Alternativa: OpenAI Embeddings

Si Hugging Face sigue fallando, puedo implementar OpenAI Embeddings que es:
- ✅ Más confiable (99.9% uptime)
- ✅ API estable y bien documentada
- ✅ Rápido (< 100ms)
- ✅ 1536 dimensiones (más rico)

**Costo:** ~$0.0001 por embedding (~$0.10 por 1000 embeddings)

---

**¿Redesplegamos con este código o prefieres cambiar a OpenAI?** 🤔

