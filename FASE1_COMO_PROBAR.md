# 🧪 Cómo Probar la Edge Function generate-embedding

## 📋 Configuración en Supabase Dashboard

### **HTTP Method:**
- ✅ **POST** (para enviar el texto a procesar)
- ✅ **OPTIONS** (automático para CORS, no necesitas configurarlo)

---

## 🧪 Paso 1: Ir a la Pestaña "Test"

1. Ve a **Supabase Dashboard**
2. **Edge Functions** > **generate-embedding**
3. Haz clic en la pestaña **"Test"** o **"Invoke"**

---

## 📝 Paso 2: Configurar el Request

### **HTTP Method:**
```
POST
```

### **Request Body (JSON):**
```json
{
  "text": "Instalación de lámpara eléctrica",
  "type": "service"
}
```

**O más simple:**
```json
{
  "text": "Instalación de lámpara eléctrica"
}
```

---

## 🚀 Paso 3: Enviar Request

1. Haz clic en **"Send Request"** o **"Invoke"**
2. Espera la respuesta (puede tardar unos segundos)

---

## ✅ Respuesta Esperada (Éxito)

```json
{
  "embedding": [0.123, -0.456, 0.789, ...], // 384 números
  "dimensions": 384,
  "text": "Instalación de lámpara eléctrica",
  "model": "all-MiniLM-L6-v2"
}
```

---

## ❌ Respuesta de Error

Si todos los endpoints fallan:

```json
{
  "error": "All embedding endpoints failed",
  "details": "..."
}
```

---

## 📊 Revisar Logs

1. Ve a la pestaña **"Logs"** en Supabase Dashboard
2. Busca mensajes como:
   - `[generate-embedding] Trying Inference API (pipeline)...`
   - `[generate-embedding] ✅ Success with Inference API (pipeline)`
   - O `[generate-embedding] Inference API (pipeline) failed: 404`

---

## 🔍 Ejemplo Completo

### **Request:**
```
Method: POST
URL: (automático, es la Edge Function)
Headers: (automático, incluye Authorization)
Body:
{
  "text": "Tengo un problema con mi instalación eléctrica",
  "type": "query"
}
```

### **Response (Éxito):**
```json
{
  "embedding": [0.123, -0.456, 0.789, ...],
  "dimensions": 384,
  "text": "Tengo un problema con mi instalación eléctrica",
  "model": "all-MiniLM-L6-v2"
}
```

---

## ⚠️ Notas Importantes

1. **El método debe ser POST** - No uses GET
2. **El body debe ser JSON válido** - Con llaves `{}`
3. **El campo `text` es obligatorio** - No puede estar vacío
4. **El campo `type` es opcional** - Puedes omitirlo

---

**¿Funcionó correctamente?** 🚀

