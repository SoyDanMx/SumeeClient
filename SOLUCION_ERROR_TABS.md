# 🔧 Solución: Error "Cannot read property 'default' of undefined" en Tabs

## ❌ Error Reportado

```
ERROR  [TypeError: Cannot read property 'default' of undefined] 

Code: _layout.tsx
   8 |
   9 |     return (
> 10 |         <Tabs
     |         ^
  11 |             screenOptions={{
```

**Ubicación:** `app/(tabs)/_layout.tsx:10`

---

## 🔍 Causa del Problema

El error indica que el componente `Tabs` de `expo-router` no se está importando correctamente. Esto puede deberse a:

1. **Cache corrupto de Metro Bundler**
2. **Dependencias no instaladas correctamente**
3. **Incompatibilidad entre versiones de React y expo-router**
4. **Problema con node_modules**

---

## ✅ Solución Paso a Paso

### **Paso 1: Limpiar Cache Completamente**

```bash
cd ~/Documents/Sumee-Universe/SumeeClient

# Limpiar todos los caches
rm -rf node_modules/.cache
rm -rf .expo
rm -rf android/app/build
rm -rf ios/build

# Limpiar watchman (si está instalado)
watchman watch-del-all 2>/dev/null || true
```

### **Paso 2: Reinstalar Dependencias**

```bash
# Eliminar node_modules y package-lock.json
rm -rf node_modules package-lock.json

# Reinstalar con legacy-peer-deps
npm install --legacy-peer-deps
```

### **Paso 3: Verificar Versiones**

Asegúrate de que las versiones en `package.json` sean exactamente:

```json
{
  "expo": "~54.0.31",
  "expo-router": "^6.0.21",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-native": "0.81.5",
  "react-native-screens": "~4.16.0"
}
```

### **Paso 4: Reiniciar con Cache Limpio**

```bash
npx expo start --clear
```

---

## 🔄 Si el Error Persiste

### **Opción 1: Verificar Importación**

Asegúrate de que el archivo `app/(tabs)/_layout.tsx` tenga exactamente:

```typescript
import { Tabs } from 'expo-router';
```

**NO uses:**
- `import * as Router from 'expo-router'` y luego `Router.Tabs`
- `import Tabs from 'expo-router'`

### **Opción 2: Rebuild Nativo (Android/iOS)**

Si estás en Android:

```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

Si estás en iOS:

```bash
cd ios
pod deintegrate
pod install
cd ..
npx expo run:ios
```

### **Opción 3: Verificar Expo SDK**

```bash
npx expo install --fix
```

Esto alineará todas las dependencias con la versión correcta de Expo SDK 54.

---

## 🎯 Verificación

Después de aplicar la solución, deberías ver:

1. ✅ La app inicia sin errores
2. ✅ Las tabs se muestran correctamente
3. ✅ No hay errores en la consola sobre `Tabs`

---

## 📝 Notas Adicionales

- **React 19.1.0** es compatible con Expo SDK 54
- **expo-router ^6.0.21** es la versión correcta para SDK 54
- El error puede aparecer si hay múltiples versiones de React en `node_modules`

---

## 🚨 Si Nada Funciona

Como último recurso, puedes intentar:

```bash
# Limpieza completa
rm -rf node_modules package-lock.json .expo android/app/build ios/build

# Reinstalar desde cero
npm install --legacy-peer-deps

# Verificar instalación
npm list expo-router react-native-screens

# Iniciar con cache limpio
npx expo start --clear
```

Si el problema persiste, puede ser necesario crear un nuevo proyecto Expo y migrar el código.

