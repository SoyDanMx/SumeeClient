# 💳 Agregar Método de Pago en Hugging Face

## ⚠️ Error Recibido

```
{"error":"Forbidden: Payment method required for namespace: daninuno"}
```

**Significado:** Necesitas agregar un método de pago o créditos a tu cuenta antes de crear endpoints.

---

## 📋 Paso 1: Ir a Configuración de Billing

1. Ve a: **https://huggingface.co/settings/billing**
2. O desde el menú: **Settings** → **Billing**

---

## 💳 Paso 2: Agregar Método de Pago

### **Opción A: Agregar Tarjeta de Crédito**

1. En la página de Billing, busca la sección **"Payment Method"**
2. Haz clic en **"Add Payment Method"** o **"Add Credit Card"**
3. Ingresa los datos de tu tarjeta:
   - Número de tarjeta
   - Fecha de expiración
   - CVV
   - Nombre en la tarjeta
   - Dirección de facturación
4. Haz clic en **"Save"** o **"Add"**

### **Opción B: Agregar Créditos Directamente**

1. En la página de Billing, busca la sección **"Credits"**
2. Haz clic en **"Add Credits"** o **"Buy Credits"**
3. Selecciona la cantidad de créditos que deseas agregar
4. Completa el pago

---

## ✅ Paso 3: Verificar que el Método de Pago Esté Activo

Una vez agregado, deberías ver:
- ✅ Tu método de pago listado
- ✅ Estado: "Active" o "Verified"
- ✅ Créditos disponibles (si agregaste créditos)

---

## 🚀 Paso 4: Intentar Crear el Endpoint Nuevamente

Una vez que tengas el método de pago configurado, ejecuta el comando curl nuevamente:

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

---

## 💰 Costo Estimado

Los Inference Endpoints de Hugging Face tienen:
- **Tier gratuito limitado** (verifica en la página de pricing)
- **Después del tier gratuito:** ~$0.10-0.50 por hora de uso
- **Para embeddings:** Generalmente muy económico porque son rápidos

**Recomendación:** Habilita "scale to zero" (ya está en el comando) para que el endpoint se apague automáticamente cuando no se use, ahorrando costos.

---

## 🔗 Enlaces Directos

- **Billing Settings:** https://huggingface.co/settings/billing
- **Pricing:** https://huggingface.co/pricing
- **Inference Endpoints:** https://endpoints.huggingface.co

---

## ⚠️ Alternativa: Si No Quieres Agregar Método de Pago

Si prefieres no agregar un método de pago en este momento, las opciones son:

1. **Esperar** a que Hugging Face arregle el router público (sin fecha estimada)
2. **Usar otro servicio** (OpenAI, Cohere, etc.)
3. **Pausar ML** temporalmente

---

**¿Agregaste el método de pago? Intenta crear el endpoint nuevamente.** 💳

