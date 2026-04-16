# 🔧 Solución: Error al Iniciar Expo

## 🐛 Problemas Comunes y Soluciones

### 1. Error de Importación

**Síntoma:** `Cannot find module` o `undefined is not a function`

**Solución:**
```bash
# Limpiar cache y reinstalar
rm -rf node_modules
rm -rf .expo
npm install
npx expo start --clear
```

---

### 2. Error de TypeScript/Sintaxis

**Síntoma:** Errores de compilación al iniciar

**Solución:**
- Verificar que todos los imports existen
- Verificar que no hay errores de sintaxis
- Verificar que los tipos están correctos

---

### 3. Error de Permisos (EPERM)

**Síntoma:** `EPERM: operation not permitted`

**Solución:**
```bash
# Limpiar permisos
sudo chown -R $(whoami) ~/.nvm
# O reinstalar node_modules
rm -rf node_modules
npm install
```

---

### 4. Error de Navegación

**Síntoma:** Error al navegar a `/professionals`

**Solución:**
- Verificar que `app/professionals/index.tsx` existe
- Verificar que la ruta está en `app/_layout.tsx`
- Verificar que `app/professionals/_layout.tsx` existe

---

## 🚀 Solución Rápida

### Paso 1: Limpiar Todo
```bash
cd ~/Documents/Sumee-Universe/SumeeClient
rm -rf node_modules
rm -rf .expo
rm -rf .expo-shared
```

### Paso 2: Reinstalar
```bash
npm install
```

### Paso 3: Iniciar con Cache Limpio
```bash
npx expo start --clear
```

---

## 🔍 Verificar Archivos

### Estructura Correcta:
```
app/
├── _layout.tsx (con ruta 'professionals')
└── professionals/
    ├── _layout.tsx
    └── index.tsx
```

### Verificar Ruta en _layout.tsx:
```typescript
<Stack.Screen name="professionals" options={{ headerShown: false }} />
```

---

## 💡 Si Nada Funciona

1. **Usar versión simplificada:**
   ```bash
   mv app/professionals/index.tsx app/professionals/index.tsx.backup
   mv app/professionals/index.SIMPLE.tsx app/professionals/index.tsx
   npx expo start --clear
   ```

2. **Verificar error específico:**
   - Abre la consola de Expo
   - Busca el error exacto (en rojo)
   - Comparte el mensaje completo

3. **Revisar logs:**
   ```bash
   npx expo start --clear 2>&1 | tee expo-error.log
   ```

---

## ✅ Checklist

- [ ] `app/professionals/index.tsx` existe
- [ ] `app/professionals/_layout.tsx` existe
- [ ] Ruta `professionals` está en `app/_layout.tsx`
- [ ] No hay errores de sintaxis
- [ ] Todos los imports son correctos
- [ ] Cache limpiado (`rm -rf .expo`)
- [ ] `node_modules` reinstalado

