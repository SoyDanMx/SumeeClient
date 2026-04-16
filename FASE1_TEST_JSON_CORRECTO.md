# 🧪 JSON Correcto para Probar generate-embedding

## ❌ Error Actual

El error dice:
```
Unexpected non-whitespace character after JSON at position 7
```

**Causa:** El JSON no está envuelto en llaves `{}`

---

## ✅ JSON Correcto

### **Opción 1: JSON Completo (Recomendado)**

En el campo **"Request Body"** de Supabase, usa:

```json
{
  "text": "Instalación de lámpara eléctrica",
  "type": "service"
}
```

### **Opción 2: Solo Texto**

Si solo quieres probar con texto:

```json
{
  "text": "Instalación de lámpara eléctrica"
}
```

---

## 📋 Ejemplos de Prueba

### **Ejemplo 1: Servicio de Electricidad**
```json
{
  "text": "Instalación de lámpara eléctrica",
  "type": "service"
}
```

### **Ejemplo 2: Servicio de Plomería**
```json
{
  "text": "Reparación de fuga de agua",
  "type": "service"
}
```

### **Ejemplo 3: Query de Usuario**
```json
{
  "text": "Tengo un corto circuito en mi casa",
  "type": "query"
}
```

---

## ✅ Respuesta Esperada

Si el JSON es correcto, deberías recibir:

```json
{
  "embedding": [0.123, -0.456, 0.789, ...], // 384 números
  "dimensions": 384,
  "text": "Instalación de lámpara eléctrica",
  "model": "all-MiniLM-L6-v2"
}
```

---

## 🔍 Verificación

1. **Copia el JSON completo** (con llaves `{}`)
2. **Pega en "Request Body"**
3. **Haz clic en "Send Request"**
4. **Deberías ver un embedding de 384 dimensiones**

---

**El problema es que falta `{` al inicio y `}` al final del JSON.** 🔧

