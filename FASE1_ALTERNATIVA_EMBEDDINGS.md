# 🔄 Alternativa: Si Hugging Face Sigue Fallando

## ⚠️ Problema Persistente

Si después de redesplegar con `router.huggingface.co` sigue fallando, podemos usar alternativas:

---

## ✅ Opción 1: Usar OpenAI Embeddings (Recomendado)

OpenAI tiene embeddings muy confiables y rápidos:

### **Ventajas:**
- ✅ Muy confiable (99.9% uptime)
- ✅ Rápido (< 100ms)
- ✅ 1536 dimensiones (más rico que 384)
- ✅ API estable y bien documentada

### **Desventajas:**
- ❌ Requiere API key de OpenAI (pago por uso)
- ❌ Costo: ~$0.0001 por 1K tokens

### **Implementación:**

```typescript
// En la Edge Function
const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
        model: 'text-embedding-3-small', // 1536 dimensiones, barato
        input: text.trim(),
    }),
});

const data = await response.json();
const embedding = data.data[0].embedding; // Array de 1536 números
// Reducir a 384 si es necesario para compatibilidad
```

---

## ✅ Opción 2: Usar Supabase Vector Extension Directamente

Supabase tiene soporte nativo para embeddings usando `pgvector`:

### **Ventajas:**
- ✅ Sin dependencias externas
- ✅ Gratis (usa recursos de Supabase)
- ✅ Integrado con la base de datos

### **Desventajas:**
- ❌ Requiere instalar modelo de ML localmente (complejo)
- ❌ Menos flexible

---

## ✅ Opción 3: Usar Cohere Embeddings

Cohere ofrece embeddings gratuitos hasta cierto límite:

### **Ventajas:**
- ✅ Plan gratuito generoso
- ✅ API estable
- ✅ 1024 dimensiones

### **Implementación:**

```typescript
const COHERE_API_URL = 'https://api.cohere.ai/v1/embed';
const COHERE_API_KEY = Deno.env.get('COHERE_API_KEY') || '';

const response = await fetch(COHERE_API_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COHERE_API_KEY}`,
    },
    body: JSON.stringify({
        texts: [text.trim()],
        model: 'embed-english-v3.0',
        input_type: 'search_document',
    }),
});

const data = await response.json();
const embedding = data.embeddings[0]; // Array de 1024 números
```

---

## ✅ Opción 4: Esperar y Reintentar Hugging Face

A veces Hugging Face tiene problemas temporales:

1. **Esperar 10-15 minutos**
2. **Verificar estado:** https://status.huggingface.co/
3. **Reintentar**

---

## 🎯 Recomendación

**Para producción:** Usar **OpenAI Embeddings**
- Más confiable
- Mejor soporte
- Precio razonable (~$0.10 por 1000 embeddings)

**Para desarrollo/testing:** Intentar primero con Hugging Face (gratis)
- Si falla, cambiar a OpenAI

---

## 📋 Pasos para Cambiar a OpenAI

1. **Obtener API Key de OpenAI:**
   - Ve a https://platform.openai.com/api-keys
   - Crea una nueva API key

2. **Agregar Secret en Supabase:**
   - Edge Functions > Secrets
   - Agregar: `OPENAI_API_KEY` = tu API key

3. **Actualizar Edge Function:**
   - Cambiar código para usar OpenAI
   - Redesplegar

4. **Ajustar dimensiones:**
   - OpenAI usa 1536 dimensiones
   - Ajustar tabla `service_embeddings` o reducir dimensiones

---

**¿Quieres que implemente la solución con OpenAI?** 🚀

