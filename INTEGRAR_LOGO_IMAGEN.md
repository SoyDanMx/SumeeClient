# 📸 Integrar Logo Real como Imagen

## 📍 Ubicación del Archivo

Coloca tu imagen del logo en esta ruta exacta:

```
SumeeClient/
  └── assets/
      └── images/
          └── logo-white.png  ← Tu logo aquí
```

**Ruta completa:**
```
/Users/danielnuno/Documents/Sumee-Universe/SumeeClient/assets/images/logo-white.png
```

---

## 📋 Especificaciones de la Imagen

Según el logo que compartiste:
- **Formato:** PNG con fondo transparente (recomendado)
- **Tamaño:** Mínimo 240x240px (o más grande, se escalará automáticamente)
- **Color:** Blanco (#FFFFFF) para el welcome screen (fondo púrpura)
- **Contenido:** Corazón formado por apretón de manos + texto "SuMee"

---

## 🔧 Pasos para Activar el Logo

### **Paso 1: Colocar la Imagen**

1. Copia tu imagen del logo
2. Colócala en: `assets/images/logo-white.png`
3. Verifica que el nombre del archivo sea exacto: `logo-white.png` (case-sensitive)

### **Paso 2: Activar en el Código**

Edita `components/onboarding/SumeeLogo.tsx`:

**Línea 103:** Cambia `false` a `true`:
```typescript
const USE_LOGO_IMAGES = true; // ✅ Cambiar a true
```

**Líneas 110-118:** Descomenta estas líneas:
```typescript
if (USE_LOGO_IMAGES) {
    if (variant === 'white') {
        logoSource = require('@/assets/images/logo-white.png');
        useImage = true;
    } else if (variant === 'light') {
        logoSource = require('@/assets/images/logo-light.png');
        useImage = true;
    } else if (variant === 'dark') {
        logoSource = require('@/assets/images/logo-dark.png');
        useImage = true;
    }
}
```

### **Paso 3: Verificar**

1. **Guarda** el archivo `SumeeLogo.tsx`
2. **Recarga** la app (presiona `r` en Metro Bundler)
3. **Navega al welcome** (usa el botón DEBUG o actualiza BD)
4. **Verifica** que el logo aparece correctamente

---

## 🚨 Solución de Problemas

### **Error: "Unable to resolve logo-white.png"**

**Causa:** El archivo no existe o está en la ruta incorrecta

**Solución:**
1. Verifica que el archivo está en `assets/images/logo-white.png`
2. Verifica que el nombre es exacto (case-sensitive)
3. Reinicia Metro Bundler: `npx expo start --clear`

### **Error: "Cannot find module"**

**Causa:** El `require()` está activo pero el archivo no existe

**Solución:**
1. Asegúrate de que `USE_LOGO_IMAGES = true` solo cuando el archivo existe
2. O coloca el archivo primero, luego activa `USE_LOGO_IMAGES`

### **Logo se ve pixelado**

**Solución:**
- Usa una imagen de mayor resolución (480x480px o más)
- El componente escalará automáticamente

---

## ✅ Checklist

- [ ] Imagen colocada en `assets/images/logo-white.png`
- [ ] Nombre del archivo es exacto: `logo-white.png`
- [ ] `USE_LOGO_IMAGES = true` en `SumeeLogo.tsx`
- [ ] Líneas 110-118 descomentadas
- [ ] Archivo guardado
- [ ] App recargada
- [ ] Logo aparece correctamente

---

## 💡 Nota Importante

El componente tiene un **fallback automático**: si la imagen no se encuentra, usará iconos de Ionicons (corazón + manos). Esto permite que la app funcione incluso sin la imagen del logo.

