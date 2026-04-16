# 📦 Instrucciones: Instalar react-native-webview

## 🎯 Objetivo

Instalar `react-native-webview` para habilitar la funcionalidad completa del marketplace dentro de la app.

## 📋 Pasos

### **1. Instalar Dependencia**

```bash
cd /Users/danielnuno/Documents/Sumee-Universe/SumeeClient
npm install react-native-webview --legacy-peer-deps
```

### **2. Para iOS (si es necesario)**

```bash
cd ios
pod install
cd ..
```

### **3. Reiniciar Expo**

```bash
# Detener Expo si está corriendo (Ctrl+C)
npx expo start --clear
```

## ✅ Verificación

Una vez instalado, el marketplace funcionará con WebView nativo dentro de la app.

**Nota:** Si no se instala, la app usará un fallback que abre el marketplace en el navegador externo.

## 🔧 Alternativa: Usar Fallback

Si no puedes instalar `react-native-webview`, la app ya está configurada para:
- Mostrar un botón que abre el marketplace en el navegador
- Funcionalidad básica de deep linking
- Navegación correcta

---

**Fecha:** Enero 2026

