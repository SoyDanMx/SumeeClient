# 🔧 Limpieza Completa de Caché - Error review_count

## 🐛 Problema

El error `column profiles.review_count does not exist` sigue apareciendo aunque el código ya fue corregido.

**Causa probable:** Caché de Metro Bundler o código antiguo en memoria.

---

## ✅ Solución: Limpieza Completa

### **Paso 1: Detener Expo**
Presiona `Ctrl+C` en la terminal donde corre Expo.

### **Paso 2: Limpiar Todos los Cachés**

```bash
cd ~/Documents/Sumee-Universe/SumeeClient

# Limpiar caché de Expo
rm -rf .expo

# Limpiar caché de node_modules
rm -rf node_modules/.cache

# Limpiar caché de Metro
rm -rf $TMPDIR/metro-*

# Limpiar caché de Watchman (si está instalado)
watchman watch-del-all 2>/dev/null || true

# Limpiar caché de React Native
rm -rf $TMPDIR/react-*

# Limpiar caché de npm
npm cache clean --force
```

### **Paso 3: Reinstalar Dependencias (Opcional pero Recomendado)**

```bash
# Remover node_modules
rm -rf node_modules

# Reinstalar
npm install --legacy-peer-deps
```

### **Paso 4: Reiniciar Expo con Caché Limpio**

```bash
npx expo start --clear
```

---

## 🔍 Verificación

Después de reiniciar, los logs deberían mostrar:

```
[ProfessionalsService] Fetching featured professionals...
[ProfessionalsService] Attempt 1: role = "profesional"
[ProfessionalsService] ✅ Attempt 1 SUCCESS: Found X professionals
```

**NO deberías ver:**
- ❌ `column profiles.review_count does not exist`
- ❌ `Attempt X error: column profiles.review_count does not exist`

---

## 📋 Script de Limpieza Completa

Copia y pega este script completo:

```bash
#!/bin/bash
cd ~/Documents/Sumee-Universe/SumeeClient

echo "🧹 Limpiando cachés..."

# Detener procesos de Expo si están corriendo
pkill -f "expo" || true

# Limpiar cachés
rm -rf .expo
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true
watchman watch-del-all 2>/dev/null || true
npm cache clean --force

echo "✅ Cachés limpiados"
echo ""
echo "🚀 Reiniciando Expo..."
npx expo start --clear
```

---

## 💡 Si el Error Persiste

Si después de limpiar el caché el error sigue apareciendo:

1. **Verificar que el código está guardado:**
   ```bash
   grep -n "review_count" services/professionals.ts
   ```
   Solo debería aparecer en:
   - La interfaz (línea 15): `review_count?: number | null;`
   - Comentarios
   - Asignaciones con fallback: `(prof as any).review_count || 0`

2. **Verificar que NO está en SELECT:**
   ```bash
   grep -A 25 "const selectFields" services/professionals.ts | grep "review_count"
   ```
   **No debería encontrar nada.**

3. **Revisar si hay otros archivos usando review_count:**
   ```bash
   find . -name "*.ts" -o -name "*.tsx" | xargs grep "review_count" | grep -v node_modules
   ```

---

## 🎯 Estado Esperado

Después de la limpieza:
- ✅ `review_count` NO está en ningún SELECT
- ✅ `review_count` solo existe como campo opcional en la interfaz
- ✅ `review_count` usa `0` como fallback cuando no existe
- ✅ Los logs muestran qué intento funcionó
- ✅ Los profesionales aparecen en la app

---

**Nota:** Si el error persiste después de limpiar el caché, puede ser que haya otro archivo o función que esté usando `review_count` en un SELECT. Revisa todos los archivos relacionados con profesionales.

