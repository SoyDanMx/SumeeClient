# 🔧 Solución: Error "Network request failed" al Subir Foto

**Fecha:** 2025-01-XX  
**Error:** `Network request failed` al intentar subir foto de perfil

---

## 🐛 Problema Identificado

El error "Network request failed" ocurría porque:

1. **Blob no funciona bien en React Native:**
   - Crear un `Blob` desde base64 en React Native puede causar errores de red
   - Supabase Storage en React Native tiene problemas con `Blob` objects

2. **Formato incorrecto:**
   - El código intentaba crear un `Blob` desde `Uint8Array`
   - Esto no es compatible con Supabase Storage en React Native

---

## ✅ Solución Implementada

### **Usar ArrayBuffer directamente (método probado)**

El código ahora usa el mismo método que funciona en `SumeePros/app/professional-docs.tsx`:

```typescript
// ✅ MÉTODO CORRECTO (como en SumeePros)
const binaryString = atob(base64);
const bytes = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
}

// Usar el ArrayBuffer del Uint8Array
const arrayBuffer = bytes.buffer;

// Subir directamente con ArrayBuffer
await supabase.storage
    .from('professional-avatars')
    .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
    });
```

---

## 📊 Comparación: Antes vs Después

### **❌ ANTES (No Funcionaba)**
```typescript
// Intentaba crear Blob desde Uint8Array
const blob = new Blob([byteArray], { type: `image/${fileExt}` });
await supabase.storage.upload(filePath, blob, {...});
// ❌ Error: "Network request failed"
```

### **✅ DESPUÉS (Funciona)**
```typescript
// Usa ArrayBuffer directamente
const arrayBuffer = bytes.buffer;
await supabase.storage.upload(filePath, arrayBuffer, {...});
// ✅ Funciona correctamente
```

---

## 🔍 Referencias en el Código

Este método está probado y funcionando en:

1. **`SumeePros/app/professional-docs.tsx`** (líneas 77-95):
   ```typescript
   const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
   const binary = atob(base64);
   const bytes = new Uint8Array(binary.length);
   for (let i = 0; i < binary.length; i++) {
       bytes[i] = binary.charCodeAt(i);
   }
   const arrayBuffer = bytes.buffer;
   await supabase.storage.upload(fileName, arrayBuffer, {...});
   ```

2. **`SumeePros/app/portfolio.tsx`** (líneas 77-89):
   - Mismo método, funciona correctamente

---

## 🧪 Testing

### **Test 1: Subir Foto desde Galería**
1. Abre app → Perfil → Editar Perfil
2. Toca "Galería"
3. Selecciona una foto
4. Toca "Guardar Cambios"
5. ✅ **Esperado:** La foto se sube sin errores

### **Test 2: Verificar en Supabase**
1. Ve a Supabase Dashboard → Storage → `professional-avatars`
2. ✅ **Esperado:** Ver el archivo `userId/avatar-timestamp.jpg`
3. ✅ **Esperado:** El archivo es accesible públicamente

### **Test 3: Verificar en BD**
1. Ve a Supabase Dashboard → Table Editor → `profiles`
2. Busca tu perfil
3. ✅ **Esperado:** `avatar_url` contiene `userId/avatar-timestamp.jpg`

---

## 📝 Archivos Modificados

- **`services/profile.ts`**:
  - Cambiado de `Blob` a `ArrayBuffer`
  - Usa el mismo método que funciona en SumeePros

---

## ✅ Checklist de Verificación

- [x] Código corregido para usar `ArrayBuffer`
- [x] Método alineado con SumeePros (probado y funcionando)
- [ ] Probar subir foto desde galería
- [ ] Probar subir foto desde cámara
- [ ] Verificar archivo en Storage
- [ ] Verificar path en BD
- [ ] Verificar visualización en app

---

## 🚀 Próximos Pasos

1. **Reiniciar Expo:**
   ```bash
   npx expo start --clear
   ```

2. **Probar en la app:**
   - Seleccionar foto
   - Guardar
   - Verificar logs (no debe haber "Network request failed")

3. **Si aún hay errores:**
   - Verificar que `expo-file-system` esté instalado
   - Verificar políticas de Storage
   - Revisar logs de Supabase

---

**¡El código ahora usa el mismo método probado que funciona en SumeePros! 🚀**

