# 🔧 Solución: react-native-webview No Instalado

## 🐛 Error

```
CommandError: "react-native-webview" is added as a dependency in your project's package.json but it doesn't seem to be installed.
```

## ✅ Solución

### **Paso 1: Instalar react-native-webview**

Ejecuta este comando en tu terminal:

```bash
cd /Users/danielnuno/Documents/Sumee-Universe/SumeeClient
npm install react-native-webview --legacy-peer-deps
```

### **Paso 2: Si hay Error de Permisos (EPERM)**

Si ves un error de permisos, intenta:

**Opción A: Usar npx directamente**
```bash
npx npm install react-native-webview --legacy-peer-deps
```

**Opción B: Verificar permisos de node_modules**
```bash
# Verificar permisos
ls -la node_modules | head -5

# Si es necesario, corregir permisos
sudo chown -R $(whoami) node_modules
npm install react-native-webview --legacy-peer-deps
```

**Opción C: Reinstalar node_modules**
```bash
rm -rf node_modules
npm install --legacy-peer-deps
```

### **Paso 3: Reiniciar Expo**

Después de instalar, reinicia Expo:

```bash
npx expo start --clear
```

---

## 🔍 Verificación

Para verificar que `react-native-webview` está instalado:

```bash
npm list react-native-webview
```

Deberías ver algo como:
```
react-native-webview@13.6.0
```

---

## 📋 Nota

`react-native-webview` es necesario para la funcionalidad del marketplace que se integra en la app. Esta dependencia fue agregada al `package.json` pero necesita ser instalada manualmente.

---

## 🚀 Comando Completo

Si todo está bien, ejecuta:

```bash
cd /Users/danielnuno/Documents/Sumee-Universe/SumeeClient && \
npm install react-native-webview --legacy-peer-deps && \
npx expo start --clear
```

