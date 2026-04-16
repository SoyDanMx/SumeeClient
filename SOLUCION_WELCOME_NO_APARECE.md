# 🔧 Solución: Welcome No Aparece

## 🐛 Problema

El welcome screen no aparece al iniciar la app.

---

## 🔍 Diagnóstico

El welcome aparece solo si:
1. El usuario está autenticado (`user` y `session` existen)
2. `onboarding_completed = false` en la base de datos
3. El perfil se carga correctamente

---

## ✅ Soluciones

### **Solución 1: Verificar Estado en Base de Datos**

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar tu estado de onboarding
SELECT 
    user_id,
    onboarding_completed,
    full_name,
    email
FROM profiles
WHERE user_id = auth.uid();
```

Si `onboarding_completed = true`, el welcome no aparecerá.

### **Solución 2: Forzar Mostrar Welcome (Temporal para Testing)**

**Opción A: Actualizar en Base de Datos**

```sql
-- En Supabase SQL Editor:
UPDATE profiles 
SET onboarding_completed = false 
WHERE user_id = auth.uid();
```

Luego:
1. Cierra completamente la app
2. Vuelve a abrirla
3. El welcome debería aparecer

**Opción B: Limpiar SecureStore**

Si usas SecureStore para guardar el estado:

```typescript
// En la consola de Metro o en un componente temporal:
import * as SecureStore from 'expo-secure-store';

// Limpiar:
await SecureStore.deleteItemAsync('sumee_client_welcome_shown');
```

### **Solución 3: Navegación Directa (Solo Testing)**

Modifica temporalmente `app/_layout.tsx` para forzar el welcome:

```typescript
// Agregar al inicio del RootLayout, antes del Stack:
useEffect(() => {
    // Forzar welcome (solo para testing)
    router.replace('/onboarding/welcome');
}, []);
```

**⚠️ IMPORTANTE:** Recuerda quitar esto después de probar.

### **Solución 4: Verificar Logs en Consola**

Revisa la consola de Metro Bundler para ver:

```
[Auth] User has not completed onboarding, redirecting to welcome
```

Si ves este log, el welcome debería aparecer. Si no lo ves, el problema es que:
- `onboarding_completed = true` en la base de datos
- O el perfil no se está cargando

---

## 🔧 Debugging Paso a Paso

### **Paso 1: Verificar Estado del Perfil**

Agrega logs temporales en `AuthContext.tsx`:

```typescript
console.log('[Auth] Profile state:', {
    hasProfile: !!profile,
    onboardingCompleted: profile?.onboarding_completed,
    userId: user?.id,
});
```

### **Paso 2: Verificar Routing**

Agrega logs en el welcome:

```typescript
useEffect(() => {
    console.log('[Welcome] Component mounted');
    console.log('[Welcome] User:', user?.id);
    console.log('[Welcome] Profile:', profile);
}, []);
```

### **Paso 3: Verificar que el Archivo Existe**

```bash
# Verificar que el archivo existe
ls -la app/onboarding/welcome.tsx
```

---

## 🚀 Solución Rápida (Recomendada)

### **Para Ver el Welcome Inmediatamente:**

1. **Actualizar Base de Datos:**
   ```sql
   UPDATE profiles 
   SET onboarding_completed = false 
   WHERE user_id = auth.uid();
   ```

2. **Cerrar y Reabrir la App:**
   - Cierra completamente la app
   - Vuelve a abrirla
   - El welcome debería aparecer

3. **Si Aún No Aparece:**
   - Limpia cache: `rm -rf .expo .expo-shared`
   - Reinicia Expo: `npx expo start --clear`
   - Revisa logs en consola

---

## 📋 Checklist de Verificación

- [ ] `onboarding_completed = false` en la base de datos
- [ ] El usuario está autenticado
- [ ] El perfil se carga correctamente
- [ ] No hay errores en la consola
- [ ] `app/onboarding/welcome.tsx` existe
- [ ] Cache de Expo está limpio

---

## 💡 Nota Importante

El welcome solo aparece si:
- El usuario está autenticado
- `onboarding_completed = false` o `null`

Si ya completaste el onboarding anteriormente, necesitas actualizar la base de datos para ver el welcome de nuevo.

