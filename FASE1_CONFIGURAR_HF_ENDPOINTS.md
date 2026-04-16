# 🔧 Configurar Hugging Face Inference Endpoints

## ⚠️ Problema Actual

Veo que tienes **"No Credits Available"** en tu cuenta de Hugging Face.

---

## 📋 Paso 1: Agregar Créditos

### **Opción A: Agregar Créditos Manualmente**

1. En la página de Inference Endpoints, haz clic en **"Add Credits"**
2. O ve directamente a: [Hugging Face Billing](https://huggingface.co/settings/billing)
3. Agrega créditos a tu cuenta
4. **Recomendación:** Habilita "automatic recharge" para uso ininterrumpido

### **Opción B: Ver Precios Primero**

1. Haz clic en **"See Pricing"** para ver los costos
2. Los Inference Endpoints tienen un tier gratuito limitado
3. Después de eso, se cobra por hora de uso

---

## 📋 Paso 2: Crear el Endpoint

Una vez que tengas créditos:

1. Haz clic en **"+ New"** (botón azul)
2. En el modal "Model Catalog", busca: **`sentence-transformers/all-MiniLM-L6-v2`**
3. Selecciona el modelo (ya lo veo en tu lista)
4. Configura el endpoint:
   - **Name:** `sumee-embeddings` (o el nombre que prefieras)
   - **Provider:** Elige el más económico (generalmente CPU es más barato)
   - **Instance Type:** Elige el más pequeño para empezar
5. Haz clic en **"Create"** o **"Deploy"**

---

## 📋 Paso 3: Obtener la URL del Endpoint

Una vez creado el endpoint:

1. Ve a la lista de endpoints
2. Haz clic en tu endpoint `sumee-embeddings`
3. Copia la **URL del endpoint** (algo como: `https://xxxxx.us-east-1.aws.endpoints.huggingface.cloud`)

---

## 📋 Paso 4: Actualizar la Edge Function

1. Ve a **Supabase Dashboard** > **Edge Functions** > **generate-embedding** > **Code**
2. Reemplaza las URLs de Hugging Face con la URL de tu Inference Endpoint
3. El formato del request puede ser diferente, pero generalmente es:
   ```json
   {
     "inputs": "texto a procesar"
   }
   ```

---

## 💰 Costo Estimado

- **Tier Gratuito:** Limitado (verifica en "See Pricing")
- **Después del tier gratuito:** ~$0.10-0.50 por hora de uso (depende del instance type)
- **Para embeddings:** Generalmente muy económico porque son rápidos

---

## ⚠️ Alternativa: Si No Quieres Pagar

Si no quieres agregar créditos, las opciones son:

1. **Esperar** a que Hugging Face arregle el router público
2. **Usar otro servicio** (OpenAI, Cohere, etc.)
3. **Pausar ML** temporalmente

---

## 🔗 Enlaces Útiles

- **Billing Settings:** https://huggingface.co/settings/billing
- **Inference Endpoints:** https://endpoints.huggingface.co
- **Pricing:** Haz clic en "See Pricing" en la página actual

---

**¿Tienes créditos ahora o prefieres otra opción?** 🤔

