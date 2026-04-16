# 🔧 Solución Completa: Error react-native-url-polyfill

## ❌ Error

```
Unable to resolve "react-native-url-polyfill/auto" from "lib/supabase.ts"
```

## ✅ Solución Paso a Paso

### **Paso 1: Verificar Instalación**

```bash
cd ~/Documents/Sumee-Universe/SumeeClient
npm list react-native-url-polyfill
```

Si no aparece, instalar:
```bash
npm install react-native-url-polyfill --legacy-peer-deps
```

### **Paso 2: Limpiar TODO**

```bash
# Detener Expo completamente (Ctrl+C en la terminal donde corre)

# Limpiar todas las cachés
rm -rf .expo
rm -rf node_modules/.cache
rm -rf .metro
npm cache clean --force

# Si el problema persiste, reinstalar dependencias
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### **Paso 3: Reiniciar Metro con Caché Limpia**

```bash
npx expo start --clear
```

**IMPORTANTE:** El flag `--clear` es **CRÍTICO**. Sin él, Metro seguirá usando la caché vieja.

### **Paso 4: Si Aún No Funciona**

1. **Cerrar completamente Expo:**
   - Presiona `Ctrl+C` en la terminal
   - Cierra todas las ventanas de Expo
   - Cierra el emulador/simulador

2. **Matar procesos de Metro:**
   ```bash
   # En macOS/Linux
   lsof -ti:8081 | xargs kill -9
   lsof -ti:8082 | xargs kill -9
   ```

3. **Reiniciar desde cero:**
   ```bash
   ./restart-clean.sh
   ```

## 🔍 Verificación

Después de reiniciar, verifica en la consola de Expo que no aparezca el error. Si ves:

```
✅ Metro bundler is running
```

Y en el dispositivo/emulador la app carga correctamente, el problema está resuelto.

## 📋 Checklist

- [ ] `react-native-url-polyfill` está en `package.json`
- [ ] `react-native-url-polyfill` está en `node_modules/`
- [ ] Caché de Metro limpiada (`.expo`, `node_modules/.cache`, `.metro`)
- [ ] Expo reiniciado con `--clear`
- [ ] App carga sin errores

## 🚨 Si Nada Funciona

Como último recurso, verifica que el archivo existe:

```bash
ls -la node_modules/react-native-url-polyfill/auto.js
```

Si el archivo existe pero Metro no lo encuentra, puede ser un problema de permisos o de la configuración de Metro. En ese caso:

1. Verifica que `metro.config.js` existe (ya lo creamos)
2. Intenta reinstalar el paquete específicamente:
   ```bash
   npm uninstall react-native-url-polyfill
   npm install react-native-url-polyfill@^3.0.0 --legacy-peer-deps
   ```
3. Reinicia tu computadora (a veces ayuda con problemas de caché del sistema)

## 📝 Notas

- El paquete `react-native-url-polyfill` es **requerido** para que Supabase funcione en React Native
- El import `import 'react-native-url-polyfill/auto'` debe estar **ANTES** de cualquier otro import de Supabase
- Metro Bundler a veces cachea módulos de forma agresiva, por eso es importante usar `--clear`

