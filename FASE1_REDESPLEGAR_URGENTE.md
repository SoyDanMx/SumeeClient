# 🚨 URGENTE: Redesplegar Edge Function

## ❌ Problema Actual

Ambos modelos (principal y alternativo) fallan con error **410** porque:
- La Edge Function desplegada en Supabase **aún usa el endpoint antiguo**
- `api-inference.huggingface.co` ya no está soportado
- Necesita usar `router.huggingface.co`

---

## ✅ Solución: Redesplegar

### **Paso 1: Verificar Código Local**

El código en `Sumeeapp-B/supabase/functions/generate-embedding/index.ts` ya está actualizado con:
```typescript
const HF_API_URL = 'https://router.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';
const HF_API_URL_ALT = 'https://router.huggingface.co/models/sentence-transformers/all-mpnet-base-v2';
```

### **Paso 2: Redesplegar en Supabase**

1. **Ve a Supabase Dashboard**
   - Navega a **Edge Functions** > **generate-embedding**

2. **Ve a la pestaña "Code"**

3. **Copia el código completo** de:
   - `Sumeeapp-B/supabase/functions/generate-embedding/index.ts`

4. **Pega en el editor de Supabase**
   - Reemplaza TODO el código existente

5. **Haz clic en "Deploy"**
   - Espera a que termine el despliegue

6. **Verifica**
   - Deberías ver "Deployment successful" o similar

---

## 🧪 Probar Después del Redespliegue

1. Ve a **Edge Functions** > **generate-embedding** > **Test**
2. Usa este JSON en "Request Body":
```json
{
  "text": "Instalación de lámpara eléctrica",
  "type": "service"
}
```
3. Haz clic en **"Send Request"**
4. Deberías recibir un embedding de 384 dimensiones

---

## ⚠️ Si Aún Falla Después del Redespliegue

Si el nuevo endpoint `router.huggingface.co` también falla, puede ser que:

1. **El formato de request sea diferente**
   - El nuevo router puede requerir un formato diferente
   - Puede necesitar headers adicionales

2. **El modelo necesite ser cargado primero**
   - Espera unos minutos y reintenta

3. **Necesites usar un modelo diferente**
   - Algunos modelos pueden no estar disponibles en el nuevo router

---

## 🔄 Alternativa: Usar Text Embeddings API Directamente

Si Hugging Face sigue dando problemas, podemos cambiar a usar directamente la API de embeddings de Supabase o OpenAI, pero eso requeriría cambios más grandes.

---

## ✅ Verificación Rápida

Después de redesplegar, verifica en los logs:
- ✅ Deberías ver: `[generate-embedding] Generating embedding for: ...`
- ✅ NO deberías ver: `api-inference.huggingface.co is no longer supported`
- ✅ Deberías ver: `✅ Embedding generated: 384 dimensions`

---

**Acción Requerida:** Redesplegar la Edge Function con el código actualizado. 🚀

