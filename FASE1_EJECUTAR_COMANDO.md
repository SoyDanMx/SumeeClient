# 🚀 Ejecutar Comando para Crear Endpoint

## ✅ Token Configurado

Configura tu token en la variable de entorno `HF_TOKEN` (no lo subas al repositorio).

---

## 📋 Paso 1: Ejecutar el Comando

### **Opción A: Desde Terminal (Recomendado)**

Copia y pega este comando completo en tu terminal:

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
  -H "Authorization: Bearer $HF_TOKEN"
```

### **Opción B: Usar el Script**

También puedes ejecutar el script que creé:

```bash
chmod +x FASE1_COMANDO_COMPLETO.sh
./FASE1_COMANDO_COMPLETO.sh
```

---

## ✅ Paso 2: Verificar la Respuesta

Si el comando es exitoso, recibirás una respuesta JSON como esta:

```json
{
  "name": "all-minilm-l6-v2-fpe",
  "status": "pending",
  "url": "https://xxxxx.us-east-1.aws.endpoints.huggingface.cloud",
  "accountId": "...",
  "createdAt": "...",
  ...
}
```

**⚠️ IMPORTANTE:** Guarda la **URL** del endpoint (campo `url`).

---

## ⏳ Paso 3: Esperar a que el Endpoint Esté Listo

El endpoint puede tardar **2-5 minutos** en estar listo. Puedes verificar el estado:

```bash
curl https://api.endpoints.huggingface.cloud/v2/endpoint/daninuno/all-minilm-l6-v2-fpe \
  -H "Authorization: Bearer $HF_TOKEN"
```

Cuando `status` sea `"running"`, está listo para usar.

---

## 🧪 Paso 4: Probar el Endpoint

Una vez que el endpoint esté `"running"`, puedes probarlo:

```bash
curl https://TU_URL_DEL_ENDPOINT/predict \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HF_TOKEN" \
  -d '{
    "inputs": "Instalación de lámpara eléctrica"
  }'
```

Deberías recibir un array de 384 números (el embedding).

---

## 🔧 Paso 5: Actualizar Edge Function

Una vez que tengas la URL del endpoint y confirmes que funciona, actualizamos la Edge Function para usarla.

**Comparte la URL del endpoint cuando la tengas** y actualizo el código. 🚀

---

## ⚠️ Posibles Errores

### **Error 401 (Unauthorized)**
- Verifica que el token sea correcto
- Asegúrate de que el token tenga permisos de escritura

### **Error 402 (Payment Required)**
- Necesitas agregar créditos a tu cuenta
- Ve a: https://huggingface.co/settings/billing

### **Error 400 (Bad Request)**
- Verifica que el JSON esté bien formateado
- Asegúrate de que el nombre del endpoint sea único

---

**¿Ejecutaste el comando? ¿Qué respuesta recibiste?** 🤔

