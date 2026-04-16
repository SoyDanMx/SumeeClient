# 🚀 Instrucciones para Redesplegar generate-embedding

## ✅ Paso 1: Abrir el Código

El código está en:
```
Sumeeapp-B/supabase/functions/generate-embedding/index.ts
```

**O puedes copiarlo directamente desde aquí:**

---

## 📋 Paso 2: Copiar TODO el Código

**IMPORTANTE:** Copia TODO el código desde la línea 1 hasta el final (línea 232).

---

## 🔧 Paso 3: Ir a Supabase Dashboard

1. Ve a **Supabase Dashboard**
2. Selecciona tu proyecto
3. Ve a **Edge Functions** (menú lateral izquierdo)
4. Haz clic en **`generate-embedding`**
5. Haz clic en la pestaña **"Code"** o **"Editor"**

---

## 📝 Paso 4: Pegar y Deploy

1. **Borra TODO el código existente** en el editor
2. **Pega el código nuevo** (el que copiaste)
3. Haz clic en **"Deploy"** o **"Save"**
4. Espera a que termine el despliegue (puede tardar 30-60 segundos)

---

## 🧪 Paso 5: Probar

1. Ve a la pestaña **"Test"** o **"Invoke"**
2. Usa este JSON:

```json
{
  "text": "Instalación de lámpara eléctrica",
  "type": "service"
}
```

3. Haz clic en **"Send Request"**
4. Deberías recibir un embedding de 384 dimensiones

---

## ⚠️ Si Aún Hay Errores

Si después de redesplegar el error 404 persiste, el nuevo router de Hugging Face puede requerir un formato completamente diferente.

**Opción:** Cambiar a **OpenAI Embeddings** (más confiable).

---

**¿Necesitas ayuda con algún paso?** 🤔

