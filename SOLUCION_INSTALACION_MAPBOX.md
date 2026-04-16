# 🔧 Solución: Instalación de @rnmapbox/maps

## ❌ Error Encontrado

Al intentar instalar `@rnmapbox/maps`, se presenta un conflicto de dependencias:

```
npm error ERESOLVE could not resolve
npm error Conflicting peer dependency: react@19.2.3
npm error Found: react@19.1.0
```

## ✅ Solución

### **Opción 1: Usar --legacy-peer-deps (Recomendado)**

Ejecuta en tu terminal:

```bash
cd ~/Documents/Sumee-Universe/SumeeClient
npm install @rnmapbox/maps --legacy-peer-deps
```

Este flag le dice a npm que ignore los conflictos de peer dependencies y use la resolución de dependencias antigua (más permisiva).

### **Opción 2: Usar --force**

Si la opción 1 no funciona:

```bash
npm install @rnmapbox/maps --force
```

⚠️ **Nota:** `--force` puede causar problemas más adelante, úsalo solo si `--legacy-peer-deps` no funciona.

### **Opción 3: Actualizar React (No recomendado para Expo)**

Si quieres resolver el conflicto actualizando React:

```bash
npm install react@19.2.3 react-dom@19.2.3 --legacy-peer-deps
npm install @rnmapbox/maps --legacy-peer-deps
```

⚠️ **Advertencia:** Esto puede romper la compatibilidad con Expo. Mejor usar la Opción 1.

---

## 📋 Después de la Instalación

### **1. Verificar Instalación:**

```bash
npm list @rnmapbox/maps
```

### **2. Para iOS (si es necesario):**

```bash
cd ios
pod install
cd ..
```

### **3. Reiniciar Metro Bundler:**

```bash
npx expo start --clear
```

---

## 🔍 ¿Por qué este error?

El error ocurre porque:
- Tu proyecto usa `react@19.1.0`
- `@rnmapbox/maps` (o alguna de sus dependencias) requiere `react@19.2.3`
- npm detecta este conflicto y no permite la instalación

`--legacy-peer-deps` le dice a npm que ignore estos conflictos y proceda con la instalación, lo cual generalmente funciona bien en proyectos Expo.

---

## ✅ Verificación Final

Después de instalar, verifica que todo esté correcto:

```bash
# Verificar que el paquete está instalado
npm list @rnmapbox/maps

# Verificar que no hay errores en package.json
cat package.json | grep @rnmapbox
```

---

## 📝 Nota sobre Mapbox

Si no necesitas Mapbox inmediatamente, puedes:
1. Dejar las variables de entorno configuradas en `.env`
2. Instalar `@rnmapbox/maps` cuando realmente lo necesites
3. Por ahora, el proyecto funcionará sin Mapbox (solo necesitarás las variables cuando implementes mapas)

---

**Última actualización:** Enero 2025

