# 📸 Instrucciones: Integrar Logo Real como Imagen

## 📋 Pasos para Integrar tu Logo

### **Paso 1: Preparar la Imagen**

Necesitas el logo en formato PNG con fondo transparente:
- **Tamaño recomendado:** 240x240px (o más grande, se escalará automáticamente)
- **Formato:** PNG con transparencia
- **Color:** Blanco para usar en el welcome screen (fondo púrpura)

### **Paso 2: Colocar la Imagen**

Coloca tu imagen del logo en:
```
SumeeClient/
  └── assets/
      └── images/
          └── logo-white.png  ← Tu logo aquí
```

**Nota:** Si tienes versiones para diferentes fondos:
- `logo-white.png` - Para fondos oscuros (welcome screen)
- `logo-light.png` - Para fondos claros
- `logo-dark.png` - Para fondos oscuros alternativos

### **Paso 3: Activar el Uso de Imágenes**

Edita `components/onboarding/SumeeLogo.tsx`:

**Línea 103:** Cambia `false` a `true`:
```typescript
const USE_LOGO_IMAGES = true; // ✅ Cambiar a true
```

### **Paso 4: Verificar**

1. **Guarda el archivo** `SumeeLogo.tsx`
2. **Recarga la app** (presiona `r` en Metro Bundler)
3. **Navega al welcome** (usa el botón DEBUG o actualiza `onboarding_completed = false` en BD)
4. **Verifica** que el logo aparece correctamente

---

## 🔧 Si la Imagen No Aparece

### **Problema 1: Error de require()**

Si ves un error como `Cannot find module '@/assets/images/logo-white.png'`:

**Solución:**
1. Verifica que la imagen está en `assets/images/logo-white.png`
2. Verifica que el nombre del archivo es exacto (case-sensitive)
3. Reinicia Metro Bundler: `npx expo start --clear`

### **Problema 2: Imagen se ve pixelada**

**Solución:**
- Usa una imagen de mayor resolución (480x480px o más)
- El componente escalará automáticamente

### **Problema 3: Imagen no se carga**

**Solución:**
1. Verifica que `USE_LOGO_IMAGES = true`
2. Verifica que el archivo existe en la ruta correcta
3. Verifica que el formato es PNG (no JPG)
4. Limpia cache: `rm -rf .expo .expo-shared && npx expo start --clear`

---

## 📐 Especificaciones del Logo

Según la descripción del logo:
- **Icono:** Corazón púrpura con apretón de manos dentro
- **Texto:** "SuMee" (S y M mayúsculas)
- **Color del icono:** Púrpura #820AD1
- **Color del texto:** Gris oscuro (#1F2937) o blanco según fondo

### **Para Welcome Screen (fondo púrpura):**
- Usa `logo-white.png` con el logo en **blanco**
- O usa `logo-white.png` con el logo en **púrpura claro** (#A855F7)

---

## ✅ Checklist

- [ ] Imagen colocada en `assets/images/logo-white.png`
- [ ] `USE_LOGO_IMAGES = true` en `SumeeLogo.tsx`
- [ ] Archivo guardado
- [ ] App recargada
- [ ] Logo aparece correctamente en welcome screen

---

## 💡 Nota

El componente tiene un **fallback automático**: si la imagen no se encuentra, usará iconos de Ionicons (corazón + manos). Esto permite que la app funcione incluso sin la imagen del logo.

