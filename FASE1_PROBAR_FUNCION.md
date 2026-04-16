# 🧪 Probar Edge Function `generate-embedding`

## ✅ Estado Actual

- [x] Edge Function `generate-embedding` creada
- [x] Secret `HUGGINGFACE_API_KEY` configurado
- [ ] ⏳ Prueba de la función

---

## 🧪 Opción 1: Probar desde Supabase Dashboard (Más Fácil)

### **Pasos:**

1. **Ve a Supabase Dashboard**
   - Navega a **Edge Functions** > **generate-embedding**

2. **Haz clic en la pestaña "Test" o "Invoke"**

3. **Pega este JSON en el body:**
```json
{
  "text": "Instalación de lámpara eléctrica",
  "type": "service"
}
```

4. **Haz clic en "Invoke function" o "Run"**

5. **Verifica la respuesta:**
   - Deberías ver un objeto JSON con:
     - `embedding`: Array de 384 números
     - `dimensions`: 384
     - `text`: "Instalación de lámpara eléctrica"
     - `model`: "all-MiniLM-L6-v2"

---

## 🧪 Opción 2: Probar desde Terminal (cURL)

```bash
curl -X POST 'https://[TU_PROJECT_ID].supabase.co/functions/v1/generate-embedding' \
  -H 'Authorization: Bearer [TU_SUPABASE_ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Instalación de lámpara eléctrica",
    "type": "service"
  }'
```

**Reemplaza:**
- `[TU_PROJECT_ID]`: Tu project ID de Supabase (ej: `tu-project-ref`)
- `[TU_SUPABASE_ANON_KEY]`: Tu anon key de Supabase

---

## ✅ Respuesta Esperada

```json
{
  "embedding": [0.123, -0.456, 0.789, ...], // 384 números
  "dimensions": 384,
  "text": "Instalación de lámpara eléctrica",
  "model": "all-MiniLM-L6-v2"
}
```

---

## 🐛 Errores Comunes

### **Error 503: Service Unavailable**
- **Causa:** El modelo de Hugging Face está cargando
- **Solución:** La función debería reintentar automáticamente después de 5 segundos
- **Si persiste:** Espera unos minutos y vuelve a intentar

### **Error 401: Unauthorized**
- **Causa:** El `SUPABASE_ANON_KEY` es incorrecto
- **Solución:** Verifica que estés usando el anon key correcto

### **Error 500: Internal Server Error**
- **Causa:** Problema con el secret `HUGGINGFACE_API_KEY`
- **Solución:** 
  1. Verifica que el secret esté configurado correctamente
  2. Revisa los logs de la función en Supabase Dashboard

---

## 📊 Ver Logs

Si hay errores, revisa los logs:

1. Ve a **Edge Functions** > **generate-embedding** > **Logs**
2. Busca mensajes que empiecen con `[generate-embedding]`
3. Los logs mostrarán:
   - ✅ `Generating embedding for: ...`
   - ✅ `✅ Embedding generated: 384 dimensions`
   - ❌ `HF API error: ...` (si hay errores)

---

## ✅ Si la Prueba es Exitosa

Una vez que confirmes que la función funciona:

1. ✅ **Paso 3 completado**
2. 🚀 **Continúa con Paso 5:** Generar embeddings para servicios existentes

---

**¿La función funciona correctamente?** 🚀

