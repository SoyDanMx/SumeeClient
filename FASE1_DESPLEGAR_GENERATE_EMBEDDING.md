# 🚀 Desplegar Edge Function `generate-embedding`

## ⚠️ Importante

**NO cambies el nombre de "smooth-responder"**. Esa es otra función existente.

Necesitas **crear una NUEVA función** llamada `generate-embedding`.

---

## 📋 Pasos para Crear la Nueva Función

### **Opción 1: Desde Supabase Dashboard (Más Fácil)**

1. **Ve a Edge Functions**
   - En el menú lateral, haz clic en **"Edge Functions"**
   - Verás la lista de funciones (incluyendo "smooth-responder")

2. **Crear Nueva Función**
   - Haz clic en el botón **"Create a new function"** o **"New function"** (arriba a la derecha)
   - **Nombre de la función:** `generate-embedding`
   - Haz clic en **"Create"** o **"Deploy"**

3. **Copiar el Código**
   - Abre el archivo: `Sumeeapp-B/supabase/functions/generate-embedding/index.ts`
   - Copia **TODO** el contenido (Ctrl+A, Ctrl+C)

4. **Pegar en Supabase**
   - En el editor de Supabase, borra cualquier código por defecto
   - Pega el código completo (Ctrl+V)
   - Haz clic en **"Deploy"** o **"Save"**

5. **Verificar**
   - Deberías ver `generate-embedding` en la lista de funciones
   - Estado: **"Active"**

---

### **Opción 2: Desde Supabase CLI**

```bash
# 1. Navega al proyecto
cd /Users/danielnuno/Documents/Sumee-Universe/Sumeeapp-B

# 2. Asegúrate de estar logueado
supabase login

# 3. Link tu proyecto (si no está linkeado)
supabase link --project-ref TU_PROJECT_REF

# 4. Desplegar la función
supabase functions deploy generate-embedding
```

---

## 🔑 Configurar el Token de Hugging Face

**Después de crear la función**, configura el secret:

1. **Ve a Edge Functions > Secrets** (en el menú lateral)
2. Haz clic en **"Add new secret"**
3. **Name:** `HUGGINGFACE_API_KEY`
4. **Value:** tu token de Hugging Face (configúralo solo en Supabase Secrets)
5. Haz clic en **"Save"**

**⚠️ IMPORTANTE:** El secret es **global** para todas las Edge Functions, no necesitas configurarlo por función.

---

## ✅ Verificar que Funciona

1. **Ve a Edge Functions > generate-embedding**
2. Haz clic en la pestaña **"Test"** o **"Invoke"**
3. Usa este JSON:

```json
{
  "text": "Instalación de lámpara eléctrica",
  "type": "service"
}
```

4. Haz clic en **"Invoke function"**
5. Deberías recibir una respuesta con:
   - `embedding`: Array de 384 números
   - `dimensions`: 384
   - `text`: "Instalación de lámpara eléctrica"
   - `model`: "all-MiniLM-L6-v2"

---

## 📊 Resumen

- ✅ **NO cambies** "smooth-responder" (es otra función)
- ✅ **Crea NUEVA función** llamada `generate-embedding`
- ✅ **Copia el código** de `Sumeeapp-B/supabase/functions/generate-embedding/index.ts`
- ✅ **Configura el secret** `HUGGINGFACE_API_KEY` en Secrets
- ✅ **Prueba** la función desde el Dashboard

---

## 🐛 Si Ya Existe `generate-embedding`

Si ya existe una función con ese nombre:

1. Haz clic en **"generate-embedding"** en la lista
2. Ve a la pestaña **"Code"**
3. Reemplaza el código con el de `Sumeeapp-B/supabase/functions/generate-embedding/index.ts`
4. Haz clic en **"Deploy"**

---

**¿Necesitas ayuda con algún paso?** 🚀

