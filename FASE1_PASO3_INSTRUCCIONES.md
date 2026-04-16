# 📝 Paso 3: Implementar Generación de Embeddings - Instrucciones

## ✅ Archivos Creados

1. **Edge Function:** `Sumeeapp-B/supabase/functions/generate-embedding/index.ts`
2. **Config Deno:** `Sumeeapp-B/supabase/functions/generate-embedding/deno.json`
3. **Servicio TypeScript:** `SumeeClient/services/ml/embeddings.ts`

---

## 🚀 Paso 3.1: Desplegar Edge Function

### **Opción A: Usando Supabase CLI (Recomendado)**

```bash
# 1. Ir al directorio de Sumeeapp-B
cd /Users/danielnuno/Documents/Sumee-Universe/Sumeeapp-B

# 2. Asegúrate de estar logueado
supabase login

# 3. Link tu proyecto (si no está linkeado)
supabase link --project-ref [TU_PROJECT_REF]

# 4. Desplegar la función
supabase functions deploy generate-embedding
```

### **Opción B: Usando Supabase Dashboard**

1. Ve a **Supabase Dashboard** > **Edge Functions**
2. Haz clic en **"Create a new function"**
3. Nombre: `generate-embedding`
4. Copia el contenido de `Sumeeapp-B/supabase/functions/generate-embedding/index.ts`
5. Pega en el editor
6. Haz clic en **"Deploy"**

---

## 🔑 Paso 3.2: Configurar HUGGINGFACE_API_KEY (Opcional)

**Nota:** La API de Hugging Face funciona sin API key (con límites), pero es recomendable tener una.

### **Obtener API Key:**

1. Ve a [Hugging Face](https://huggingface.co)
2. Crea una cuenta o inicia sesión
3. Ve a **Settings** > **Access Tokens**
4. Crea un nuevo token (tipo: Read)
5. Copia el token

### **Configurar en Supabase:**

1. Ve a **Supabase Dashboard** > **Edge Functions** > **Settings** > **Secrets**
2. Haz clic en **"Add new secret"**
3. Nombre: `HUGGINGFACE_API_KEY`
4. Valor: Pega tu token de Hugging Face
5. Guarda

**⚠️ Sin API Key:** La función funcionará pero puede tener límites de rate limiting.

---

## 🧪 Paso 3.3: Probar Generación de Embedding

### **Test 1: Desde el Cliente (TypeScript)**

```typescript
import { EmbeddingService } from '@/services/ml/embeddings';

// Probar generación de embedding
const embedding = await EmbeddingService.generateEmbedding("necesito instalar una lámpara");
console.log('Embedding:', embedding.length); // Debería ser 384
```

### **Test 2: Desde Supabase Dashboard**

1. Ve a **Edge Functions** > **generate-embedding**
2. Haz clic en **"Invoke"**
3. Body:
```json
{
  "text": "necesito instalar una lámpara",
  "type": "query"
}
```
4. Haz clic en **"Invoke function"**
5. Deberías ver un array de 384 números

---

## ✅ Verificación

### **Verificar que la función está desplegada:**

1. Ve a **Supabase Dashboard** > **Edge Functions**
2. Deberías ver `generate-embedding` en la lista
3. Estado debería ser "Active"

### **Verificar que el servicio TypeScript funciona:**

```typescript
// En cualquier componente o servicio
import { EmbeddingService } from '@/services/ml/embeddings';

try {
    const embedding = await EmbeddingService.generateEmbedding("test");
    console.log('✅ Embedding generado:', embedding.length === 384);
} catch (error) {
    console.error('❌ Error:', error);
}
```

---

## 🐛 Troubleshooting

### **Error: "Failed to send a request to the Edge Function"**
- **Solución:** Verifica que la función está desplegada en Supabase Dashboard

### **Error: "Model is loading"**
- **Solución:** Espera 10-30 segundos y vuelve a intentar (el modelo se carga la primera vez)

### **Error: "Invalid embedding dimensions"**
- **Solución:** Verifica que la API de Hugging Face está funcionando correctamente

### **Error: CORS**
- **Solución:** La función ya incluye headers CORS, pero verifica que `EXPO_PUBLIC_SUPABASE_URL` está configurado

---

## 📋 Checklist

- [ ] Edge Function desplegada en Supabase
- [ ] HUGGINGFACE_API_KEY configurada (opcional)
- [ ] Servicio TypeScript `EmbeddingService` creado
- [ ] Prueba de generación de embedding exitosa
- [ ] Prueba de búsqueda semántica exitosa

---

## 🎯 Siguiente Paso

Una vez completado el Paso 3:
- **Paso 4:** Data Collection Pipeline
- **Paso 5:** Población Inicial (generar embeddings para todos los servicios)

---

**¿Listo para desplegar la Edge Function?**

