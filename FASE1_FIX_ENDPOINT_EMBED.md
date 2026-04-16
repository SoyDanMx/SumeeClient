# 🔧 Fix: Error "Model is not a classifier model"

## ⚠️ Error Detectado

```
HF Endpoint error: 424 - {"error":"Backend error: Model is not a classifier model"}
```

**Problema:** Estamos usando el endpoint `/predict` que es para **clasificación**, pero necesitamos el endpoint `/embed` para **embeddings**.

---

## ✅ Corrección Aplicada

He actualizado el código para usar el endpoint correcto:

- ❌ **Antes:** `${HF_ENDPOINT_URL}/predict` (clasificación)
- ✅ **Ahora:** `${HF_ENDPOINT_URL}/embed` (embeddings)

---

## 📋 Text Embeddings Inference (TEI) Endpoints

Los Inference Endpoints con TEI tienen diferentes endpoints según la tarea:

| Tarea | Endpoint | Uso |
|-------|----------|-----|
| **Embeddings** | `/embed` | Generar embeddings vectoriales |
| **Clasificación** | `/predict` | Clasificar texto |
| **Health Check** | `/health` | Verificar estado |

---

## 🚀 Redesplegar Edge Function

1. Ve a **Supabase Dashboard** > **Edge Functions** > **generate-embedding** > **Code**
2. **Borra TODO el código existente**
3. **Pega el código nuevo** (está en `Sumeeapp-B/supabase/functions/generate-embedding/index.ts`)
4. Haz clic en **"Deploy"**

---

## 🧪 Probar Nuevamente

1. Ve a la pestaña **"Test"**
2. **HTTP Method:** POST
3. **Request Body:**
```json
{
  "text": "Instalación de lámpara eléctrica",
  "type": "service"
}
```
4. Haz clic en **"Send Request"**

Deberías recibir:
```json
{
  "embedding": [0.123, -0.456, 0.789, ...], // 384 números
  "dimensions": 384,
  "text": "Instalación de lámpara eléctrica",
  "model": "all-MiniLM-L6-v2"
}
```

---

## 📊 Formato del Request para TEI

El endpoint `/embed` espera:

```json
{
  "inputs": "texto a procesar"
}
```

Y devuelve directamente el array de embeddings:
```json
[0.123, -0.456, 0.789, ...] // 384 números
```

---

**Redesplega y prueba nuevamente.** 🚀

