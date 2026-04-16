# 🐛 Debug: Welcome No Aparece

## 🔍 Pasos para Diagnosticar

### **1. Verificar Logs en Consola**

Abre la consola de Metro Bundler y busca estos logs:

```
[Auth] Navigation check: { ... }
[Auth] ✅ User has not completed onboarding, redirecting to welcome
```

**Si NO ves estos logs:**
- El perfil no se está cargando
- O `isLoading` está en `true` indefinidamente

**Si ves los logs pero no aparece el welcome:**
- Problema de routing
- El archivo `app/onboarding/welcome.tsx` tiene un error

---

### **2. Verificar Estado del Perfil**

Agrega este código temporal en `app/(tabs)/index.tsx` o cualquier pantalla visible:

```typescript
import { useAuth } from '@/contexts/AuthContext';

// Dentro del componente:
const { profile, user, isLoading } = useAuth();

useEffect(() => {
    console.log('[DEBUG] Profile state:', {
        hasUser: !!user,
        hasProfile: !!profile,
        onboardingCompleted: profile?.onboarding_completed,
        isLoading,
    });
}, [profile, user, isLoading]);
```

---

### **3. Forzar Navegación Directa (Testing)**

Modifica temporalmente `app/_layout.tsx`:

```typescript
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function RootLayout() {
    const router = useRouter();
    
    useEffect(() => {
        // FORZAR WELCOME (solo para testing)
        setTimeout(() => {
            router.replace('/onboarding/welcome');
        }, 1000);
    }, []);
    
    // ... resto del código
}
```

**⚠️ IMPORTANTE:** Quita esto después de probar.

---

### **4. Verificar que el Archivo Existe**

```bash
# Verificar estructura de archivos
ls -la app/onboarding/
```

Deberías ver:
- `_layout.tsx`
- `welcome.tsx`

---

### **5. Verificar Base de Datos**

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar estado actual
SELECT 
    user_id,
    full_name,
    email,
    onboarding_completed,
    created_at
FROM profiles
WHERE user_id = auth.uid();

-- Si onboarding_completed es NULL, actualizar a false
UPDATE profiles 
SET onboarding_completed = COALESCE(onboarding_completed, false)
WHERE user_id = auth.uid() 
  AND onboarding_completed IS NULL;
```

---

### **6. Recargar Perfil Manualmente**

Después de actualizar en la BD, fuerza una recarga:

**Opción A: Cerrar y reabrir la app completamente**

**Opción B: Agregar botón temporal para recargar perfil**

En cualquier pantalla visible, agrega:

```typescript
import { useAuth } from '@/contexts/AuthContext';

const { reloadProfile } = useAuth();

// Botón temporal
<TouchableOpacity onPress={reloadProfile}>
    <Text>Recargar Perfil</Text>
</TouchableOpacity>
```

---

## 🚨 Problemas Comunes

### **Problema 1: Perfil es `null`**

**Síntoma:** `profile` es `null` en los logs

**Solución:**
- Verifica que el perfil existe en la BD
- Verifica RLS policies
- Verifica que `loadUserProfile` se ejecuta correctamente

### **Problema 2: `onboarding_completed` es `NULL` en BD**

**Síntoma:** `profile?.onboarding_completed` es `undefined`

**Solución:**
```sql
UPDATE profiles 
SET onboarding_completed = false
WHERE onboarding_completed IS NULL;
```

### **Problema 3: Routing no funciona**

**Síntoma:** Los logs muestran redirección pero no cambia la pantalla

**Solución:**
- Verifica que `app/onboarding/welcome.tsx` existe
- Verifica que `app/onboarding/_layout.tsx` está configurado
- Limpia cache: `rm -rf .expo .expo-shared`

### **Problema 4: `isLoading` nunca se vuelve `false`**

**Síntoma:** La app se queda cargando

**Solución:**
- Verifica que `checkUser()` completa correctamente
- Verifica que no hay errores en `loadUserProfile`
- Revisa logs de errores en consola

---

## ✅ Solución Rápida (Todo-en-Uno)

```sql
-- 1. Actualizar en BD
UPDATE profiles 
SET onboarding_completed = false 
WHERE user_id = auth.uid();

-- 2. Verificar
SELECT user_id, onboarding_completed FROM profiles WHERE user_id = auth.uid();
```

Luego en la app:

```bash
# 3. Limpiar cache
rm -rf .expo .expo-shared node_modules/.cache

# 4. Reiniciar
npx expo start --clear
```

**5. Cerrar y reabrir la app completamente**

---

## 📋 Checklist Final

- [ ] `onboarding_completed = false` en BD
- [ ] Logs muestran `[Auth] ✅ User has not completed onboarding`
- [ ] `app/onboarding/welcome.tsx` existe
- [ ] Cache limpio
- [ ] App cerrada y reabierta completamente
- [ ] No hay errores en consola

