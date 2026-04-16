# 🔧 Solución: "Failed to download remote update"

## 🐛 Error
```
Uncaught Error: java.io.IOException: Failed to download remote update
```

Este error ocurre cuando Expo intenta descargar una actualización remota y falla.

---

## ✅ Soluciones

### Solución 1: Deshabilitar Updates en Desarrollo (RECOMENDADO)

Este error es común en desarrollo. La solución más rápida es deshabilitar las actualizaciones remotas:

**1. Verificar `app.json` o `app.config.js`:**

```json
{
  "expo": {
    "updates": {
      "enabled": false
    }
  }
}
```

**2. O en `app.config.js` (si existe):**

```javascript
export default {
  expo: {
    updates: {
      enabled: false
    }
  }
};
```

---

### Solución 2: Limpiar Cache y Reinstalar

```bash
cd ~/Documents/Sumee-Universe/SumeeClient

# Limpiar todo
rm -rf .expo
rm -rf .expo-shared
rm -rf node_modules/.cache

# Si tienes Expo Updates instalado, reinstalar
npm uninstall expo-updates
npm install expo-updates

# Reiniciar
npx expo start --clear
```

---

### Solución 3: Usar Modo Local (Sin Updates)

Inicia Expo en modo local sin actualizaciones:

```bash
npx expo start --no-dev --minify
```

O simplemente:

```bash
npx expo start --clear --offline
```

---

### Solución 4: Verificar Configuración de Updates

Si necesitas updates, verifica la configuración:

**En `app.json`:**
```json
{
  "expo": {
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_ERROR_RECOVERY",
      "fallbackToCacheTimeout": 0
    }
  }
}
```

---

## 🚀 Solución Rápida (Recomendada)

```bash
cd ~/Documents/Sumee-Universe/SumeeClient

# 1. Limpiar cache
rm -rf .expo .expo-shared node_modules/.cache

# 2. Deshabilitar updates en desarrollo
# Edita app.json y agrega:
# "updates": { "enabled": false }

# 3. Reiniciar
npx expo start --clear
```

---

## 📋 Verificar app.json

Verifica que tu `app.json` tenga esta configuración:

```json
{
  "expo": {
    "name": "SumeeClient",
    "slug": "sumee-client",
    "version": "1.0.0",
    "updates": {
      "enabled": false
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

---

## 💡 Nota Importante

En **desarrollo local**, no necesitas actualizaciones remotas (OTA updates). Estas son útiles solo en producción.

**Para desarrollo:**
- `updates.enabled: false` ✅

**Para producción:**
- `updates.enabled: true` (solo si usas EAS Build)

---

## 🔍 Si el Error Persiste

1. **Verifica conexión a internet**
2. **Reinicia el servidor de Expo**
3. **Cierra y vuelve a abrir la app en el dispositivo**
4. **Usa `expo start --tunnel` si estás en red diferente**

