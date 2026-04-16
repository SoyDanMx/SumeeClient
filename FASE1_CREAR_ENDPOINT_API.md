# 🚀 Crear Hugging Face Endpoint vía API

## 📋 Comando Proporcionado

Tienes el comando curl para crear el endpoint. Necesitas:

1. **Obtener tu token de Hugging Face**
2. **Reemplazar `XXXXX`** en el comando
3. **Ejecutar el comando**
4. **Obtener la URL del endpoint**
5. **Actualizar la Edge Function**

---

## 🔑 Paso 1: Obtener tu Token de Hugging Face

1. Ve a: https://huggingface.co/settings/tokens
2. Haz clic en **"New token"**
3. Dale un nombre (ej: "SumeeML")
4. Selecciona **"Read"** y **"Write"** permissions
5. Haz clic en **"Generate token"**
6. **⚠️ IMPORTANTE:** Copia el token inmediatamente (empieza con `hf_...`)
7. Guárdalo de forma segura

---

## 📝 Paso 2: Ejecutar el Comando

### **Opción A: Desde Terminal**

```bash
curl https://api.endpoints.huggingface.cloud/v2/endpoint/daninuno \
  -X POST \
  -d '{
    "cacheHttpResponses": false,
    "compute": {
      "accelerator": "cpu",
      "instanceSize": "x1",
      "instanceType": "intel-spr",
      "scaling": {
        "maxReplica": 1,
        "measure": {
          "hardwareUsage": 80
        },
        "metric": "hardwareUsage",
        "minReplica": 0,
        "scaleToZeroTimeout": 60
      }
    },
    "model": {
      "env": {},
      "framework": "pytorch",
      "image": {
        "tei": {
          "healthRoute": "/health",
          "maxBatchTokens": 16384,
          "maxConcurrentRequests": 512,
          "url": "ghcr.io/huggingface/text-embeddings-inference:cpu-1.8.3"
        }
      },
      "repository": "sentence-transformers/all-MiniLM-L6-v2",
      "secrets": {},
      "task": "sentence-embeddings",
      "fromCatalog": true
    },
    "name": "all-minilm-l6-v2-fpe",
    "provider": {
      "region": "us-east-1",
      "vendor": "aws"
    },
    "tags": [],
    "type": "private"
  }' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Reemplaza `TU_TOKEN_AQUI`** con tu token de Hugging Face (el que empieza con `hf_...`)

---

## ✅ Paso 3: Verificar la Creación

Si el comando es exitoso, recibirás una respuesta JSON con información del endpoint, incluyendo:

```json
{
  "name": "all-minilm-l6-v2-fpe",
  "status": "pending",
  "url": "https://xxxxx.us-east-1.aws.endpoints.huggingface.cloud",
  ...
}
```

**Guarda la URL** del endpoint.

---

## 📋 Paso 4: Esperar a que el Endpoint Esté Listo

El endpoint puede tardar 2-5 minutos en estar listo. Puedes verificar el estado:

```bash
curl https://api.endpoints.huggingface.cloud/v2/endpoint/daninuno/all-minilm-l6-v2-fpe \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

Cuando `status` sea `"running"`, está listo.

---

## 🔧 Paso 5: Actualizar la Edge Function

Una vez que tengas la URL del endpoint, actualizamos la Edge Function para usarla.

La URL será algo como:
```
https://xxxxx.us-east-1.aws.endpoints.huggingface.cloud
```

Y el formato del request será:
```json
{
  "inputs": "texto a procesar"
}
```

---

## 🧪 Paso 6: Probar el Endpoint

Puedes probar el endpoint directamente:

```bash
curl https://TU_URL_DEL_ENDPOINT/predict \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "inputs": "Instalación de lámpara eléctrica"
  }'
```

Deberías recibir un array de 384 números (el embedding).

---

## ⚠️ Nota Importante

Asegúrate de tener **créditos** en tu cuenta de Hugging Face antes de ejecutar el comando, o el endpoint no se creará.

---

**¿Tienes tu token listo?** 🔑

