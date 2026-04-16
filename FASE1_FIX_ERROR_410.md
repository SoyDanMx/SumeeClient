# 🔧 Fix: Error 410 de Hugging Face API

## 🐛 Problema

Error 410 (Gone) de Hugging Face API indica que:
- El modelo `all-MiniLM-L6-v2` no está disponible temporalmente
- El endpoint cambió
- El modelo necesita ser cargado primero

---

## ✅ Solución Implementada

### **1. Edge Function Actualizada**

La Edge Function ahora:
- ✅ Detecta error 410
- ✅ Intenta con modelo alternativo: `all-mpnet-base-v2`
- ✅ Reduce dimensiones de 768 → 384 (si es necesario)
- ✅ Maneja mejor los errores

### **2. Cambios Realizados**

**Archivo:** `Sumeeapp-B/supabase/functions/generate-embedding/index.ts`

```typescript
// Modelo alternativo agregado
const HF_API_URL_ALT = 'https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2';

// Manejo de error 410
if (response.status === 410) {
    console.log('[generate-embedding] Model unavailable (410), trying alternative model...');
    // Intenta con modelo alternativo
    // Reduce dimensiones de 768 → 384
}
```

---

## 🚀 Pasos para Aplicar el Fix

### **Paso 1: Redesplegar Edge Function**

1. Ve a **Supabase Dashboard** > **Edge Functions** > **generate-embedding**
2. Ve a la pestaña **"Code"**
3. Copia el código actualizado de `Sumeeapp-B/supabase/functions/generate-embedding/index.ts`
4. Pega en el editor de Supabase
5. Haz clic en **"Deploy"**

### **Paso 2: Probar la Función**

1. Ve a **Edge Functions** > **generate-embedding** > **Test**
2. Usa este JSON:
```json
{
  "text": "Instalación de lámpara eléctrica",
  "type": "service"
}
```
3. Debería funcionar (con modelo alternativo si el principal falla)

### **Paso 3: Generar Embeddings desde la App**

1. **Navegar a la pantalla de admin:**
   - En la app, navega a: `/admin/generate-embeddings`
   - O desde código: `router.push('/admin/generate-embeddings')`

2. **Presionar el botón:**
   - Haz clic en "Generar Embeddings"
   - Verás el progreso en tiempo real

3. **Ver resultados:**
   - Logs en tiempo real
   - Resumen final con estadísticas

---

## 🔍 Verificación

Después de generar embeddings, verifica en Supabase:

```sql
-- Ver cuántos embeddings se generaron
SELECT 
    COUNT(*) as total_embeddings,
    COUNT(DISTINCT discipline) as disciplines_covered
FROM service_embeddings;

-- Ver algunos ejemplos
SELECT 
    service_name,
    discipline,
    updated_at
FROM service_embeddings
ORDER BY updated_at DESC
LIMIT 10;
```

---

## 🐛 Si el Error Persiste

### **Opción 1: Verificar Token de Hugging Face**

1. Ve a **Edge Functions** > **Secrets**
2. Verifica que `HUGGINGFACE_API_KEY` existe y es válido
3. Si es necesario, actualiza el token

### **Opción 2: Usar Modelo Diferente**

Si ambos modelos fallan, puedes cambiar el modelo principal en la Edge Function:

```typescript
// Cambiar a otro modelo disponible
const HF_API_URL = 'https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2';
```

### **Opción 3: Esperar y Reintentar**

A veces Hugging Face tiene problemas temporales. Espera unos minutos y reintenta.

---

## 📊 Modelos Disponibles

- **all-MiniLM-L6-v2:** 384 dimensiones, rápido, ligero
- **all-mpnet-base-v2:** 768 dimensiones, más preciso, más lento
- **paraphrase-multilingual-MiniLM-L12-v2:** 384 dimensiones, multilingüe

---

## ✅ Estado

- [x] Edge Function actualizada con fallback
- [x] Pantalla de admin creada
- [x] Ruta agregada al layout
- [ ] Edge Function redesplegada (PENDIENTE)
- [ ] Embeddings generados (PENDIENTE)

---

**Próximo Paso:** Redesplegar la Edge Function y probar generar embeddings desde la app.

