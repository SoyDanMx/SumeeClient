# 📦 Instrucciones: Instalar Dependencias Faltantes

## 🔴 Error Actual

```
CommandError: "expo-image-picker" is added as a dependency in your project's package.json but it doesn't seem to be installed.
```

## ✅ Solución

### Paso 1: Instalar todas las dependencias

Ejecuta en la terminal (desde la carpeta `SumeeClient`):

```bash
npm install --legacy-peer-deps
```

O si solo quieres instalar los paquetes faltantes:

```bash
npm install expo-image-picker expo-location --legacy-peer-deps
```

### Paso 2: Limpiar cache

```bash
rm -rf node_modules/.cache .expo
```

### Paso 3: Reiniciar Expo

```bash
npx expo start --clear
```

## 📋 Dependencias que necesitan instalación

- ✅ `expo-image-picker` - Para seleccionar fotos de perfil
- ✅ `expo-location` - Para obtener ubicación GPS

## ⚠️ Notas

- Los warnings de `RNMapboxMapsDownloadToken` son solo advertencias y no afectan la funcionalidad
- El flag `--legacy-peer-deps` es necesario debido a conflictos de versiones de React
- Si tienes problemas, también puedes ejecutar: `npm install --force`

## 🔍 Verificar instalación

Después de instalar, verifica que los paquetes estén instalados:

```bash
ls node_modules | grep expo-image-picker
ls node_modules | grep expo-location
```

Si aparecen, la instalación fue exitosa.

