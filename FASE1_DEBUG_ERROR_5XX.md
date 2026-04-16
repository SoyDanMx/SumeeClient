# 🐛 Debug: Error 5xx en generate-embedding

## 📊 Estado Actual

Según el dashboard de Supabase:

- ✅ **Función activa:** `generate-embedding`
- ✅ **Invocaciones:** 2 en últimos 15 minutos
- ⚠️ **Error detectado:** 1 error 5xx (barra roja)
- ✅ **Tiempo promedio:** 41.40ms
- ⚠️ **Tiempo máximo:** 1,101ms (puede indicar timeout o problema)

---

## 🔍 Pasos para Depurar

### **1. Revisar Logs de la Función**

1. Ve a **Edge Functions** > **generate-embedding** > **Logs**
2. Busca entradas con nivel **"error"** (rojo)
3. Revisa los mensajes de error más recientes

**Busca específicamente:**
- `[generate-embedding] Error:`
- `HF API error:`
- `Invalid embedding format`
- Timeout errors

---

## 🐛 Errores Comunes y Soluciones

### **Error 503: Service Unavailable (Hugging Face)**

**Síntoma:**
- Error 5xx en Supabase
- Mensaje: "Model is loading" o "503"

**Causa:**
- El modelo de Hugging Face está "durmiendo" (cold start)
- Primera invocación después de inactividad

**Solución:**
- ✅ La función ya tiene lógica de retry (espera 5 segundos y reintenta)
- ⏳ Espera unos segundos y vuelve a probar
- ✅ Debería funcionar en el segundo intento

---

### **Error 401: Unauthorized (Hugging Face)**

**Síntoma:**
- Error 5xx en Supabase
- Mensaje: "401" o "Unauthorized"

**Causa:**
- El token `HUGGINGFACE_API_KEY` es incorrecto o inválido

**Solución:**
1. Verifica que el secret esté configurado correctamente
2. Ve a **Edge Functions** > **Secrets**
3. Confirma que `HUGGINGFACE_API_KEY` existe
4. Si es necesario, actualiza el valor con el token correcto

---

### **Error: Invalid Embedding Format**

**Síntoma:**
- Error 5xx en Supabase
- Mensaje: "Invalid embedding format from Hugging Face API"

**Causa:**
- Hugging Face devolvió un formato inesperado

**Solución:**
- La función ya maneja múltiples formatos
- Si persiste, puede ser un cambio en la API de Hugging Face
- Revisa los logs para ver el formato exacto recibido

---

### **Error: Timeout**

**Síntoma:**
- Tiempo de ejecución muy alto (>1000ms)
- Error 5xx

**Causa:**
- El modelo de Hugging Face tardó mucho en responder

**Solución:**
- Normal en la primera invocación (cold start)
- Las siguientes invocaciones deberían ser más rápidas
- Si persiste, considera usar un modelo más rápido o aumentar el timeout

---

## 🧪 Probar Nuevamente

### **Opción 1: Desde el Dashboard**

1. Ve a **Edge Functions** > **generate-embedding**
2. Haz clic en el botón **"Test"** (arriba a la derecha)
3. Usa este JSON:
```json
{
  "text": "Instalación de lámpara eléctrica",
  "type": "service"
}
```
4. Haz clic en **"Invoke function"**
5. Observa la respuesta

### **Opción 2: Revisar Logs Primero**

1. Ve a la pestaña **"Logs"**
2. Busca el error más reciente
3. Copia el mensaje de error
4. Compártelo para análisis más detallado

---

## ✅ Si el Error Persiste

Si después de revisar los logs y probar nuevamente el error continúa:

1. **Comparte el mensaje de error exacto** de los logs
2. **Verifica el token de Hugging Face:**
   - ¿Es válido?
   - ¿Tiene permisos READ?
   - ¿Está correctamente configurado en Secrets?

3. **Prueba el token directamente:**
```bash
curl -X POST 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2' \
  -H 'Authorization: Bearer [TU_HUGGINGFACE_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{"inputs": "test"}'
```

---

## 📊 Interpretación de las Métricas

- **Tiempo promedio (41.40ms):** ✅ Excelente (muy rápido)
- **Tiempo máximo (1,101ms):** ⚠️ Alto, probablemente fue el error
- **2 invocaciones:** ✅ La función está siendo llamada
- **1 error 5xx:** ⚠️ Necesita investigación

**Conclusión:** La función funciona, pero hubo un error en una de las invocaciones. Probablemente fue un cold start del modelo de Hugging Face.

---

**¿Puedes revisar los logs y compartir el mensaje de error exacto?** 🔍

