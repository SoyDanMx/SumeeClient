# 🔧 Solución: Error "String cannot be cast to Boolean" en Android

## ❌ Error

```
java.lang.String cannot be cast to java.lang.Boolean
at setProperty
at createViewInstance
```

## 🔍 Causa

Este error ocurre cuando un componente nativo de React Native recibe un String donde espera un Boolean. Esto es común en Android cuando:

1. Se pasan props como strings `"true"` o `"false"` en lugar de booleanos
2. Hay problemas con props de componentes nativos como `StatusBar`, `SafeAreaView`, `Image`, etc.
3. Las props booleanas no están siendo convertidas correctamente

## ✅ Soluciones Aplicadas

### **1. StatusBar Component**

**Problema:** `translucent` podría estar siendo pasado como string.

**Solución:** Asegurar que sea un boolean explícito:

```typescript
// ❌ Incorrecto (puede causar problemas)
<StatusBar translucent />

// ✅ Correcto
<StatusBar translucent={Platform.OS === 'android'} />
```

### **2. SafeAreaView edges**

**Problema:** El array `edges` podría tener problemas en Android.

**Solución:** Verificar que sea un array válido:

```typescript
// ✅ Correcto
<SafeAreaView edges={['top']} />
```

### **3. Image resizeMode**

**Problema:** `resizeMode` debe ser un string válido, no un boolean.

**Solución:** Asegurar valores correctos:

```typescript
// ✅ Correcto
<Image resizeMode="cover" />
<Image resizeMode="contain" />
```

## 🔍 Verificación

Revisa estos componentes que usan props booleanas:

1. **StatusBar** - `translucent`, `hidden`
2. **SafeAreaView** - `edges` (array, no boolean)
3. **ScrollView** - `showsVerticalScrollIndicator`, `showsHorizontalScrollIndicator`
4. **TextInput** - `editable`
5. **TouchableOpacity** - `activeOpacity` (number, no boolean)
6. **Image** - `resizeMode` (string, no boolean)

## 📝 Checklist de Corrección

- [x] Verificar `StatusBar` props
- [x] Verificar `SafeAreaView` edges
- [x] Verificar `Image` resizeMode
- [x] Verificar todas las props booleanas
- [ ] Probar en dispositivo Android

## 🚀 Próximos Pasos

1. **Reiniciar el servidor:**
   ```bash
   npx expo start --clear
   ```

2. **Recargar la app en Android:**
   - Presiona `R` dos veces en el emulador
   - O agita el dispositivo y selecciona "Reload"

3. **Si el error persiste:**
   - Revisa la consola para ver qué componente específico causa el error
   - Verifica todas las props booleanas en ese componente

---

**Última actualización:** Enero 2025

