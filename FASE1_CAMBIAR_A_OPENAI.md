# 🚀 Cambio a OpenAI Embeddings

## ⚠️ Problema con Hugging Face

El nuevo router de Hugging Face (`router.huggingface.co`) está devolviendo **404** con todos los formatos probados:
- ❌ `/v1/models/...` → 404
- ❌ `/models/...` → 404
- ❌ Modelo alternativo → 404

**Conclusión:** El nuevo router no está completamente operativo o requiere un formato completamente diferente.

---

## ✅ Solución: OpenAI Embeddings

He cambiado la Edge Function para usar **OpenAI Embeddings**:

### **Ventajas:**
- ✅ **99.9% uptime** (más confiable)
- ✅ **API estable** y bien documentada
- ✅ **Rápido** (< 100ms)
- ✅ **1536 dimensiones** (más rico que 384, luego reducido a 384 para compatibilidad)
- ✅ **Costo razonable:** ~$0.00002 por embedding (~$0.02 por 1000 embeddings)

### **Modelo:**
- `text-embedding-3-small` (1536 dimensiones)
- Reducido a 384 dimensiones para compatibilidad con `pgvector`

---

## 📋 Pasos para Implementar

### **Paso 1: Configurar OpenAI API Key**

1. Ve a **Supabase Dashboard** > **Project Settings** > **Edge Functions** > **Secrets**
2. Haz clic en **"Add a new secret"**
3. Nombre: `OPENAI_API_KEY`
4. Valor: Tu API key de OpenAI (obtén una en https://platform.openai.com/api-keys)
5. Haz clic en **"Save"**

### **Paso 2: Redesplegar Edge Function**

1. Ve a **Edge Functions** > **generate-embedding** > **Code**
2. **Borra TODO el código existente**
3. **Pega el código nuevo** (está en `Sumeeapp-B/supabase/functions/generate-embedding/index.ts`)
4. Haz clic en **"Deploy"**

### **Paso 3: Probar**

1. Ve a la pestaña **"Test"**
2. Usa este JSON:

```json
{
  "text": "Instalación de lámpara eléctrica",
  "type": "service"
}
```

3. Deberías recibir un embedding de 384 dimensiones ✅

---

## 💰 Costo Estimado

- **Por embedding:** ~$0.00002
- **Por 1000 embeddings:** ~$0.02
- **Por 10,000 embeddings:** ~$0.20
- **Por 100,000 embeddings:** ~$2.00

**Muy económico para producción.** 💪

---

## 🔧 Código Actualizado

El código está en:
```
Sumeeapp-B/supabase/functions/generate-embedding/index.ts
```

**Características:**
- ✅ Usa OpenAI API directamente
- ✅ Reduce de 1536 a 384 dimensiones automáticamente
- ✅ Manejo de errores robusto
- ✅ Logs detallados

---

## ⚡ Próximos Pasos

1. ✅ Configurar `OPENAI_API_KEY` en Supabase
2. ✅ Redesplegar Edge Function
3. ✅ Probar la función
4. 🚀 Generar embeddings para servicios existentes (Paso 5)

---

**¿Tienes una OpenAI API Key? Si no, puedes obtener una gratis en https://platform.openai.com/api-keys** 🎉

