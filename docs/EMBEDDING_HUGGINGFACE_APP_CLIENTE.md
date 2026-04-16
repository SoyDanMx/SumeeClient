# Embedding con Hugging Face en la app cliente (SumeeClient)

## ¿Está implementado?

**Sí.** La app cliente ya usa embeddings con Hugging Face de forma integrada.

## Cómo funciona

1. **Backend (Supabase)**  
   - **Edge Function** `generate-embedding`: recibe texto y devuelve un vector de 384 dimensiones usando un modelo de Hugging Face (p. ej. `all-MiniLM-L6-v2` o el que tengas en tu Inference Endpoint).  
   - Código: `Sumeeapp-B/supabase/functions/generate-embedding/index.ts`.  
   - Secret: `HUGGINGFACE_API_KEY` (o `HUGGINGFACE_API_KEY` según tu config).

2. **Base de datos**  
   - Tabla **`service_embeddings`**: guarda un embedding por servicio (`service_id`, `embedding` vector 384).  
   - Función **`find_similar_services(query_embedding, limit_count, discipline_filter)`**: búsqueda por similitud (pgvector).  
   - Los embeddings de los servicios se generan con la pantalla admin o el script `generate-service-embeddings`.

3. **App cliente (SumeeClient)**  
   - **`services/ml/embeddings.ts`** – `EmbeddingService`:  
     - `generateEmbedding(text)`: llama a la Edge Function y devuelve el vector.  
     - `findSimilarServices(query, limit, discipline?)`: genera el embedding del texto del usuario, llama a la RPC `find_similar_services` y devuelve servicios ordenados por similitud.  
     - `generateAndSaveServiceEmbedding(...)`: para poblar `service_embeddings`.  
     - `generateUserEmbedding(userId)`: embedding del historial del usuario (opcional).  
   - **`services/aiSearch.ts`** – **CAPA 2** del flujo de búsqueda:  
     - Tras el mapping directo (CAPA 1), se llama a **`EmbeddingService.findSimilarServices(problemDescription)`**.  
     - Si hay resultados con **similitud ≥ 0.5**, se toma el mejor como servicio detectado y se devuelve ese resultado (sin usar Gemini en ese caso).  
     - Si la búsqueda por embeddings falla o no hay resultados suficientes, se sigue con Gemini (CAPA 3) o API route / fallback (CAPA 4 / 5).

## Orden del flujo de búsqueda en la app

1. **CAPA 1**: Service mapping (sinónimos / mapeo directo).  
2. **CAPA 2**: **Embeddings (Hugging Face)** → Edge Function + `find_similar_services`.  
3. **CAPA 3**: Gemini (si hay API key).  
4. **CAPA 4**: API route de Sumeeapp-B (`/api/ai-search`).  
5. **CAPA 5**: Fallback por palabras clave.

## Qué necesitas para que funcione

- **Supabase**: Edge Function `generate-embedding` desplegada y secret `HUGGINGFACE_API_KEY` configurado.  
- **Base de datos**:  
  - Tabla `service_embeddings` (y extensión pgvector).  
  - Función RPC `find_similar_services`.  
  - Servicios con embeddings generados (admin `/admin/generate-embeddings` o script).  
- **App**: `EXPO_PUBLIC_SUPABASE_URL` (y anon key) para que la app llame a la Edge Function.

Si la tabla o la RPC no existen, o no hay embeddings generados, la CAPA 2 falla y el flujo sigue con Gemini/API/fallback sin romper la app.

## Resumen

- **Sí es posible** y **ya está implementado**: la app cliente usa Hugging Face vía Edge Function para generar embeddings y, con la RPC `find_similar_services`, hace búsqueda semántica de servicios.  
- La integración está en **`EmbeddingService`** + **CAPA 2 de `AISearchService.analyzeProblem()`**.
